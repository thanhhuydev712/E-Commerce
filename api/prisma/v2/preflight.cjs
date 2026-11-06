// Read-only inspection. Never prints connection strings or customer records.
require('dotenv/config');
const { Client } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_MISSING');
  const connection = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000, statement_timeout: 15000 });
  try {
    await connection.connect();
    await connection.query('BEGIN READ ONLY');
    const tables = (await connection.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') AND table_type = 'BASE TABLE' ORDER BY table_schema, table_name")).rows;
    const counts = [];
    for (const table of tables) {
      const identifier = [table.table_schema, table.table_name].map(value => '"' + value.replaceAll('"', '""') + '"').join('.');
      const result = await connection.query(`SELECT count(*)::text AS row_count FROM ${identifier}`);
      counts.push({ schema: table.table_schema, table: table.table_name, rows: result.rows[0].row_count });
    }
    await connection.query('COMMIT');
    console.log(JSON.stringify({ productionFlag: process.env.NODE_ENV === 'production', tables: counts }, null, 2));
  } finally {
    await connection.end();
  }
}
main().catch(error => { console.error(JSON.stringify({ error: error.code || error.name, detail: 'Read-only preflight failed; credentials and records omitted.' })); process.exitCode = 1; });
