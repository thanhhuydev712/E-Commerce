// Development-only additive migration. Prisma output is captured to avoid logging connection details.
require('dotenv/config');
const { execFileSync } = require('node:child_process');
const { Client } = require('pg');
async function main() {
  if (process.env.NODE_ENV === 'production' || (process.env.DATABASE_SCHEMA && process.env.DATABASE_SCHEMA !== 'public'))
    throw new Error('Use the deployment migration workflow for this environment');
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
  try {
    await db.connect();
    const pending = (await db.query('SELECT migration_name FROM public._prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL')).rows;
    if (pending.length) throw new Error('An unfinished migration requires review');
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
      env: process.env, stdio: 'pipe', timeout: 120000, windowsHide: true,
    });
    const result = (await db.query("SELECT count(*)::int AS applied FROM public._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL")).rows[0];
    console.log(JSON.stringify({ migration: 'storefront_saved_builds', ...result, additive: true }));
  } finally { await db.end(); }
}
main().catch(error => { console.error(JSON.stringify({ event: 'storefront_migration_failed', code: error.code || error.name })); process.exitCode = 1; });
