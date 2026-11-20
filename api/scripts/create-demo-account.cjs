// Operator-only creation; never resets an existing account or grants admin access.
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('node:crypto');
async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== '--create-controlled-demo')
    throw new Error('EXPLICIT_DEMO_ACCOUNT_APPROVAL_REQUIRED');
  const url = new URL(process.env.DB_ADMIN_URL || '');
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
      url.searchParams.get('sslmode') !== 'verify-full' || !url.searchParams.get('sslrootcert'))
    throw new Error('VERIFIED_TLS_REQUIRED');
  const email = (process.env.DEMO_ACCOUNT_EMAIL || '').trim().toLowerCase();
  const password = process.env.DEMO_ACCOUNT_PASSWORD || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      Buffer.byteLength(password) < 32 || Buffer.byteLength(password) > 72)
    throw new Error('INVALID_DEMO_ACCOUNT_INPUT');
  const db = new Client({ connectionString: process.env.DB_ADMIN_URL, connectionTimeoutMillis: 10000 });
  try {
    await db.connect();
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', ['demo-account:' + email]);
    if ((await db.query('SELECT 1 FROM public.users WHERE email=$1', [email])).rows.length)
      throw new Error('ACCOUNT_EXISTS_NO_PASSWORD_OR_ROLES_CHANGED');
    const role = (await db.query("SELECT id FROM public.roles WHERE code='CUSTOMER'")).rows;
    if (role.length !== 1) throw new Error('CUSTOMER_ROLE_REQUIRED');
    const id = randomUUID();
    await db.query("INSERT INTO public.users(id,email,password_hash,first_name,status,created_at,updated_at) VALUES($1,$2,$3,$4,'ACTIVE',now(),now())",
      [id,email,await bcrypt.hash(password,12),'Demo']);
    await db.query('INSERT INTO public.user_roles(user_id,role_id,created_at) VALUES($1,$2,now())', [id,role[0].id]);
    await db.query('COMMIT');
    console.log(JSON.stringify({ accountCreated: true, role: 'CUSTOMER', publicRegistration: false }));
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { await db.end(); }
}
main().catch((error) => {
  const safe = /^[A-Z_]+$/.test(error.message || '') ? error.message : error.code || 'DEMO_ACCOUNT_SETUP_FAILED';
  console.error('Demo account setup: ' + safe); process.exitCode = 1;
});
