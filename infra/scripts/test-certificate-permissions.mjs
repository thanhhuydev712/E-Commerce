// Real POSIX permission regression, isolated in a disposable Docker volume.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const volume = "rigforce-cert-permissions-" + randomBytes(8).toString("hex");
const image = "rigforce-api:local";
const docker = (args) => {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(result.stderr || "Docker probe failed");
  return result.stdout;
};
let created = false;
try {
  docker(["volume", "create", volume]);
  created = true;
  const run = (user, entrypoint, args) =>
    docker([
      "run",
      "--rm",
      "--network",
      "none",
      "--user",
      user,
      "-v",
      `${volume}:/fixture`,
      "--entrypoint",
      entrypoint,
      image,
      ...args,
    ]);
  run("0", "sh", [
    "-ec",
    "chown 1001:1001 /fixture; chmod 700 /fixture; umask 077; openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /fixture/root.key",
  ]);
  run("1001:1001", "node", [
    "-e",
    `
    const fs=require('node:fs'),assert=require('node:assert/strict');
    assert.throws(()=>fs.copyFileSync('/fixture/root.key','/fixture/blocked.key'),{code:'EACCES'});
    assert.equal(fs.statSync('/fixture/root.key').mode & 0o777,0o600);
  `,
  ]);
  run("1001:1001", "openssl", [
    "genpkey",
    "-algorithm",
    "RSA",
    "-pkeyopt",
    "rsa_keygen_bits:2048",
    "-out",
    "/fixture/runner.key",
  ]);
  run("1001:1001", "node", [
    "-e",
    `
    const fs=require('node:fs'),assert=require('node:assert/strict');
    assert.equal(process.getuid(),1001);
    assert.equal(fs.statSync('/fixture/runner.key').uid,process.getuid());
    assert.equal(fs.statSync('/fixture/runner.key').mode & 0o777,0o600);
    fs.copyFileSync('/fixture/runner.key','/fixture/private-copy.key');
    assert.equal(fs.statSync('/fixture/private-copy.key').mode & 0o777,0o600);
    assert.deepEqual(fs.readFileSync('/fixture/runner.key'),fs.readFileSync('/fixture/private-copy.key'));
  `,
  ]);
  console.log(
    JSON.stringify({
      result: "passed",
      rootOwnedKeyReproducesEacces: true,
      runnerOwnedKeyCopies: true,
      privateKeyMode: "0600",
      platform: "Linux containers",
    }),
  );
} finally {
  assert(volume.startsWith("rigforce-cert-permissions-"));
  if (created) docker(["volume", "rm", volume]);
}
