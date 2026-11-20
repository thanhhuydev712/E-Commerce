// Operator-only grant extension for an existing, SELECT-only preview database.
// Does not create accounts/roles, change passwords, seed data or run migrations.
const { Client } = require('pg');

const tableGrants = {
  auth_sessions: ['INSERT'],
  audit_logs: ['INSERT'],
  carts: ['INSERT'],
  cart_items: ['INSERT', 'DELETE'],
  saved_pc_builds: ['INSERT', 'DELETE'],
  saved_pc_build_components: ['INSERT'],
};
const updateColumns = {
  // SELECT FOR UPDATE in lockUser needs UPDATE on at least one column.
  // No permission to change identity, credentials, status or role grants.
  users: ['updated_at'],
  auth_sessions: [
    'token_hash',
    'previous_token_hash',
    'rotated_at',
    'revoked_at',
    'revoke_reason',
    'updated_at',
  ],
  carts: ['version', 'updated_at'],
  cart_items: ['quantity', 'updated_at'],
};
const ident = (value) => {
  if (!/^[a-z][a-z0-9_]{0,40}$/.test(value)) fail('INVALID_IDENTIFIER');
  return '"' + value + '"';
};
function fail(code) {
  throw Object.assign(new Error('Interactive demo grant preflight failed'), {
    code,
  });
}

async function assertWriteScope(
  db,
  runtime,
  scope = { tableGrants, updateColumns },
) {
  // Check effective privileges, including PUBLIC grants; never silently revoke
  // broader privileges from a role that might belong to another application.
  const tables = await db.query(
    `
    SELECT c.relname AS name, p.privilege
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN (VALUES ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'),
      ('REFERENCES'), ('TRIGGER')) p(privilege)
    WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
      AND has_table_privilege($1, c.oid, p.privilege)
  `,
    [runtime],
  );
  for (const row of tables.rows)
    if (!scope.tableGrants[row.name]?.includes(row.privilege))
      fail('RUNTIME_HAS_BROAD_WRITE_PRIVILEGES');
  const columns = await db.query(
    `
    SELECT c.relname AS name, a.attname AS column, p.privilege
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
    CROSS JOIN (VALUES ('INSERT'), ('UPDATE'), ('REFERENCES')) p(privilege)
    WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
      AND has_column_privilege($1, c.oid, a.attnum, p.privilege)
  `,
    [runtime],
  );
  for (const row of columns.rows) {
    const permitted =
      scope.tableGrants[row.name]?.includes(row.privilege) ||
      (row.privilege === 'UPDATE' &&
        scope.updateColumns[row.name]?.includes(row.column));
    if (!permitted) fail('RUNTIME_HAS_BROAD_COLUMN_PRIVILEGES');
  }
}

async function main() {
  if (
    process.argv.length !== 3 ||
    process.argv[2] !== '--enable-interactive-demo'
  )
    fail('EXPLICIT_INTERACTIVE_DEMO_APPROVAL_REQUIRED');
  if (
    process.env.PREVIEW_READ_ONLY !== 'true' ||
    process.env.INTERACTIVE_DEMO !== 'true'
  )
    fail('INTERACTIVE_PREVIEW_FLAGS_REQUIRED');
  if (process.env.DATABASE_SCHEMA && process.env.DATABASE_SCHEMA !== 'public')
    fail('PUBLIC_SCHEMA_REQUIRED');
  const adminUrl = new URL(process.env.DB_ADMIN_URL || '');
  if (
    !['postgres:', 'postgresql:'].includes(adminUrl.protocol) ||
    adminUrl.searchParams.get('sslmode') !== 'verify-full' ||
    !adminUrl.searchParams.get('sslrootcert')
  )
    fail('VERIFIED_ADMIN_TLS_REQUIRED');
  const runtime = process.env.RUNTIME_ROLE || 'rigforce_app';
  const quotedRole = ident(runtime);
  const db = new Client({
    connectionString: process.env.DB_ADMIN_URL,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
  });
  try {
    await db.connect();
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(20261120,1)');
    const role = (
      await db.query(
        `
      SELECT oid, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls, rolcanlogin
      FROM pg_roles WHERE rolname=$1
    `,
        [runtime],
      )
    ).rows[0];
    if (
      !role ||
      role.rolsuper ||
      role.rolcreatedb ||
      role.rolcreaterole ||
      role.rolbypassrls ||
      !role.rolcanlogin
    )
      fail('UNSAFE_OR_MISSING_RUNTIME_ROLE');
    if (
      (
        await db.query(
          'SELECT 1 FROM pg_auth_members WHERE member=$1 LIMIT 1',
          [role.oid],
        )
      ).rows.length
    )
      fail('RUNTIME_ROLE_HAS_MEMBERSHIPS');
    const ownership = (
      await db.query(
        `
      SELECT current_user=$1 AS is_operator,
        has_schema_privilege($1, 'public', 'CREATE') AS creates_schema,
        has_database_privilege($1, current_database(), 'CREATE') AS creates_database,
        EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='public' AND c.relowner=$2) AS owns_relations
    `,
        [runtime, role.oid],
      )
    ).rows[0];
    if (Object.values(ownership).some(Boolean))
      fail('RUNTIME_ROLE_MUST_NOT_OWN_DATABASE_OBJECTS');
    const requiredTables = [
      ...new Set([...Object.keys(tableGrants), ...Object.keys(updateColumns)]),
    ];
    const required = await db.query(
      `
      SELECT c.relname AS name, has_table_privilege($1,c.oid,'SELECT') AS readable
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relname=ANY($2::text[])
    `,
      [runtime, requiredTables],
    );
    if (
      required.rows.length !== requiredTables.length ||
      required.rows.some((row) => !row.readable)
    )
      fail('EXISTING_PREVIEW_SCHEMA_AND_SELECT_GRANTS_REQUIRED');
    await assertWriteScope(db, runtime);
    for (const [table, privileges] of Object.entries(tableGrants))
      await db.query(
        `GRANT ${privileges.join(', ')} ON TABLE public.${ident(table)} TO ${quotedRole}`,
      );
    for (const [table, columns] of Object.entries(updateColumns))
      await db.query(
        `GRANT UPDATE (${columns.map(ident).join(', ')}) ON TABLE public.${ident(table)} TO ${quotedRole}`,
      );
    await assertWriteScope(db, runtime);
    await db.query('COMMIT');
    console.log(
      JSON.stringify({
        interactiveDemoGrantsPrepared: true,
        accountsCreated: false,
        catalogOrderInventoryPaymentWrites: false,
      }),
    );
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await db.end();
  }
}

if (require.main === module)
  main().catch((error) => {
    // Never print URL, credentials, query parameters or provider error messages.
    const code =
      typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code)
        ? error.code
        : 'PREFLIGHT_FAILED';
    console.error('Interactive demo grant setup failed: ' + code);
    process.exitCode = 1;
  });

module.exports = { tableGrants, updateColumns, assertWriteScope, main };
