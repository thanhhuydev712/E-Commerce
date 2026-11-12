const { spawn } = require('node:child_process');
const path = require('node:path');
const { root, compilerConfig } = require('./build-path.cjs');
const [command, ...args] = process.argv.slice(2);
if (!['build', 'start'].includes(command)) throw new Error('Expected build or start');
const child = spawn(process.execPath, [path.join(root, 'node_modules/@nestjs/cli/bin/nest.js'), command,
  '--path', compilerConfig(), ...args], { cwd: root, stdio: 'inherit', windowsHide: true });
child.once('error', () => { console.error('Nest process could not start'); process.exitCode = 1; });
child.once('exit', (code) => { process.exitCode = code ?? 1; });
