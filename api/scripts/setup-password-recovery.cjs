// Operator-only extension after the additive recovery migration. No account,
// password, catalog, order or payment data is modified by this helper.
const { Client } = require('pg');
const base = require('./setup-interactive-demo.cjs');
const additionalTables = {
  auth_recovery_requests: ['INSERT', 'UPDATE', 'DELETE'],
  auth_challenges: ['INSERT'],
};
const additionalColumns = {
  users: ['password_hash', 'password_changed_at'],
  auth_challenges: ['consumed_at', 'updated_at'],
};
const scope = {
  tableGrants: { ...base.tableGrants, ...additionalTables },
  updateColumns: { ...base.updateColumns },
};
for (const [table, columns] of Object.entries(additionalColumns))
  scope.updateColumns[table] = [
    ...(scope.updateColumns[table] || []),
    ...columns,
  ];
const fail = (code) => {
  throw Object.assign(new Error('Recovery grant preflight failed'), { code });
};
const ident = (value) => {
  if (!/^[a-z][a-z0-9_]{0,40}$/.test(value)) fail('INVALID_IDENTIFIER');
  return '"' + value + '"';
};
async function main() {
  if (
    process.argv.length !== 3 ||
    process.argv[2] !== '--enable-password-recovery'
  )
    fail('EXPLICIT_RECOVERY_APPROVAL_REQUIRED');
  if (
    ['PREVIEW_READ_ONLY', 'INTERACTIVE_DEMO', 'PASSWORD_RECOVERY_ENABLED'].some(
      (name) => process.env[name] !== 'true',
    )
  )
    fail('INTERACTIVE_RECOVERY_FLAGS_REQUIRED');
  const emails = (process.env.PASSWORD_RECOVERY_ALLOWED_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase());
  if (
    !emails.length ||
    emails.length > 5 ||
    new Set(emails).size !== emails.length ||
    emails.some(
      (email) => !/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(email),
    )
  )
    fail('EXACT_RECOVERY_ALLOWLIST_REQUIRED');
  if (process.env.DATABASE_SCHEMA && process.env.DATABASE_SCHEMA !== 'public')
    fail('PUBLIC_SCHEMA_REQUIRED');
  const url = new URL(process.env.DB_ADMIN_URL || '');
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    url.searchParams.get('sslmode') !== 'verify-full' ||
    !url.searchParams.get('sslrootcert')
  )
    fail('VERIFIED_ADMIN_TLS_REQUIRED');
  const runtime = process.env.RUNTIME_ROLE || 'rigforce_app',
    quotedRole = ident(runtime);
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
        'SELECT oid,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls,rolcanlogin FROM pg_roles WHERE rolname=$1',
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
        `SELECT current_user=$1 AS is_operator,
      has_schema_privilege($1,'public','CREATE') AS creates_schema,
      has_database_privilege($1,current_database(),'CREATE') AS creates_database,
      EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relowner=$2) AS owns_relations`,
        [runtime, role.oid],
      )
    ).rows[0];
    if (Object.values(ownership).some(Boolean))
      fail('RUNTIME_ROLE_MUST_NOT_OWN_DATABASE_OBJECTS');
    const required = await db.query(
      `SELECT c.relname,has_table_privilege($1,c.oid,'SELECT') AS readable
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname=ANY($2::text[])`,
      [
        runtime,
        [
          'users',
          'auth_sessions',
          'audit_logs',
          'auth_challenges',
          'auth_recovery_requests',
        ],
      ],
    );
    if (
      required.rows.length !== 5 ||
      required.rows.some((row) => !row.readable)
    )
      fail('MIGRATION_AND_EXISTING_SELECT_GRANTS_REQUIRED');
    await base.assertWriteScope(db, runtime, scope);
    const existingGuard = (
      await db.query(`SELECT p.proowner=(SELECT oid FROM pg_roles WHERE rolname=current_user) AS owned
      FROM pg_proc p WHERE p.oid=to_regprocedure('public.guard_demo_password_update()')`)
    ).rows[0];
    if (existingGuard && !existingGuard.owned)
      fail('RECOVERY_GUARD_OWNER_MISMATCH');
    const existingTrigger = (
      await db.query(`SELECT tgfoid=to_regprocedure('public.guard_demo_password_update()') AS expected
      FROM pg_trigger WHERE tgrelid='public.users'::regclass AND tgname='users_demo_password_scope' AND NOT tgisinternal`)
    ).rows[0];
    if (existingTrigger && !existingTrigger.expected)
      fail('RECOVERY_TRIGGER_MISMATCH');
    await db.query(`CREATE OR REPLACE FUNCTION public.guard_demo_password_update() RETURNS trigger
      LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $guard$
      BEGIN
        IF current_user=TG_ARGV[0] AND
          (OLD.password_hash IS DISTINCT FROM NEW.password_hash OR
           OLD.password_changed_at IS DISTINCT FROM NEW.password_changed_at) AND
          NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(TG_ARGV[1]::jsonb) AS recipient(email)
            WHERE recipient.email=lower(OLD.email)) THEN
          RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Credential update is outside controlled recovery scope';
        END IF;
        RETURN NEW;
      END $guard$`);
    await db.query(
      'REVOKE ALL ON FUNCTION public.guard_demo_password_update() FROM PUBLIC',
    );
    await db.query(
      `GRANT EXECUTE ON FUNCTION public.guard_demo_password_update() TO ${quotedRole}`,
    );
    // Pin the operator-reviewed list in trigger arguments, not an app-controlled
    // session setting. Timestamp-only updates and other DB roles are unaffected.
    const trigger = (
      await db.query(
        `SELECT format('CREATE OR REPLACE TRIGGER users_demo_password_scope
      BEFORE UPDATE OF password_hash,password_changed_at ON public.users FOR EACH ROW
      EXECUTE FUNCTION public.guard_demo_password_update(%L,%L)', $1::text,$2::text) AS statement`,
        [runtime, JSON.stringify(emails)],
      )
    ).rows[0].statement;
    await db.query(trigger);
    for (const [table, privileges] of Object.entries(additionalTables))
      await db.query(
        `GRANT ${privileges.join(', ')} ON TABLE public.${ident(table)} TO ${quotedRole}`,
      );
    for (const [table, columns] of Object.entries(additionalColumns))
      await db.query(
        `GRANT UPDATE (${columns.map(ident).join(', ')}) ON TABLE public.${ident(table)} TO ${quotedRole}`,
      );
    await base.assertWriteScope(db, runtime, scope);
    await db.query('COMMIT');
    console.log(
      JSON.stringify({
        passwordRecoveryGrantsPrepared: true,
        accountsCreated: false,
        passwordsChanged: false,
        credentialRowsRestricted: true,
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
    const code =
      typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code)
        ? error.code
        : 'PREFLIGHT_FAILED';
    console.error('Recovery grant setup failed: ' + code);
    process.exitCode = 1;
  });
module.exports = { additionalTables, additionalColumns, scope, main };
