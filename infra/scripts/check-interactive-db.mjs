// Disposable TLS PostgreSQL grant verification only; no host DB, AWS or UI.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const project = "rigforce-interactive-check-" + randomBytes(6).toString("hex");
const work = fs.mkdtempSync(path.join(os.tmpdir(), project + "-"));
const config = path.join(work, "compose.json");
const slash = (value) => value.replaceAll("\\", "/");
const passwords = Object.fromEntries(
  ["owner", "migrate", "runtime"].map((key) => [
    key,
    randomBytes(24).toString("hex"),
  ]),
);
const redact = (value) =>
  Object.values(passwords).reduce(
    (text, password) => text.replaceAll(password, "[redacted]"),
    String(value),
  );
const report = {
  date: new Date().toISOString(),
  scope: "Disposable TLS PostgreSQL; grants only, not API/AWS",
  checks: [],
  result: "running",
};
const output =
  process.env.INTERACTIVE_DB_REPORT ||
  path.join(os.tmpdir(), project + ".json");
const docker = (args, options = {}) => {
  const result = spawnSync("docker", args, {
    cwd: root,
    windowsHide: true,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    timeout: 180000,
    ...options,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      redact(result.error?.message || result.stderr || result.stdout).slice(
        -1200,
      ),
    );
  return result.stdout;
};
const compose = (...args) =>
  docker(["compose", "--project-name", project, "-f", config, ...args]);
const write = (name, content) =>
  fs.writeFileSync(path.join(work, name), content, { mode: 0o600 });
const mark = (label) => {
  report.checks.push(label);
  console.log("PASS " + label);
};
const url = (role, password) =>
  `postgresql://${role}:${password}@db:5432/interactive_check?sslmode=verify-full&sslrootcert=/run/certs/ca.crt`;
let configured = false;
try {
  fs.mkdirSync(path.join(work, "certs"));
  write("certs/db.ext", "subjectAltName=DNS:db\nextendedKeyUsage=serverAuth\n");
  docker([
    "run",
    "--rm",
    "--user",
    typeof process.getuid === "function"
      ? `${process.getuid()}:${process.getgid()}`
      : "1000:1000",
    "--entrypoint",
    "sh",
    "-v",
    slash(path.join(work, "certs")) + ":/out",
    "rigforce-api:local",
    "-ec",
    [
      "openssl req -x509 -newkey rsa:2048 -nodes -keyout /out/ca.key -out /out/ca.crt -days 2 -subj /CN=Interactive-Test-CA",
      "openssl req -newkey rsa:2048 -nodes -keyout /out/db.key -out /out/db.csr -subj /CN=db",
      "openssl x509 -req -in /out/db.csr -CA /out/ca.crt -CAkey /out/ca.key -CAcreateserial -out /out/db.crt -days 2 -extfile /out/db.ext",
    ].join(" && "),
  ]);
  write(
    "db.env",
    `POSTGRES_USER=fixture_owner\nPOSTGRES_PASSWORD=${passwords.owner}\nPOSTGRES_DB=interactive_check\n`,
  );
  write(
    "roles.env",
    `DB_ADMIN_URL=${url("fixture_owner", passwords.owner)}\nMIGRATION_PASSWORD=${passwords.migrate}\nRUNTIME_PASSWORD=${passwords.runtime}\n`,
  );
  const migration = new URL(url("rigforce_migrate", passwords.migrate));
  migration.searchParams.delete("sslrootcert");
  migration.searchParams.set("sslmode", "require");
  migration.searchParams.set("sslaccept", "strict");
  migration.searchParams.set("sslcert", "/run/certs/ca.crt");
  write(
    "migration.env",
    `DATABASE_URL=${url("rigforce_migrate", passwords.migrate)}\nPRISMA_MIGRATION_DATABASE_URL=${migration}\nDATABASE_SCHEMA=public\nDATABASE_TLS_REQUIRED=true\nNODE_EXTRA_CA_CERTS=/run/certs/ca.crt\n`,
  );
  write(
    "demo.env",
    `DB_ADMIN_URL=${url("fixture_owner", passwords.owner)}\nDATABASE_URL=${url("rigforce_app", passwords.runtime)}\nPREVIEW_READ_ONLY=true\nINTERACTIVE_DEMO=true\n`,
  );
  const tools = {
    image: "rigforce-api-tools:local",
    profiles: ["ops"],
    networks: ["isolated"],
    volumes: [
      `${slash(path.join(work, "certs"))}:/run/certs:ro`,
      `${slash(path.join(root, "api/scripts/setup-interactive-demo.cjs"))}:/app/api/scripts/setup-interactive-demo.cjs:ro`,
    ],
  };
  write(
    "compose.json",
    JSON.stringify({
      services: {
        db: {
          image:
            "postgres:17-bookworm@sha256:40865bc877a289da75963d97d72b59633f639fc5af7a4e856bfa3714cae5b536",
          env_file: [{ path: path.join(work, "db.env"), format: "raw" }],
          networks: ["isolated"],
          entrypoint: ["sh", "-ec"],
          command: [
            "cp /run/certs/db.key /tmp/db.key && chown postgres:postgres /tmp/db.key && chmod 600 /tmp/db.key && exec docker-entrypoint.sh postgres -c ssl=on -c ssl_cert_file=/run/certs/db.crt -c ssl_key_file=/tmp/db.key",
          ],
          volumes: [
            `${slash(path.join(work, "certs"))}:/run/certs:ro`,
            "database:/var/lib/postgresql/data",
          ],
          healthcheck: {
            test: [
              "CMD",
              "pg_isready",
              "-U",
              "fixture_owner",
              "-d",
              "interactive_check",
            ],
            interval: "2s",
            timeout: "3s",
            retries: 30,
          },
        },
        roles: {
          ...tools,
          env_file: [{ path: path.join(work, "roles.env"), format: "raw" }],
          entrypoint: ["node", "scripts/setup-db-roles.cjs"],
          command: ["--new-database"],
        },
        migrate: {
          ...tools,
          env_file: [{ path: path.join(work, "migration.env"), format: "raw" }],
          entrypoint: ["node", "scripts/migrate-docker.cjs"],
        },
        demo: {
          ...tools,
          env_file: [{ path: path.join(work, "demo.env"), format: "raw" }],
          entrypoint: ["node", "scripts/setup-interactive-demo.cjs"],
          command: ["--enable-interactive-demo"],
        },
      },
      volumes: { database: {} },
      networks: { isolated: { internal: true } },
    }),
  );
  configured = true;
  compose("up", "-d", "--wait", "--wait-timeout", "90", "db");
  compose("--profile", "ops", "run", "--rm", "roles");
  compose("--profile", "ops", "run", "--rm", "migrate");
  mark(
    "fresh schema migrated using verified PostgreSQL TLS and separate roles",
  );
  const probe = (code) =>
    docker([
      "compose",
      "--project-name",
      project,
      "-f",
      config,
      "--profile",
      "ops",
      "run",
      "--rm",
      "--no-deps",
      "-T",
      "--entrypoint",
      "node",
      "demo",
      "-e",
      code,
    ]);
  probe(
    `const {Client}=require('pg');(async()=>{const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();try{const tls=await db.query('SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()');if(!tls.rows[0]?.ssl)throw Error('TLS required');try{await db.query('INSERT INTO public.carts DEFAULT VALUES');throw Error('Unexpected write');}catch(e){if(e.code!=='42501')throw e;}}finally{await db.end();}})().catch(()=>process.exit(1));`,
  );
  mark("runtime starts SELECT-only and its connection uses TLS");
  compose("--profile", "ops", "run", "--rm", "demo");
  compose("--profile", "ops", "run", "--rm", "demo");
  probe(
    `const {PrismaClient}=require('./generated/prisma-v2');const {PrismaPg}=require('@prisma/adapter-pg');const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL},{schema:'public'})});(async()=>{try{await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtextextended($1,20261120))','public:demo-product:fixture');});}finally{await db.$disconnect();}})().catch(error=>{console.error(error.code||'PRISMA_LOCK_FAILED');process.exit(1)});`,
  );
  mark(
    "grant helper is idempotent and Prisma executeRaw handles the advisory lock",
  );
  const result = JSON.parse(
    probe(`
    const assert=require('node:assert/strict');const {Client}=require('pg');const {randomUUID}=require('node:crypto');
    (async()=>{
      const db=new Client({connectionString:process.env.DB_ADMIN_URL});await db.connect();
      const ids=Object.fromEntries(['user','product','variant','session','family','audit','cart','item','build'].map(k=>[k,randomUUID()]));
      try{
        await db.query('BEGIN');
        await db.query("INSERT INTO public.users(id,email,password_hash,status,updated_at) VALUES($1,'fixture@example.invalid','fixture-not-a-password','ACTIVE',now())",[ids.user]);
        await db.query("INSERT INTO public.currencies(code,name,minor_unit,is_active,updated_at) VALUES('VND','Fixture VND',0,true,now()) ON CONFLICT DO NOTHING");
        await db.query("INSERT INTO public.products(id,name,slug,status,updated_at) VALUES($1,'Fixture product','fixture-product','ACTIVE',now())",[ids.product]);
        await db.query("INSERT INTO public.product_variants(id,product_id,sku,option_signature,status,updated_at) VALUES($1,$2,'FIXTURE-SKU','','ACTIVE',now())",[ids.variant,ids.product]);
        // Same transaction keeps all fixtures disposable. SET LOCAL ROLE makes
        // PostgreSQL enforce the real runtime role's effective privileges.
        await db.query('SET LOCAL ROLE rigforce_app');
        assert.equal((await db.query('SELECT current_user AS role')).rows[0].role,'rigforce_app');
        await db.query('SELECT id FROM public.users WHERE id=$1 FOR UPDATE',[ids.user]);
        await db.query("INSERT INTO public.auth_sessions(id,user_id,family_id,token_hash,expires_at,updated_at) VALUES($1,$2,$3,'fixture-hash',now()+interval '1 hour',now())",[ids.session,ids.user,ids.family]);
        await db.query("UPDATE public.auth_sessions SET token_hash='rotated',previous_token_hash='fixture-hash',rotated_at=now(),revoked_at=now(),revoke_reason='LOGOUT',updated_at=now() WHERE id=$1",[ids.session]);
        await db.query("INSERT INTO public.audit_logs(id,actor_id,actor_type,action,entity_type,entity_id) VALUES($1,$2,'USER','SESSION_LOGIN','USER',$3)",[ids.audit,ids.user,ids.user]);
        await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,20261120))',['public:demo-product:'+ids.product]);
        await db.query('SELECT id FROM public.products WHERE id=$1',[ids.product]);
        await db.query("INSERT INTO public.carts(id,user_id,currency_code,status,updated_at) VALUES($1,$2,'VND','ACTIVE',now())",[ids.cart,ids.user]);
        await db.query('INSERT INTO public.cart_items(id,cart_id,variant_id,quantity,updated_at) VALUES($1,$2,$3,1,now())',[ids.item,ids.cart,ids.variant]);
        await db.query('UPDATE public.cart_items SET quantity=2,updated_at=now() WHERE id=$1',[ids.item]);
        await db.query('UPDATE public.carts SET version=version+1,updated_at=now() WHERE id=$1',[ids.cart]);
        await db.query('DELETE FROM public.cart_items WHERE id=$1',[ids.item]);
        await db.query("INSERT INTO public.saved_pc_builds(id,user_id,name,updated_at) VALUES($1,$2,'Fixture build',now())",[ids.build,ids.user]);
        await db.query("INSERT INTO public.saved_pc_build_components(build_id,slot,product_id) VALUES($1,'cpu',$2)",[ids.build,ids.product]);
        assert.equal((await db.query('SELECT count(*)::int AS n FROM public.saved_pc_build_components WHERE build_id=$1',[ids.build])).rows[0].n,1);
        await db.query('DELETE FROM public.saved_pc_builds WHERE id=$1',[ids.build]);
        assert.equal((await db.query('SELECT count(*)::int AS n FROM public.saved_pc_build_components WHERE build_id=$1',[ids.build])).rows[0].n,0);
        let denied=0;
        for(const sql of [
          'UPDATE public.products SET name=name WHERE false',
          'SELECT id FROM public.products FOR UPDATE',
          'UPDATE public.variant_prices SET amount=amount WHERE false',
          'UPDATE public.orders SET status=status WHERE false',
          'UPDATE public.inventory_balances SET on_hand=on_hand WHERE false',
          'UPDATE public.payments SET status=status WHERE false',
          'UPDATE public.users SET password_hash=password_hash WHERE false',
          'UPDATE public.users SET status=status WHERE false',
          'DELETE FROM public.user_roles WHERE false',
          'DELETE FROM public.audit_logs WHERE false',
          'DELETE FROM public.auth_sessions WHERE false',
        ]){
          await db.query('SAVEPOINT denied_write');
          try{await db.query(sql);assert.fail('Forbidden write succeeded');}
          catch(error){assert.equal(error.code,'42501');denied++;}
          finally{await db.query('ROLLBACK TO SAVEPOINT denied_write');}
        }
        await db.query('ROLLBACK');
        assert.equal((await db.query('SELECT count(*)::int AS n FROM public.users WHERE id=$1',[ids.user])).rows[0].n,0);
        assert.equal((await db.query('SELECT count(*)::int AS n FROM public.auth_sessions WHERE id=$1',[ids.session])).rows[0].n,0);
        assert.equal((await db.query('SELECT count(*)::int AS n FROM public.carts WHERE id=$1',[ids.cart])).rows[0].n,0);
        console.log(JSON.stringify({authCartBuildWrites:true,cascade:true,denied,rollback:true}));
      }catch(error){await db.query('ROLLBACK').catch(()=>{});throw error;}finally{await db.end();}
    })().catch(error=>{console.error(error.code||'PROBE_FAILED');process.exit(1)});
  `),
  );
  assert(result.authCartBuildWrites && result.rollback);
  mark(
    "runtime auth/session/audit and cart operations succeed; all fixture data rolled back",
  );
  assert.equal(result.cascade, true);
  mark(
    "saved-PC parent delete cascades to components without child DELETE grant",
  );
  assert.equal(result.denied, 11);
  mark(
    "11 catalog/order/stock/payment/identity/role writes fail with SQLSTATE 42501",
  );
  report.result = "passed";
} catch (error) {
  report.result = "failed";
  report.error = redact(error.message);
  process.exitCode = 1;
} finally {
  if (configured) {
    try {
      const ids = compose("ps", "-aq").trim().split(/\s+/).filter(Boolean);
      for (const id of ids)
        assert.equal(
          JSON.parse(docker(["inspect", id]))[0].Config.Labels[
            "com.docker.compose.project"
          ],
          project,
        );
      for (const name of docker([
        "volume",
        "ls",
        "--filter",
        `label=com.docker.compose.project=${project}`,
        "--format",
        "{{.Name}}",
      ])
        .trim()
        .split(/\s+/)
        .filter(Boolean))
        assert.equal(
          JSON.parse(docker(["volume", "inspect", name]))[0].Labels[
            "com.docker.compose.project"
          ],
          project,
        );
      compose("--profile", "ops", "down", "--volumes", "--remove-orphans");
      report.cleanup = "passed";
    } catch (error) {
      report.cleanup = "failed";
      report.cleanupError = redact(error.message);
      process.exitCode = 1;
    }
  }
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, reportFile: output }, null, 2));
  const resolved = path.resolve(work);
  assert(
    resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) &&
      path.basename(resolved).startsWith(project + "-"),
  );
  fs.rmSync(resolved, { recursive: true, force: true });
}
