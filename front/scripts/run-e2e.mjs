import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const api = fileURLToPath(new URL("../../api/", import.meta.url));
const result = spawnSync(process.execPath, [path.join(api, "test/run-fullstack.cjs"), ...process.argv.slice(2)], {
  cwd: api, env: { ...process.env, LIVE_INCLUDE_UI: "1" }, stdio: "inherit", windowsHide: true,
});
process.exit(result.status ?? 1);
