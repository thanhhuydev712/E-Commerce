const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
// Sandbox and desktop accounts have different Windows ACLs. Each account owns
// its own output; Linux keeps dist for production packaging.
const identity = process.platform === 'win32'
  ? createHash('sha256').update(execFileSync('whoami.exe', { encoding: 'utf8', windowsHide: true }).trim().toLowerCase()).digest('hex').slice(0, 12)
  : '';
const directory = path.join(root, identity ? `dist-local-${identity}` : 'dist');
const builtFile = (...segments) => path.join(directory, ...segments);
function compilerConfig() {
  const cache = path.join(root, '.tmp');
  fs.mkdirSync(cache, { recursive: true });
  const config = path.join(cache, `tsconfig-runtime-${identity || 'linux'}.json`);
  const content = JSON.stringify({
    extends: '../tsconfig.build.json',
    compilerOptions: { outDir: directory, tsBuildInfoFile: builtFile('tsconfig.build.tsbuildinfo') },
  }, null, 2) + '\n';
  if (!fs.existsSync(config) || fs.readFileSync(config, 'utf8') !== content)
    fs.writeFileSync(config, content);
  return config;
}
module.exports = { root, directory, builtFile, compilerConfig };
