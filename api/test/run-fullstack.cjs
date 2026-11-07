// Chạy FE–BE thật trên PostgreSQL schema riêng; không seed/truncate public.
require('dotenv/config');
const { Client } = require('pg');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomBytes, randomUUID } = require('node:crypto');
const { createServer } = require('node:net');
const root = path.resolve(__dirname, '..'),
  front = path.resolve(root, '../front');
const schema = `codex_live_test_${randomUUID().replaceAll('-', '')}`;
const mediaRoot = path.join(root, '.tmp', schema);
const base = 'http://127.0.0.1:3002',
  apiBase = 'http://127.0.0.1:3401';
const children = [];
function stop(child) {
  if (!child?.pid) return;
  try {
    if (process.platform === 'win32')
      execFileSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    else child.kill('SIGTERM');
  } catch {}
}
async function waitFor(url, child) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null)
      throw new Error('Application exited before readiness');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Application readiness timeout');
}
async function run() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Refusing fullstack development tests in production');
  const connection = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!connection) throw new Error('TEST_DATABASE_URL is required');
  const db = new Client({
    connectionString: connection,
    connectionTimeoutMillis: 15000,
    statement_timeout: 120000,
  });
  let created = false,
    connected = false;
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: connection,
    DATABASE_SCHEMA: schema,
    JWT_SECRET: randomBytes(48).toString('hex'),
    JWT_REFRESH_SECRET: randomBytes(48).toString('hex'),
    ALLOWED_ORIGINS: base,
    MEDIA_ROOT: mediaRoot,
    PORT: '3401',
  };
  delete env.STRIPE_SECRET_KEY;
  delete env.STRIPE_WEBHOOK_SECRET;
  try {
    await db.connect();
    connected = true;
    await db.query('BEGIN');
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.query(`SET LOCAL search_path TO "${schema}"`);
    for (const file of [
      'prisma/v2/migrations/20261105000000_commerce_v2_baseline/migration.sql',
      'prisma/migrations/20261106010000_storefront_saved_builds/migration.sql',
    ]) {
      const sql = await fs.readFile(path.join(root, file), 'utf8');
      await db.query(
        sql.replace(/^BEGIN;\s*$/m, '').replace(/COMMIT;\s*$/, ''),
      );
    }
    await db.query('COMMIT');
    created = true;
    execFileSync(process.execPath, ['prisma/seed-storefront.cjs', '--apply'], {
      cwd: root,
      env,
      stdio: 'pipe',
      timeout: 150000,
      windowsHide: true,
    });
    execFileSync(process.execPath, ['dist/modules/access/seed-access.js'], {
      cwd: root,
      env,
      stdio: 'pipe',
      timeout: 60000,
      windowsHide: true,
    });
    const backend = spawn(process.execPath, ['dist/main.js'], {
      cwd: root,
      env,
      stdio: 'ignore',
      windowsHide: true,
    });
    children.push(backend);
    await waitFor(apiBase + '/api/v1/health/ready', backend);
    const productionFrontend = process.env.LIVE_FRONTEND_MODE === 'production';
    const frontendEnv = {
      ...process.env,
      NODE_ENV: productionFrontend ? 'production' : 'development',
      API_INTERNAL_URL: apiBase,
      NEXT_DIST_DIR: productionFrontend
        ? '.next-local-live-production'
        : '.next-local-live-test',
      LIVE_BASE_URL: base,
    };
    for (const key of [
      'DATABASE_URL',
      'TEST_DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ])
      delete frontendEnv[key];
    // Build/start dùng cùng đích API và output trong schema test, không dùng server dev sẵn có.
    if (productionFrontend) {
      execFileSync(
        process.execPath,
        [path.join(front, 'node_modules/next/dist/bin/next'), 'build'],
        {
          cwd: front,
          env: frontendEnv,
          stdio: 'pipe',
          timeout: 180000,
          windowsHide: true,
        },
      );
    }
    const frontend = spawn(
      process.execPath,
      [
        path.join(front, 'node_modules/next/dist/bin/next'),
        productionFrontend ? 'start' : 'dev',
        '--hostname',
        '127.0.0.1',
        '--port',
        '3002',
      ],
      { cwd: front, env: frontendEnv, stdio: 'ignore', windowsHide: true },
    );
    children.push(frontend);
    await waitFor(base, frontend);
    const resultDir = path.join(front, '.visual-review', schema);
    await fs.mkdir(resultDir, { recursive: true });
    const runner = spawn(
      process.execPath,
      [
        path.join(front, 'node_modules/@playwright/test/cli.js'),
        'test',
        '--config',
        'playwright.live.config.ts',
        '--output',
        path.join(resultDir, 'artifacts'),
        ...process.argv.slice(2),
      ],
      {
        cwd: front,
        env: {
          ...frontendEnv,
          LIVE_REPORT_PATH: path.join(resultDir, 'results.json'),
        },
        stdio: 'inherit',
        windowsHide: true,
      },
    );
    children.push(runner);
    const code = await new Promise((resolve) =>
      runner.once('exit', (value) => resolve(value ?? 1)),
    );
    console.log(
      JSON.stringify({
        fullstackExitCode: code,
        report: path.relative(
          path.resolve(root, '..'),
          path.join(resultDir, 'results.json'),
        ),
        isolatedSchema: true,
      }),
    );
    process.exitCode = code;
  } finally {
    for (const child of children.reverse()) stop(child);
    if (connected) {
      await db.query('ROLLBACK');
      if (created && /^codex_live_test_[a-f0-9]{32}$/.test(schema))
        await db.query(`DROP SCHEMA "${schema}" CASCADE`);
      await db.end();
    }
    if (
      path.resolve(mediaRoot).startsWith(path.join(root, '.tmp') + path.sep) &&
      path.basename(mediaRoot) === schema
    )
      await fs.rm(mediaRoot, { recursive: true, force: true });
  }
}
async function claimRunner() {
  const lockPath = path.join(root, '.tmp', 'fullstack-run.lock');
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handle = await fs.open(lockPath, 'wx');
      const nonce = randomUUID();
      await handle.writeFile(
        JSON.stringify({
          pid: process.pid,
          nonce,
          startedAt: new Date().toISOString(),
        }),
      );
      await handle.close();
      return async () => {
        const owner = JSON.parse(await fs.readFile(lockPath, 'utf8'));
        if (owner.nonce === nonce) await fs.unlink(lockPath);
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const owner = JSON.parse(await fs.readFile(lockPath, 'utf8'));
      if (!Number.isInteger(owner.pid) || owner.pid <= 0)
        throw new Error(
          'Invalid fullstack runner lock; inspect it before retrying',
        );
      try {
        process.kill(owner.pid, 0);
      } catch (probe) {
        if (probe.code === 'ESRCH') {
          await fs.unlink(lockPath);
          continue;
        }
        throw probe;
      }
      throw new Error(
        'Another fullstack runner is active; wait for it to finish instead of sharing ports/cache',
      );
    }
  }
  throw new Error('Could not acquire the fullstack runner lock');
}
async function assertFree(port) {
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', () =>
      reject(
        new Error(
          `Local test port ${port} is already in use; existing servers will not be reused or stopped`,
        ),
      ),
    );
    probe.listen({ host: '127.0.0.1', port, exclusive: true }, () =>
      probe.close((error) => (error ? reject(error) : resolve())),
    );
  });
}
async function main() {
  const release = await claimRunner();
  try {
    await assertFree(3401);
    await assertFree(3002);
    await run();
  } finally {
    await release();
  }
}
main().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'fullstack_test_failed',
      code: error.code || error.name,
      message: error.code
        ? 'Test preparation failed; credentials omitted'
        : error.message,
    }),
  );
  process.exitCode = 1;
});
