// Refuse to apply a fresh-DB history over an existing/legacy database.
const { Client } = require('pg');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

function assertKnownMigrations(rows, sources) {
  for (const row of rows) {
    const sql = sources[row.migration_name];
    if (typeof sql !== 'string')
      throw Object.assign(new Error(), {
        code: 'DATABASE_HISTORY_NOT_IN_IMAGE',
      });
    const lf = sql.replace(/\r\n/g, '\n');
    const checksums = [sql, lf, lf.replace(/\n/g, '\r\n')].map((value) =>
      createHash('sha256').update(value).digest('hex'),
    );
    if (!checksums.includes(row.checksum))
      throw Object.assign(new Error(), {
        code: 'APPLIED_MIGRATION_WAS_MODIFIED',
      });
  }
}

function assertMigrationTls(connection, cliConnection, required) {
  if (!required) return;
  const db = new URL(connection),
    cli = new URL(cliConnection || 'postgresql://invalid');
  const same = ['protocol', 'username', 'password', 'host', 'pathname'].every(
    (key) => db[key] === cli[key],
  );
  if (
    !same ||
    db.searchParams.get('sslmode') !== 'verify-full' ||
    !db.searchParams.get('sslrootcert') ||
    cli.searchParams.get('sslmode') !== 'require' ||
    cli.searchParams.get('sslaccept') !== 'strict' ||
    cli.searchParams.get('sslcert') !== db.searchParams.get('sslrootcert')
  )
    throw Object.assign(new Error(), {
      code: 'VERIFIED_MIGRATION_TLS_REQUIRED',
    });
}

function assertFreshDockerHistory(rows, publicTables) {
  if (rows.length === 0) {
    if (publicTables !== 0)
      throw Object.assign(new Error(), {
        code: 'EMPTY_DOCKER_DATABASE_REQUIRED',
      });
    return;
  }
  const baselineName = '20261105000000_commerce_v2_baseline';
  const baseline = rows.find((row) => row.migration_name === baselineName);
  const legacy = rows.some(
    (row) =>
      row.migration_name !== baselineName &&
      row.migration_name <= '20261105010000_upgrade_v2_vnd',
  );
  if (!baseline?.finished_at || baseline.rolled_back_at || legacy)
    throw Object.assign(new Error(), { code: 'FRESH_DOCKER_HISTORY_REQUIRED' });
}

async function main() {
  assertMigrationTls(
    process.env.DATABASE_URL,
    process.env.PRISMA_MIGRATION_DATABASE_URL,
    process.env.DATABASE_TLS_REQUIRED === 'true',
  );
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
  });
  try {
    await client.connect();
    const history = await client.query(
      "SELECT to_regclass('public._prisma_migrations') AS table_name",
    );
    const applied = history.rows[0].table_name
      ? await client.query(
          'SELECT migration_name, checksum, finished_at, rolled_back_at FROM public._prisma_migrations',
        )
      : { rows: [] };
    const tables = await client.query(
      "SELECT count(*)::int AS count FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'",
    );
    assertFreshDockerHistory(applied.rows, tables.rows[0].count);
    const directory = path.resolve(__dirname, '../prisma/docker-migrations');
    const sources = Object.fromEntries(
      fs.readdirSync(directory).flatMap((name) => {
        const file = path.join(directory, name, 'migration.sql');
        return fs.existsSync(file)
          ? [[name, fs.readFileSync(file, 'utf8')]]
          : [];
      }),
    );
    assertKnownMigrations(applied.rows, sources);
  } finally {
    await client.end();
  }
  const result = spawnSync(
    process.execPath,
    [
      'node_modules/prisma/build/index.js',
      'migrate',
      'deploy',
      '--config',
      'prisma.docker.config.ts',
    ],
    {
      stdio: 'inherit',
    },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
module.exports = {
  assertFreshDockerHistory,
  assertMigrationTls,
  assertKnownMigrations,
};
if (require.main === module)
  main().catch((error) => {
    console.error(
      'Docker database preflight failed: ' + (error.code ?? 'CHECK_FAILED'),
    );
    process.exitCode = 1;
  });
