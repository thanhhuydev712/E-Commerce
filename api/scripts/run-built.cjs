const { pathToFileURL } = require('node:url');
const { builtFile } = require('./build-path.cjs');
const entries = { api: ['main.js'], access: ['modules', 'access', 'seed-access.js'] };
const entry = entries[process.argv[2]];
if (!entry) throw new Error('Unknown compiled entrypoint');
import(pathToFileURL(builtFile(...entry)).href).catch(() => {
  console.error('Compiled entrypoint failed; run npm run build and check runtime configuration');
  process.exitCode = 1;
});
