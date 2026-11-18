import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function schemaFingerprint() {
  const base =
    "api/prisma/v2/migrations/20261105000000_commerce_v2_baseline/migration.sql";
  const later = fs
    .readdirSync(path.join(root, "api/prisma/migrations"))
    .filter(
      (name) =>
        name > "20261105010000_upgrade_v2_vnd" &&
        fs.existsSync(
          path.join(root, "api/prisma/migrations", name, "migration.sql"),
        ),
    )
    .sort();
  return hash(
    [
      base,
      ...later.map((name) => `api/prisma/migrations/${name}/migration.sql`),
    ]
      .map((name) => name + "\0" + hash(fs.readFileSync(path.join(root, name))))
      .join("\n"),
  );
}
export function validateManifest(manifest) {
  if (
    manifest.schemaVersion !== 1 ||
    !/^[a-f0-9]{40}$/.test(manifest.commit) ||
    !/^[a-f0-9]{64}$/.test(manifest.schemaFingerprint)
  )
    throw new Error("Invalid release identity");
  if (
    !["none", "backward-compatible", "maintenance-required"].includes(
      manifest.migrationPolicy,
    ) ||
    typeof manifest.sourceDirty !== "boolean"
  )
    throw new Error("Invalid migration/source policy");
  const imagePattern =
    /^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\/[a-z0-9][a-z0-9/_.-]*@sha256:[a-f0-9]{64}$/;
  for (const name of ["api", "front", "tools"])
    if (!imagePattern.test(manifest.images?.[name]))
      throw new Error("Use an immutable ECR digest for " + name);
  const registry = manifest.images.api.split("/")[0];
  if (
    Object.values(manifest.images).some(
      (image) => image.split("/")[0] !== registry,
    )
  )
    throw new Error("Images must use the same registry");
  return manifest;
}
function main() {
  const args = process.argv.slice(2);
  if (args.includes("--fingerprint")) {
    console.log(schemaFingerprint());
    return;
  }
  const option = (name) => {
    const index = args.indexOf("--" + name);
    if (index < 0 || !args[index + 1]) throw new Error("Missing --" + name);
    return args[index + 1];
  };
  const output = path.resolve(option("output"));
  if (fs.existsSync(output)) throw new Error("Output must be a new directory");
  const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const dirty = Boolean(
    execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim(),
  );
  if (dirty && !args.includes("--allow-dirty"))
    throw new Error("Release requires a clean committed checkout");
  const manifest = validateManifest({
    schemaVersion: 1,
    commit,
    images: {
      api: option("api"),
      front: option("front"),
      tools: option("tools"),
    },
    migrationPolicy: option("policy"),
    schemaFingerprint: schemaFingerprint(),
    sourceDirty: dirty,
  });
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), "rigforce-bundle-"));
  try {
    const copy = (relative) => {
      const source = path.join(root, relative),
        target = path.join(stage, relative);
      const stat = fs.lstatSync(source);
      if (stat.isSymbolicLink())
        throw new Error("No symlinks in release bundle");
      if (stat.isDirectory()) {
        for (const item of fs.readdirSync(source)) {
          if (
            relative === "infra/deploy" &&
            !/\.(sh|service|timer)$/.test(item)
          )
            continue;
          copy(relative + "/" + item);
        }
        return;
      }
      if (!stat.isFile() || /(^|\/)\.env|\.(pem|key|crt)$/.test(relative))
        throw new Error("Unexpected release file");
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(
        target,
        fs.readFileSync(source, "utf8").replaceAll("\r\n", "\n"),
      );
    };
    for (const name of [
      "compose.deploy.yaml",
      "compose.aws.yaml",
      "infra/nginx",
      "infra/deploy",
    ])
      copy(name);
    fs.writeFileSync(
      path.join(stage, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    fs.mkdirSync(output);
    const archive = path.join(output, "release.tar.gz");
    execFileSync("tar", [
      "-czf",
      archive,
      "-C",
      stage,
      "manifest.json",
      "compose.deploy.yaml",
      "compose.aws.yaml",
      "infra/nginx",
      "infra/deploy",
    ]);
    fs.writeFileSync(
      path.join(output, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    fs.writeFileSync(
      path.join(output, "release.sha256"),
      hash(fs.readFileSync(archive)) + "\n",
    );
    console.log(
      JSON.stringify({
        archive,
        sha256: hash(fs.readFileSync(archive)),
        commit,
        sourceDirty: dirty,
      }),
    );
  } finally {
    const resolved = path.resolve(stage);
    if (
      !resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) ||
      !path.basename(resolved).startsWith("rigforce-bundle-")
    )
      throw new Error("Unexpected temporary directory");
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
