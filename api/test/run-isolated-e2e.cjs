// Selects a connection only. The test suite creates/drops its OWN random schema;
// it never truncates or changes public/legacy_v1 data.
require('dotenv/config');
const { spawnSync } = require('node:child_process');
if (process.env.NODE_ENV === 'production')
  throw new Error('Refusing development E2E on a production environment');
const connection = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!connection) throw new Error('Set TEST_DATABASE_URL for PostgreSQL E2E');
const result = spawnSync(
  process.execPath,
  [
    'node_modules/vitest/vitest.mjs',
    'run',
    '--config',
    'vitest.config.e2e.ts',
    ...process.argv.slice(2),
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, TEST_DATABASE_URL: connection },
  },
);
process.exit(result.status ?? 1);
