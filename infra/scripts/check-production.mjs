// Isolated TLS/preview/roles/restore exercise. Never connects to the host development DB.
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const work = fs.mkdtempSync(path.join(os.tmpdir(), "rigforce-prod-check-"));
const project = "rigforce-check-" + randomBytes(5).toString("hex");
const started = Date.now();
const report = {
  date: new Date().toISOString(),
  scope: "Isolated Docker production configuration; not AWS",
  checks: [],
  result: "running",
};
const output =
  process.env.PRODUCTION_REPORT || path.join(os.tmpdir(), project + ".json");
const slash = (value) => value.replaceAll("\\", "/");
const envPath = path.join(work, "compose.env");
const overridePath = path.join(work, "override.json");
const composeArgs = [
  "compose",
  "--project-name",
  project,
  "--env-file",
  envPath,
  "-f",
  path.join(root, "compose.deploy.yaml"),
  "-f",
  overridePath,
];
const docker = (args, options = {}) => {
  const result = spawnSync("docker", args, {
    cwd: root,
    windowsHide: true,
    encoding: options.binary ? undefined : "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure)
    throw new Error(
      "Docker step failed; exit " +
        result.status +
        ": " +
        String(result.stderr || "").slice(-900),
    );
  return result;
};
const run = (args, options) => docker([...composeArgs, ...args], options);
const write = (name, body) =>
  fs.writeFileSync(path.join(work, name), body, { mode: 0o600 });
const mark = (label) => {
  report.checks.push(label);
  console.log("PASS " + label);
};
const check = (
  route,
  method = "GET",
  ca = fs.readFileSync(path.join(work, "certs/ca.crt")),
) =>
  new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "127.0.0.1",
        servername: "localhost",
        port: 8443,
        path: route,
        method,
        ca,
        rejectUnauthorized: true,
        timeout: 15000,
      },
      (response) => {
        const chunks = [];
        response.on("data", (c) => chunks.push(c));
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            body: Buffer.concat(chunks).toString(),
            headers: response.headers,
          }),
        );
      },
    );
    request.on("error", reject);
    request.on("timeout", () => request.destroy(new Error("HTTPS timeout")));
    request.end();
  });
const pgUrl = (user, password) =>
  `postgresql://${user}:${password}@db:5432/rigforce_db?sslmode=verify-full&sslrootcert=/run/certs/rds-global-bundle.pem`;
const passwords = {
  owner: randomBytes(24).toString("hex"),
  migrate: randomBytes(24).toString("hex"),
  runtime: randomBytes(24).toString("hex"),
};
let configured = false;
try {
  for (const port of [8081, 8443])
    await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once("error", () =>
        reject(
          new Error(
            `Port ${port} is occupied; stop this check without touching another service`,
          ),
        ),
      );
      server.listen({ host: "0.0.0.0", port }, () => server.close(resolve));
    });
  fs.mkdirSync(path.join(work, "certs"));
  fs.mkdirSync(path.join(work, "letsencrypt/live/localhost"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(work, "acme"));
  write("certs/db.ext", "subjectAltName=DNS:db\nextendedKeyUsage=serverAuth\n");
  write(
    "certs/web.ext",
    "subjectAltName=DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n",
  );
  docker([
    "run",
    "--rm",
    "--user",
    "0",
    "--entrypoint",
    "sh",
    "-v",
    slash(path.join(work, "certs")) + ":/out",
    "rigforce-api:local",
    "-ec",
    [
      "openssl req -x509 -newkey rsa:2048 -nodes -keyout /out/ca.key -out /out/ca.crt -days 2 -subj /CN=Rigforce-Test-CA",
      "openssl req -x509 -newkey rsa:2048 -nodes -keyout /out/wrong.key -out /out/wrong.crt -days 2 -subj /CN=Wrong-Test-CA",
      ...["db", "web"].flatMap((name) => [
        `openssl req -newkey rsa:2048 -nodes -keyout /out/${name}.key -out /out/${name}.csr -subj /CN=${name === "db" ? "db" : "localhost"}`,
        `openssl x509 -req -in /out/${name}.csr -CA /out/ca.crt -CAkey /out/ca.key -CAcreateserial -out /out/${name}.crt -days 2 -extfile /out/${name}.ext`,
      ]),
    ].join(" && "),
  ]);
  fs.copyFileSync(
    path.join(work, "certs/ca.crt"),
    path.join(work, "certs/rds-global-bundle.pem"),
  );
  fs.copyFileSync(
    path.join(work, "certs/web.key"),
    path.join(work, "letsencrypt/live/localhost/privkey.pem"),
  );
  write(
    "letsencrypt/live/localhost/fullchain.pem",
    fs.readFileSync(path.join(work, "certs/web.crt"), "utf8") +
      fs.readFileSync(path.join(work, "certs/ca.crt"), "utf8"),
  );
  const migrationUrl = pgUrl("rigforce_migrate", passwords.migrate);
  const cli = new URL(migrationUrl);
  cli.searchParams.delete("sslrootcert");
  cli.searchParams.set("sslmode", "require");
  cli.searchParams.set("sslaccept", "strict");
  cli.searchParams.set("sslcert", "/run/certs/rds-global-bundle.pem");
  write(
    "runtime.env",
    [
      `DATABASE_URL=${pgUrl("rigforce_app", passwords.runtime)}`,
      "DATABASE_SCHEMA=public",
      `JWT_SECRET=${randomBytes(32).toString("hex")}`,
      `JWT_REFRESH_SECRET=${randomBytes(32).toString("hex")}`,
      "ALLOWED_ORIGINS=https://localhost:8443",
      "STOREFRONT_URL=https://localhost:8443",
      "",
    ].join("\n"),
  );
  write(
    "migration.env",
    `DATABASE_URL=${migrationUrl}\nPRISMA_MIGRATION_DATABASE_URL=${cli}\nDATABASE_SCHEMA=public\n`,
  );
  write(
    "roles.env",
    `DB_ADMIN_URL=${pgUrl("rigforce_owner", passwords.owner)}\nMIGRATION_PASSWORD=${passwords.migrate}\nRUNTIME_PASSWORD=${passwords.runtime}\n`,
  );
  write(
    "compose.env",
    [
      "DEPLOY_ENVIRONMENT=check",
      "API_IMAGE=rigforce-api:local",
      "FRONT_IMAGE=rigforce-front:local",
      "TOOLS_IMAGE=rigforce-api-tools:local",
      `SHARED_DIR=${slash(work)}`,
      "DOMAIN_NAME=localhost",
      "BIND_ADDRESS=127.0.0.1",
      "HTTP_PORT=8081",
      "HTTPS_PORT=8443",
      "AWS_REGION=ap-southeast-1",
      "CONTAINER_LOG_GROUP=/rigforce/check/containers",
      "",
    ].join("\n"),
  );
  const baseDb = {
    image:
      "postgres:17-bookworm@sha256:40865bc877a289da75963d97d72b59633f639fc5af7a4e856bfa3714cae5b536",
    environment: {
      POSTGRES_USER: "rigforce_owner",
      POSTGRES_PASSWORD: passwords.owner,
      POSTGRES_DB: "rigforce_db",
    },
    networks: ["app"],
    healthcheck: {
      test: ["CMD-SHELL", "pg_isready -U rigforce_owner -d rigforce_db"],
      interval: "2s",
      timeout: "3s",
      retries: 30,
    },
  };
  const tools = {
    image: "rigforce-api-tools:local",
    profiles: ["ops"],
    networks: ["app"],
    volumes: [`${slash(path.join(work, "certs"))}:/run/certs:ro`],
    depends_on: { db: { condition: "service_healthy" } },
  };
  const override = {
    services: {
      db: {
        ...baseDb,
        entrypoint: ["sh", "-ec"],
        command: [
          "cp /run/certs/db.key /tmp/db.key && chown postgres:postgres /tmp/db.key && chmod 600 /tmp/db.key && exec docker-entrypoint.sh postgres -c ssl=on -c ssl_cert_file=/run/certs/db.crt -c ssl_key_file=/tmp/db.key",
        ],
        volumes: [
          `${slash(path.join(work, "certs"))}:/run/certs:ro`,
          "test_db:/var/lib/postgresql/data",
        ],
      },
      roles: {
        ...tools,
        env_file: [{ path: path.join(work, "roles.env"), format: "raw" }],
        entrypoint: ["node", "scripts/setup-db-roles.cjs"],
        command: ["--new-database"],
      },
      "asset-copy": {
        image: "rigforce-front:local",
        profiles: ["ops"],
        user: "0",
        entrypoint: ["sh", "-ec"],
        command: ["cp -a /app/front/public/images/. /seed/"],
        volumes: ["seed_assets:/seed"],
      },
      seed: {
        ...tools,
        env_file: [{ path: path.join(work, "migration.env"), format: "raw" }],
        environment: {
          NODE_ENV: "development",
          MEDIA_ROOT: "/app/api/.local-media",
        },
        entrypoint: ["sh", "-ec"],
        command: [
          "node scripts/run-built.cjs access && node prisma/seed-storefront.cjs --apply",
        ],
        volumes: [
          ...tools.volumes,
          "media_data:/app/api/.local-media",
          "seed_assets:/app/front/public/images:ro",
        ],
      },
      "restore-db": {
        ...baseDb,
        profiles: ["recovery"],
        volumes: ["restore_db:/var/lib/postgresql/data"],
      },
      "restore-media": {
        image: "rigforce-api:local",
        profiles: ["recovery"],
        user: "0",
        networks: ["app"],
        volumes: ["restore_media:/restore"],
      },
    },
    volumes: {
      test_db: {},
      restore_db: {},
      restore_media: {},
      seed_assets: {},
    },
  };
  write("override.json", JSON.stringify(override));
  configured = true;
  const awsConfig = JSON.parse(
    docker([
      "compose",
      "--env-file",
      envPath,
      "-f",
      path.join(root, "compose.deploy.yaml"),
      "-f",
      path.join(root, "compose.aws.yaml"),
      "config",
      "--format",
      "json",
    ]).stdout,
  );
  for (const name of ["api", "front", "migrate", "nginx"]) {
    assert.equal(awsConfig.services[name].logging.driver, "awslogs");
    assert(
      !Object.hasOwn(awsConfig.services[name].logging.options, "max-size"),
    );
    assert(
      !Object.hasOwn(awsConfig.services[name].logging.options, "max-file"),
    );
  }
  mark("AWS Compose override validates and replaces local logging options");
  run(["up", "-d", "--wait", "--wait-timeout", "90", "db"]);
  mark("dedicated TLS PostgreSQL ready");
  run(["--profile", "ops", "run", "--rm", "roles"]);
  mark("separate migration owner and SELECT-only runtime role");
  run(["run", "--rm", "migrate"]);
  mark("fresh migrations verify PostgreSQL TLS");
  run(["--profile", "ops", "run", "--rm", "asset-copy"]);
  run(["--profile", "ops", "run", "--rm", "seed"]);
  mark("seed sample catalog using assets from the frontend image");
  run(["run", "--rm", "migrate"]);
  mark(
    "repeat migration verifies existing SQL checksums without changing schema",
  );
  run(["up", "-d", "--wait", "--wait-timeout", "180", "api", "front", "nginx"]);
  mark("production API/frontend/Nginx healthy");
  const homepage = await check("/");
  assert.equal(homepage.status, 200);
  assert.match(homepage.body, /Bản giới thiệu/);
  const catalog = await check("/api/v1/storefront");
  assert.equal(catalog.status, 200);
  assert.match(catalog.body, /products/);
  const login = await check("/login");
  assert.equal(login.status, 200);
  assert.doesNotMatch(login.body, /<input[^>]+type="password"/);
  await assert.rejects(
    check("/", "GET", fs.readFileSync(path.join(work, "certs/wrong.crt"))),
  );
  mark("HTTPS validates the expected CA and rejects a wrong CA");
  for (const [method, route, status] of [
    ["POST", "/api/v1/me/orders", 503],
    ["POST", "/api/v1/auth/register", 503],
    ["POST", "/api/v1/webhooks/stripe", 503],
    ["GET", "/api/v1/me/orders", 401],
    ["GET", "/api/v1/admin/products", 401],
    ["GET", "/api/docs", 404],
    ["GET", "/api/v1/health/ready", 404],
  ])
    assert.equal((await check(route, method)).status, status, route);
  mark("preview blocks mutations/private data, Swagger and external readiness");
  if (process.env.PRODUCTION_BROWSER_CHECK === "1") {
    const require = createRequire(path.join(root, "front/package.json"));
    const { chromium } = require("@playwright/test");
    const browser = await chromium.launch({ headless: true });
    try {
      for (const width of [390, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          ignoreHTTPSErrors: true,
          reducedMotion: "reduce",
        });
        await context.addCookies([
          {
            name: "rigforce-welcome-v1",
            value: "seen",
            url: "https://localhost:8443",
            secure: true,
          },
        ]);
        const page = await context.newPage(),
          errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        for (const route of ["/", "/products", "/pc-builder", "/login"]) {
          assert.equal(
            (
              await page.goto("https://localhost:8443" + route, {
                waitUntil: "networkidle",
              })
            ).status(),
            200,
          );
          assert.equal(await page.locator('input[type="password"]').count(), 0);
          await page
            .getByText("Bản giới thiệu · Dữ liệu minh họa", { exact: false })
            .first()
            .waitFor({ state: "visible", timeout: 15000 });
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          );
        }
        assert.deepEqual(errors, []);
        await context.close();
      }
    } finally {
      await browser.close();
    }
    mark("Chromium preview across four routes and two viewport widths");
  }
  const runtimeProbe = `const {Client}=require('pg');(async()=>{const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();try{await db.query('BEGIN');await db.query("INSERT INTO public.users(id,email,password_hash,status) VALUES(gen_random_uuid(),'probe@example.invalid','fixture','ACTIVE')");throw new Error('Runtime role can write');}catch(e){if(e.code!=='42501')throw e;}finally{await db.query('ROLLBACK');await db.end();}})().catch(()=>process.exit(1));`;
  run(["exec", "-T", "api", "node", "-e", runtimeProbe]);
  mark("runtime database rejects INSERT (42501)");
  const badPg = `const {Client}=require('pg');(async()=>{const u=new URL(process.env.DATABASE_URL);u.searchParams.set('sslrootcert','/run/certs/wrong.crt');const db=new Client({connectionString:String(u)});try{await db.connect();await db.end();process.exitCode=1;}catch(e){if(!/CERT|SELF_SIGNED|ISSUER|UNABLE_TO_VERIFY_LEAF_SIGNATURE/.test(e.code||''))throw e;}})().catch(()=>process.exit(1));`;
  run([
    "--profile",
    "ops",
    "run",
    "--rm",
    "--entrypoint",
    "node",
    "seed",
    "-e",
    badPg,
  ]);
  mark("PostgreSQL driver rejects a wrong database CA");
  const badCli = `const {spawnSync}=require('node:child_process');const url=new URL(process.env.PRISMA_MIGRATION_DATABASE_URL);url.searchParams.set('sslcert','/run/certs/wrong.crt');const r=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','status','--config','prisma.docker.config.ts'],{env:{...process.env,DATABASE_URL:String(url)},encoding:'utf8'});if(r.status===0||!/TLS|certificate|SSL/i.test(r.stdout+r.stderr))process.exit(1);`;
  run([
    "--profile",
    "ops",
    "run",
    "--rm",
    "--entrypoint",
    "node",
    "seed",
    "-e",
    badCli,
  ]);
  mark("Prisma migration driver rejects a wrong database CA");
  const restoreStart = Date.now();
  const dump = run(
    [
      "exec",
      "-T",
      "db",
      "pg_dump",
      "-U",
      "rigforce_owner",
      "-d",
      "rigforce_db",
      "-Fc",
      "--no-owner",
      "--no-acl",
    ],
    { binary: true },
  ).stdout;
  run(["--profile", "recovery", "up", "-d", "--wait", "restore-db"]);
  run(
    [
      "exec",
      "-T",
      "restore-db",
      "pg_restore",
      "-U",
      "rigforce_owner",
      "-d",
      "rigforce_db",
      "--no-owner",
      "--no-acl",
    ],
    { input: dump, binary: true },
  );
  const countArgs = [
    "psql",
    "-U",
    "rigforce_owner",
    "-d",
    "rigforce_db",
    "-Atc",
    "SELECT count(*) FROM public.products",
  ];
  const before = run(["exec", "-T", "db", ...countArgs]).stdout.trim(),
    after = run(["exec", "-T", "restore-db", ...countArgs]).stdout.trim();
  assert.equal(before, after);
  assert.equal(Number(after), 183);
  const media = run(
    [
      "exec",
      "-T",
      "api",
      "tar",
      "-C",
      "/app/api/.local-media",
      "-cf",
      "-",
      ".",
    ],
    { binary: true },
  ).stdout;
  run(
    [
      "--profile",
      "recovery",
      "run",
      "--rm",
      "-T",
      "--entrypoint",
      "sh",
      "restore-media",
      "-ec",
      "tar -xf - -C /restore",
    ],
    { input: media, binary: true },
  );
  const digestScript = `const fs=require('fs'),c=require('crypto');const dir=process.argv[1];const items=fs.readdirSync(dir).sort().map(n=>n+':'+c.createHash('sha256').update(fs.readFileSync(dir+'/'+n)).digest('hex'));console.log(c.createHash('sha256').update(items.join('\\n')).digest('hex'));`;
  const original = run([
    "exec",
    "-T",
    "api",
    "node",
    "-e",
    digestScript,
    "/app/api/.local-media",
  ]).stdout.trim();
  const restored = run([
    "--profile",
    "recovery",
    "run",
    "--rm",
    "--entrypoint",
    "node",
    "restore-media",
    "-e",
    digestScript,
    "/restore",
  ]).stdout.trim();
  assert.equal(original, restored);
  report.restore = {
    products: Number(after),
    mediaFilesDigest: restored,
    seconds: (Date.now() - restoreStart) / 1000,
    databaseDumpSha256: createHash("sha256").update(dump).digest("hex"),
  };
  mark("restore into a second database and volume preserves catalog/media");
  run([
    "up",
    "-d",
    "--force-recreate",
    "--wait",
    "--wait-timeout",
    "180",
    "api",
    "front",
    "nginx",
  ]);
  assert.equal((await check("/api/v1/storefront")).status, 200);
  assert.equal(
    run([
      "exec",
      "-T",
      "api",
      "node",
      "-e",
      digestScript,
      "/app/api/.local-media",
    ]).stdout.trim(),
    original,
  );
  mark(
    "recreating application containers preserves database and media volumes",
  );
  report.result = "passed";
} catch (error) {
  report.result = "failed";
  report.error = String(error.message)
    .replaceAll(passwords.owner, "[redacted]")
    .replaceAll(passwords.migrate, "[redacted]")
    .replaceAll(passwords.runtime, "[redacted]");
  process.exitCode = 1;
} finally {
  if (configured)
    docker(
      [
        ...composeArgs,
        "--profile",
        "ops",
        "--profile",
        "recovery",
        "down",
        "--volumes",
        "--remove-orphans",
      ],
      { allowFailure: true },
    );
  report.seconds = (Date.now() - started) / 1000;
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, reportFile: output }, null, 2));
  const resolved = path.resolve(work),
    temp = path.resolve(os.tmpdir()) + path.sep;
  assert(
    resolved.startsWith(temp) &&
      path.basename(resolved).startsWith("rigforce-prod-check-"),
  );
  fs.rmSync(resolved, { recursive: true, force: true });
}
