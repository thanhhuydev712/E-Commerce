import test from "node:test";
import assert from "node:assert/strict";
import { validateManifest, schemaFingerprint } from "./package-release.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
const image = (name) =>
  `123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/rigforce/staging/${name}@sha256:${"a".repeat(64)}`;
const valid = () => ({
  schemaVersion: 1,
  commit: "b".repeat(40),
  schemaFingerprint: schemaFingerprint(),
  migrationPolicy: "none",
  sourceDirty: false,
  images: { api: image("api"), front: image("front"), tools: image("api") },
});
test("accept immutable same-registry release and reject mutable/foreign references", () => {
  assert.equal(validateManifest(valid()).schemaVersion, 1);
  for (const bad of [
    "nginx:latest",
    image("api").replace("@sha256:" + "a".repeat(64), ":main"),
    image("api").replace("123456789012", "999999999999"),
  ]) {
    const fixture = valid();
    fixture.images.tools = bad;
    assert.throws(() => validateManifest(fixture));
  }
});
test("reject malformed source/schema/migration contracts", () => {
  for (const patch of [
    { schemaVersion: 2 },
    { commit: "main" },
    { schemaFingerprint: "bad" },
    { migrationPolicy: "auto" },
    { sourceDirty: "false" },
  ])
    assert.throws(() => validateManifest({ ...valid(), ...patch }));
  assert.match(schemaFingerprint(), /^[a-f0-9]{64}$/);
});
test("bundle excludes env examples, certificates and source, records dirty fixtures", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "rigforce-release-test-"));
  try {
    const out = path.join(work, "output");
    execFileSync(process.execPath, [
      "infra/scripts/package-release.mjs",
      "--output",
      out,
      "--api",
      image("api"),
      "--front",
      image("front"),
      "--tools",
      image("api"),
      "--policy",
      "none",
      "--allow-dirty",
    ]);
    const names = execFileSync(
      "tar",
      ["-tzf", path.join(out, "release.tar.gz")],
      { encoding: "utf8" },
    )
      .trim()
      .split(/\r?\n/);
    assert(names.includes("manifest.json"));
    assert(names.includes("infra/deploy/certificate.sh"));
    assert(
      names.every(
        (name) =>
          !/(^|\/)\.env|\.env\.example$|\.(pem|key|crt)$|node_modules|^front\/|^api\//.test(
            name,
          ),
      ),
    );
    const manifest = JSON.parse(
      fs.readFileSync(path.join(out, "manifest.json"), "utf8"),
    );
    validateManifest(manifest);
  } finally {
    const resolved = path.resolve(work);
    assert(
      resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) &&
        path.basename(resolved).startsWith("rigforce-release-test-"),
    );
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
