// Operator-only first setup for an empty database. Never mounts master credentials into API.
const { Client } = require('pg');
const ident = (value) => {
  if (!/^[a-z][a-z0-9_]{0,40}$/.test(value))
    throw new Error('Invalid role/database identifier');
  return '"' + value + '"';
};
async function main() {
  if (!process.argv.includes('--new-database'))
    throw new Error('Explicit empty-database setup is required');
  const adminUrl = new URL(process.env.DB_ADMIN_URL || '');
  if (
    !['postgres:', 'postgresql:'].includes(adminUrl.protocol) ||
    adminUrl.searchParams.get('sslmode') !== 'verify-full' ||
    !adminUrl.searchParams.get('sslrootcert')
  )
    throw new Error(
      'An explicit admin connection with verified TLS is required',
    );
  const migration = process.env.MIGRATION_ROLE || 'rigforce_migrate';
  const runtime = process.env.RUNTIME_ROLE || 'rigforce_app';
  ident(migration);
  ident(runtime);
  if (migration === runtime) throw new Error('Roles must differ');
  for (const key of ['MIGRATION_PASSWORD', 'RUNTIME_PASSWORD'])
    if (!process.env[key] || process.env[key].length < 32)
      throw new Error('Strong role passwords are required');
  const db = new Client({
    connectionString: process.env.DB_ADMIN_URL,
    connectionTimeoutMillis: 10000,
  });
  try {
    await db.connect();
    await db.query('BEGIN');
    const tables = await db.query(
      "SELECT count(*)::int AS count FROM pg_tables WHERE schemaname='public'",
    );
    if (tables.rows[0].count)
      throw new Error('Database is not empty; refuse role bootstrap');
    const info = (
      await db.query('SELECT current_database() AS db, current_user AS actor')
    ).rows[0];
    for (const [name, password] of [
      [migration, process.env.MIGRATION_PASSWORD],
      [runtime, process.env.RUNTIME_PASSWORD],
    ]) {
      const exists = await db.query(
        'SELECT rolname FROM pg_roles WHERE rolname=$1',
        [name],
      );
      if (exists.rows.length)
        throw Object.assign(new Error(), { code: 'ROLE_ALREADY_EXISTS' });
      if (!exists.rows.length) {
        const sql = await db.query(
          "SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', $1::text, $2::text) AS statement",
          [name, password],
        );
        await db.query(sql.rows[0].statement);
      }
    }
    await db.query(`GRANT ${ident(migration)} TO ${ident(info.actor)}`);
    await db.query(
      `GRANT CONNECT ON DATABASE ${ident(info.db)} TO ${ident(migration)}, ${ident(runtime)}`,
    );
    await db.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
    await db.query(
      `GRANT USAGE, CREATE ON SCHEMA public TO ${ident(migration)}`,
    );
    await db.query(`GRANT USAGE ON SCHEMA public TO ${ident(runtime)}`);
    await db.query(
      `ALTER DEFAULT PRIVILEGES FOR ROLE ${ident(migration)} IN SCHEMA public GRANT SELECT ON TABLES TO ${ident(runtime)}`,
    );
    await db.query('COMMIT');
    console.log(
      JSON.stringify({
        databaseRolesPrepared: true,
        runtimeAccess: 'SELECT only',
        passwordRotation: false,
      }),
    );
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await db.end();
  }
}
main().catch((error) => {
  console.error(
    'Database role setup failed: ' + (error.code || 'PREFLIGHT_FAILED'),
  );
  process.exitCode = 1;
});
