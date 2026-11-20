// Explicit disposable PostgreSQL TLS integration test. Never reads api/.env,
// never uses AWS/SMTP, and never connects to an existing database.
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { ConfigService } = require('@nestjs/config');
const { JwtService } = require('@nestjs/jwt');
const { builtFile } = require('../scripts/build-path.cjs');
const root = path.resolve(__dirname, '..');
const project = 'recovery-db-check-' + randomBytes(6).toString('hex');
const work = fs.mkdtempSync(path.join(os.tmpdir(), project + '-'));
const config = path.join(work, 'compose.json');
const passwords = Object.fromEntries(
  ['owner', 'migrate', 'runtime', 'old', 'new'].map((key) => [
    key,
    randomBytes(24).toString('hex'),
  ]),
);
const report = {
  date: new Date().toISOString(),
  scope:
    'Disposable PostgreSQL TLS + built recovery service, mocked SMTP; not AWS',
  checks: [],
  result: 'running',
};
const output =
  process.env.RECOVERY_DB_REPORT || path.join(os.tmpdir(), project + '.json');
const slash = (value) => value.replaceAll('\\', '/');
const redact = (value) =>
  Object.values(passwords).reduce(
    (text, secret) => text.replaceAll(secret, '[redacted]'),
    String(value),
  );
function command(bin, args, options = {}) {
  const result = spawnSync(bin, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 180000,
    maxBuffer: 4 * 1024 * 1024,
    ...options,
  });
  if (result.error || result.status !== 0)
    throw Error(
      redact(result.error?.message || result.stderr || result.stdout).slice(
        -1600,
      ),
    );
  return result.stdout;
}
const docker = (...args) => command('docker', args);
const compose = (...args) =>
  docker('compose', '--project-name', project, '-f', config, ...args);
const write = (name, text) =>
  fs.writeFileSync(path.join(work, name), text, { mode: 0o600 });
const mark = (label) => {
  report.checks.push(label);
  console.log('PASS ' + label);
};
let configured = false,
  owner,
  runtime,
  prisma;
async function main() {
  try {
    fs.mkdirSync(path.join(work, 'certs'));
    write(
      'certs/db.ext',
      'subjectAltName=DNS:db,DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n',
    );
    docker(
      'run',
      '--rm',
      '--user',
      typeof process.getuid === 'function'
        ? `${process.getuid()}:${process.getgid()}`
        : '1000:1000',
      '--entrypoint',
      'sh',
      '-v',
      slash(path.join(work, 'certs')) + ':/out',
      'rigforce-api:local',
      '-ec',
      [
        'openssl req -x509 -newkey rsa:2048 -nodes -keyout /out/ca.key -out /out/ca.crt -days 2 -subj /CN=Recovery-Test-CA',
        'openssl req -newkey rsa:2048 -nodes -keyout /out/db.key -out /out/db.csr -subj /CN=db',
        'openssl x509 -req -in /out/db.csr -CA /out/ca.crt -CAkey /out/ca.key -CAcreateserial -out /out/db.crt -days 2 -extfile /out/db.ext',
      ].join(' && '),
    );
    const networkUrl = (role, password) =>
      `postgresql://${role}:${password}@db:5432/recovery_check?sslmode=verify-full&sslrootcert=/run/certs/ca.crt`;
    write(
      'db.env',
      `POSTGRES_USER=fixture_owner\nPOSTGRES_PASSWORD=${passwords.owner}\nPOSTGRES_DB=recovery_check\n`,
    );
    write(
      'roles.env',
      `DB_ADMIN_URL=${networkUrl('fixture_owner', passwords.owner)}\nMIGRATION_PASSWORD=${passwords.migrate}\nRUNTIME_PASSWORD=${passwords.runtime}\n`,
    );
    const cli = new URL(networkUrl('rigforce_migrate', passwords.migrate));
    cli.searchParams.delete('sslrootcert');
    cli.searchParams.set('sslmode', 'require');
    cli.searchParams.set('sslaccept', 'strict');
    cli.searchParams.set('sslcert', '/run/certs/ca.crt');
    write(
      'migration.env',
      `DATABASE_URL=${networkUrl('rigforce_migrate', passwords.migrate)}\nPRISMA_MIGRATION_DATABASE_URL=${cli}\nDATABASE_SCHEMA=public\nDATABASE_TLS_REQUIRED=true\nNODE_EXTRA_CA_CERTS=/run/certs/ca.crt\n`,
    );
    command(process.execPath, ['scripts/prepare-docker-migrations.cjs']);
    const tools = {
      image: 'rigforce-api-tools:local',
      profiles: ['ops'],
      volumes: [
        `${slash(path.join(work, 'certs'))}:/run/certs:ro`,
        `${slash(path.join(root, 'prisma/docker-migrations'))}:/app/api/prisma/docker-migrations:ro`,
      ],
    };
    write(
      'compose.json',
      JSON.stringify({
        services: {
          db: {
            image:
              'postgres:17-bookworm@sha256:40865bc877a289da75963d97d72b59633f639fc5af7a4e856bfa3714cae5b536',
            env_file: [{ path: path.join(work, 'db.env'), format: 'raw' }],
            ports: ['127.0.0.1::5432'],
            entrypoint: ['sh', '-ec'],
            command: [
              'cp /run/certs/db.key /tmp/db.key && chown postgres:postgres /tmp/db.key && chmod 600 /tmp/db.key && exec docker-entrypoint.sh postgres -c ssl=on -c ssl_cert_file=/run/certs/db.crt -c ssl_key_file=/tmp/db.key',
            ],
            volumes: [
              `${slash(path.join(work, 'certs'))}:/run/certs:ro`,
              'database:/var/lib/postgresql/data',
            ],
            healthcheck: {
              test: [
                'CMD',
                'pg_isready',
                '-U',
                'fixture_owner',
                '-d',
                'recovery_check',
              ],
              interval: '2s',
              timeout: '3s',
              retries: 30,
            },
          },
          roles: {
            ...tools,
            env_file: [{ path: path.join(work, 'roles.env'), format: 'raw' }],
            entrypoint: ['node', 'scripts/setup-db-roles.cjs'],
            command: ['--new-database'],
          },
          migrate: {
            ...tools,
            env_file: [
              { path: path.join(work, 'migration.env'), format: 'raw' },
            ],
            entrypoint: ['node', 'scripts/migrate-docker.cjs'],
          },
        },
        volumes: { database: {} },
      }),
    );
    configured = true;
    compose('up', '-d', '--wait', '--wait-timeout', '90', 'db');
    compose('--profile', 'ops', 'run', '--rm', 'roles');
    compose('--profile', 'ops', 'run', '--rm', 'migrate');
    const port = Number(compose('port', 'db', '5432').trim().split(':').at(-1));
    assert(port > 0);
    const hostUrl = (role, password) => {
      const value = new URL(
        `postgresql://${role}:${password}@127.0.0.1:${port}/recovery_check`,
      );
      value.searchParams.set('sslmode', 'verify-full');
      value.searchParams.set('sslrootcert', path.join(work, 'certs/ca.crt'));
      return String(value);
    };
    const adminUrl = hostUrl('fixture_owner', passwords.owner),
      runtimeUrl = hostUrl('rigforce_app', passwords.runtime);
    const env = {
      ...process.env,
      DB_ADMIN_URL: adminUrl,
      PREVIEW_READ_ONLY: 'true',
      INTERACTIVE_DEMO: 'true',
      PASSWORD_RECOVERY_ENABLED: 'true',
      PASSWORD_RECOVERY_ALLOWED_EMAILS: 'trial@example.invalid',
    };
    command(
      process.execPath,
      ['scripts/setup-interactive-demo.cjs', '--enable-interactive-demo'],
      { env },
    );
    command(
      process.execPath,
      ['scripts/setup-password-recovery.cjs', '--enable-password-recovery'],
      { env },
    );
    command(
      process.execPath,
      ['scripts/setup-password-recovery.cjs', '--enable-password-recovery'],
      { env },
    );
    mark(
      'additive migration and scoped grant helper succeed twice over verified TLS',
    );
    owner = new Client({ connectionString: adminUrl });
    runtime = new Client({ connectionString: runtimeUrl });
    await owner.connect();
    await runtime.connect();
    const trial = randomUUID(),
      other = randomUUID(),
      adminRole = randomUUID(),
      customerRole = randomUUID();
    const hash = await bcrypt.hash(passwords.old, 12);
    await owner.query(
      "INSERT INTO public.users(id,email,password_hash,status,updated_at) VALUES($1,'trial@example.invalid',$3,'ACTIVE',now()),($2,'admin@example.invalid',$3,'ACTIVE',now())",
      [trial, other, hash],
    );
    await owner.query(
      "INSERT INTO public.roles(id,code,name,is_system,updated_at) VALUES($1,'ADMIN','Fixture admin',true,now()),($2,'CUSTOMER','Fixture customer',true,now())",
      [adminRole, customerRole],
    );
    await owner.query(
      'INSERT INTO public.user_roles(user_id,role_id) VALUES($1,$2),($3,$4)',
      [other, adminRole, trial, customerRole],
    );
    await assert.rejects(
      runtime.query(
        "UPDATE public.users SET password_hash='forbidden' WHERE id=$1",
        [other],
      ),
      (error) => error.code === '42501',
    );
    await assert.rejects(
      runtime.query(
        'UPDATE public.users SET password_changed_at=now() WHERE id=$1',
        [other],
      ),
      (error) => error.code === '42501',
    );
    await runtime.query(
      'UPDATE public.users SET updated_at=now() WHERE id=$1',
      [other],
    );
    for (const sql of [
      'UPDATE public.products SET name=name WHERE false',
      'DELETE FROM public.orders WHERE false',
      'DELETE FROM public.payments WHERE false',
      'DELETE FROM public.inventory_balances WHERE false',
      'DELETE FROM public.user_roles WHERE false',
    ])
      await assert.rejects(
        runtime.query(sql),
        (error) => error.code === '42501',
      );
    const guard = (
      await owner.query(
        "SELECT p.prosecdef,has_function_privilege('rigforce_migrate',p.oid,'EXECUTE') AS public_execute FROM pg_proc p WHERE p.oid='public.guard_demo_password_update()'::regprocedure",
      )
    ).rows[0];
    assert.equal(guard.prosecdef, false);
    assert.equal(guard.public_execute, false);
    mark(
      'DB trigger blocks direct admin credential changes; timestamp updates work and catalog/order/payment writes stay denied',
    );
    const { PrismaService } = await import(
      pathToFileURL(builtFile('prisma', 'prisma.service.js'))
    );
    const { AuthService } = await import(
      pathToFileURL(builtFile('modules', 'auth', 'auth.service.js'))
    );
    const { PasswordRecoveryService } = await import(
      pathToFileURL(
        builtFile('modules', 'auth', 'password-recovery.service.js'),
      )
    );
    const settings = new ConfigService({
      NODE_ENV: 'test',
      DATABASE_URL: runtimeUrl,
      DATABASE_SCHEMA: 'public',
      PREVIEW_READ_ONLY: true,
      INTERACTIVE_DEMO: true,
      PASSWORD_RECOVERY_ENABLED: true,
      PASSWORD_RECOVERY_ALLOWED_EMAILS: 'trial@example.invalid',
      JWT_SECRET: randomBytes(32).toString('hex'),
      JWT_REFRESH_SECRET: randomBytes(32).toString('hex'),
      JWT_EXPIRES_IN: 900,
      REFRESH_TTL_SECONDS: 604800,
    });
    prisma = new PrismaService(settings);
    await prisma.onModuleInit();
    let databaseFailure = '';
    const transaction = prisma.$transaction.bind(prisma);
    prisma.$transaction = async (...args) => {
      try {
        return await transaction(...args);
      } catch (error) {
        const cause = error.meta?.driverAdapterError?.cause;
        const permission =
          String(cause?.originalMessage || '').match(
            /permission denied for (?:table|schema|column) [a-z_]+/,
          )?.[0] || '';
        databaseFailure =
          [error.code, error.meta?.code, cause?.originalCode]
            .filter(
              (value) =>
                typeof value === 'string' && /^[A-Z0-9]{5}$/.test(value),
            )
            .join('/') +
          ' ' +
          permission;
        throw error;
      }
    };
    const sent = [];
    let failOnce = false;
    const delivery = {
      assertAvailable() {},
      async send(message) {
        sent.push(message);
        if (failOnce) {
          failOnce = false;
          throw Error('fixture SMTP failure');
        }
      },
    };
    const auth = new AuthService(prisma, new JwtService(), settings, delivery);
    const recovery = () =>
      new PasswordRecoveryService(prisma, settings, delivery);
    await auth.login({
      email: 'trial@example.invalid',
      password: passwords.old,
    });
    const worker = recovery();
    const accepted = await worker.request('trial@example.invalid');
    assert.deepEqual(await worker.request('missing@example.invalid'), accepted);
    assert.equal(sent.length, 0);
    const queued = await prisma.authRecoveryRequest.findMany();
    assert.equal(queued.length, 2);
    assert(queued.every((row) => !row.payloadCiphertext.includes('@')));
    await worker.drain();
    assert.equal(
      sent.length,
      1,
      'Recovery worker database status: ' + databaseFailure,
    );
    assert.equal(sent[0].email, 'trial@example.invalid');
    assert.equal(
      await prisma.authRecoveryRequest.count({
        where: { status: 'SENT', payloadCiphertext: '' },
      }),
      1,
    );
    assert.equal(
      await prisma.authRecoveryRequest.count({
        where: { status: 'IGNORED', payloadCiphertext: '' },
      }),
      1,
    );
    await auth.consumeChallenge(sent[0].token, 'RESET_PASSWORD', passwords.new);
    await assert.rejects(
      auth.consumeChallenge(sent[0].token, 'RESET_PASSWORD', passwords.old),
    );
    const changed = await prisma.user.findUnique({ where: { id: trial } });
    assert(await bcrypt.compare(passwords.new, changed.passwordHash));
    assert(!(await bcrypt.compare(passwords.old, changed.passwordHash)));
    assert.equal(
      await prisma.authSession.count({
        where: { userId: trial, revokedAt: null },
      }),
      0,
    );
    await assert.rejects(
      auth.login({ email: 'trial@example.invalid', password: passwords.old }),
    );
    await auth.login({
      email: 'trial@example.invalid',
      password: passwords.new,
    });
    mark(
      'real Prisma request/worker/reset consumes token once, changes password and revokes old sessions; unknown email returns the same acceptance',
    );
    await owner.query(
      "UPDATE public.auth_recovery_requests SET created_at=now()-interval '2 minutes'",
    );
    failOnce = true;
    await worker.request('trial@example.invalid');
    await worker.drain();
    const failedToken = sent.at(-1).token;
    const pending = await prisma.authRecoveryRequest.findFirst({
      where: { status: 'PENDING' },
    });
    assert(pending);
    assert(!pending.payloadCiphertext.includes(failedToken));
    await prisma.authRecoveryRequest.update({
      where: { id: pending.id },
      data: { availableAt: new Date(0) },
    });
    await recovery().drain();
    assert.equal(sent.at(-1).token, failedToken);
    assert.equal(
      await prisma.authRecoveryRequest.count({ where: { status: 'SENT' } }),
      2,
    );
    const admin = await prisma.user.findUnique({ where: { id: other } });
    assert.equal(admin.passwordHash, hash);
    mark(
      'a restarted worker retries the same encrypted token; the other/admin password is unchanged',
    );
    report.result = 'passed';
  } catch (error) {
    report.result = 'failed';
    report.error = redact(error.message);
    process.exitCode = 1;
  } finally {
    if (prisma) await prisma.onModuleDestroy().catch(() => {});
    if (runtime) await runtime.end().catch(() => {});
    if (owner) await owner.end().catch(() => {});
    if (configured)
      try {
        for (const id of compose('ps', '-aq')
          .trim()
          .split(/\s+/)
          .filter(Boolean))
          assert.equal(
            JSON.parse(docker('inspect', id))[0].Config.Labels[
              'com.docker.compose.project'
            ],
            project,
          );
        for (const name of docker(
          'volume',
          'ls',
          '--filter',
          `label=com.docker.compose.project=${project}`,
          '--format',
          '{{.Name}}',
        )
          .trim()
          .split(/\s+/)
          .filter(Boolean))
          assert.equal(
            JSON.parse(docker('volume', 'inspect', name))[0].Labels[
              'com.docker.compose.project'
            ],
            project,
          );
        compose('--profile', 'ops', 'down', '--volumes', '--remove-orphans');
        report.cleanup = 'passed';
      } catch (error) {
        report.cleanup = 'failed';
        report.cleanupError = redact(error.message);
        process.exitCode = 1;
      }
    fs.writeFileSync(output, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ ...report, reportFile: output }, null, 2));
    const resolved = path.resolve(work);
    assert(
      resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) &&
        path.basename(resolved).startsWith(project + '-'),
    );
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
main().catch(() => {
  console.error('Recovery DB harness failed during cleanup');
  process.exitCode = 1;
});
