// Render a baseline for an EMPTY v2 schema. Does not connect to PostgreSQL.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const api = path.resolve(__dirname, '../..');
const result = spawnSync(process.execPath, [path.join(api, 'node_modules/prisma/build/index.js'),
  'migrate', 'diff', '--from-empty', '--to-schema', 'prisma/schema.prisma', '--script'],
  { cwd: api, encoding: 'utf8' });
if (result.status !== 0) {
  process.stderr.write(result.stderr || 'Prisma DDL generation failed.');
  process.exit(result.status || 1);
}
const baseline = result.stdout.replace('-- CreateSchema\nCREATE SCHEMA IF NOT EXISTS "public";\n', '').trim();
if (/CREATE SCHEMA/.test(baseline)) throw new Error('Unexpected explicit schema in generated baseline. Review before applying.');
const constraints = fs.readFileSync(path.join(__dirname, 'constraints.sql'), 'utf8')
  .replace(/^(?:--[^\n]*\n)+/, '-- Supplementary PostgreSQL constraints.\n')
  .replace(/^BEGIN;\s*$/m, '').replace(/^COMMIT;\s*$/m, '').trim();
const directory = path.join(__dirname, 'migrations/20261105000000_commerce_v2_baseline');
fs.mkdirSync(directory, { recursive: true });
const sql = [
  '-- Baseline for an EMPTY v2 schema only. Existing v1 data is not converted by this migration.',
  '-- Target schema is selected by the Prisma v2 configuration, not hardcoded to public.',
  '-- Generated from schema.prisma and followed by reviewed PostgreSQL constraints.',
  'BEGIN;', baseline, constraints, 'COMMIT;', '',
].join('\n\n');
const destination = path.join(directory, 'migration.sql');
if (fs.existsSync(destination) && fs.readFileSync(destination, 'utf8') !== sql && process.argv[2] !== '--replace-unapplied') {
  throw new Error('Migration already exists and differs. Never rewrite applied migrations; review the change first.');
}
fs.writeFileSync(destination, sql);
fs.writeFileSync(path.join(__dirname, 'migrations/migration_lock.toml'), 'provider = "postgresql"\n');
console.log(JSON.stringify({ tables: (sql.match(/CREATE TABLE /g) || []).length,
  checks: (constraints.match(/ADD CONSTRAINT /g) || []).length,
  migration: 'prisma/v2/migrations/20261105000000_commerce_v2_baseline/migration.sql', applied: false }));
