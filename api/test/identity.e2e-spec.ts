import 'reflect-metadata';
import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Client } from 'pg';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AuthService, tokenHash } from '../src/modules/auth/auth.service.js';
import { ChallengeDelivery } from '../src/modules/auth/challenge-delivery.js';
import { seedAccess } from '../src/modules/access/access.seed.js';
import { PERMISSIONS } from '../src/modules/access/permissions.js';
import { configureHttp } from '../src/platform/http.js';

const origin = 'http://localhost:3000';
const password = 'ExamplePassword-2026!';
const schema = `codex_auth_test_${randomUUID().replaceAll('-', '')}`;
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  'Identity API + PostgreSQL (isolated schema)',
  () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let auth: AuthService;
    let database: Client;
    let schemaCreated = false;
    const users: Record<string, { id: string; email: string }> = {};
    const bearer = (token: string) => `Bearer ${token}`;
    const login = (name: string) =>
      auth.login({ email: users[name].email, password });
    const cookie = (token: string) => `refresh_token=${token}`;
    beforeAll(async () => {
      process.env.NODE_ENV = 'test';
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
      process.env.DATABASE_SCHEMA = schema;
      process.env.JWT_SECRET = randomBytes(48).toString('hex');
      process.env.JWT_REFRESH_SECRET = randomBytes(48).toString('hex');
      process.env.ALLOWED_ORIGINS = origin;
      process.env.JWT_EXPIRES_IN = '900';
      process.env.REFRESH_TTL_SECONDS = '604800';
      delete process.env.STRIPE_SECRET_KEY;
      database = new Client({
        connectionString: process.env.TEST_DATABASE_URL,
        connectionTimeoutMillis: 15000,
        statement_timeout: 120000,
      });
      await database.connect();
      const baseline = await readFile(
        new URL(
          '../prisma/v2/migrations/20261105000000_commerce_v2_baseline/migration.sql',
          import.meta.url,
        ),
        'utf8',
      );
      await database.query('BEGIN');
      await database.query(`CREATE SCHEMA "${schema}"`);
      await database.query(`SET LOCAL search_path TO "${schema}"`);
      await database.query(
        baseline.replace(/^BEGIN;\s*$/m, '').replace(/COMMIT;\s*$/, ''),
      );
      await database.query('COMMIT');
      schemaCreated = true;
      const { AppModule } = await import('../src/app.module.js');
      const module = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = module.createNestApplication({ logger: false });
      configureHttp(app);
      await app.init();
      prisma = app.get(PrismaService);
      auth = app.get(AuthService);
      // Reproduce a native UUID from the deterministic migration (not an RFC-v4 identifier).
      await prisma.role.create({
        data: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          code: 'ADMIN',
          name: 'Administrator',
          isSystem: true,
        },
      });
      await seedAccess(prisma);
      const permissionBefore = await prisma.permission.update({
        where: { code: 'accounts.read' },
        data: { description: 'Outdated fixture description' },
      });
      await seedAccess(prisma);
      const permissionAfter = await prisma.permission.findUniqueOrThrow({
        where: { code: 'accounts.read' },
      });
      expect(permissionAfter.id).toBe(permissionBefore.id);
      expect(permissionAfter.description).toBe(PERMISSIONS['accounts.read']);
      const roles = await prisma.role.findMany();
      const hash = await bcrypt.hash(password, 12);
      for (const name of ['alice', 'bob', 'admin', 'staff']) {
        const user = await prisma.user.create({
          data: {
            email: `${name}@example.test`,
            passwordHash: hash,
            status: 'ACTIVE',
            userRolesByUser: {
              create: {
                roleId: roles.find(
                  (role) =>
                    role.code === (name === 'admin' ? 'ADMIN' : 'CUSTOMER'),
                )!.id,
              },
            },
          },
        });
        users[name] = { id: user.id, email: user.email };
      }
    });
    afterAll(async () => {
      if (app) await app.close();
      if (database) {
        await database.query('ROLLBACK');
        if (schemaCreated && /^codex_auth_test_[a-f0-9]{32}$/.test(schema))
          await database.query(`DROP SCHEMA "${schema}" CASCADE`);
        await database.end();
      }
    });
    it('boots without Stripe; exposes only v2-compatible routes and valid CORS', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200);
      await request(app.getHttpServer()).get('/api/v1/products').expect(200);
      const swagger = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);
      expect(swagger.body.paths['/api/v1/orders']).toBeUndefined();
      expect(swagger.body.paths['/api/v1/auth/login']).toBeDefined();
      expect(
        swagger.body.paths['/api/v1/auth/login'].post.responses['200'].content[
          'application/json'
        ].schema.properties.data.$ref,
      ).toContain('AuthResponseDto');
      const cors = await request(app.getHttpServer())
        .options('/api/v1/auth/login')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type')
        .expect(204);
      expect(cors.headers['access-control-allow-headers']).toContain(
        'Content-Type',
      );
    });
    it('rejects role injection, weak passwords, wrong credentials and untrusted origins', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('Origin', origin)
        .send({ email: 'bad@example.test', password, role: 'ADMIN' })
        .expect(400);
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('Origin', origin)
        .send({ email: 'bad@example.test', password: 'short' })
        .expect(400);
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: users.alice.email, password })
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', 'https://untrusted.test')
        .send({ email: users.alice.email, password })
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', origin)
        .send({ email: users.alice.email, password: 'incorrect' })
        .expect(401);
    });
    it('registers CUSTOMER and returns only access token + HttpOnly refresh cookie', async () => {
      const result = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('Origin', origin)
        .send({ email: 'new@example.test', password })
        .expect(201);
      expect(result.body.data.user.roleCodes).toEqual(['CUSTOMER']);
      expect(result.body.data.refreshToken).toBeUndefined();
      expect(result.body.data.user.passwordHash).toBeUndefined();
      expect(result.body.meta.requestId).toBe(result.headers['x-request-id']);
      expect(result.headers['set-cookie'][0]).toContain('HttpOnly');
      const existing = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', origin)
        .send({ email: users.alice.email, password })
        .expect(200);
      expect(existing.body.data.user.id).toBe(users.alice.id);
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('Origin', origin)
        .send({ email: 'NEW@example.test', password })
        .expect(409);
    });
    it('restores valid pages without consuming refresh or extending access expiry; revokes stale and rejects revoked cookies', async () => {
      const session = await login('bob');
      const jwt = app.get(JwtService);
      const original = jwt.decode<{ exp: number }>(session.accessToken);
      const before = await prisma.authSession.findUniqueOrThrow({
        where: { tokenHash: tokenHash(session.refreshToken) },
      });
      for (const _attempt of [1, 2]) {
        const restored = await request(app.getHttpServer())
          .post('/api/v1/auth/session')
          .set('Origin', origin)
          .set('Cookie', cookie(session.refreshToken))
          .expect(200);
        expect(restored.body.data.requiresRefresh).toBe(false);
        expect(
          jwt.decode<{ exp: number }>(restored.body.data.accessToken).exp,
        ).toBeLessThanOrEqual(original.exp);
        expect(restored.headers['set-cookie']).toBeUndefined();
        await request(app.getHttpServer())
          .get('/api/v1/me')
          .set('Authorization', bearer(restored.body.data.accessToken))
          .expect(200);
      }
      const after = await prisma.authSession.findUniqueOrThrow({
        where: { id: before.id },
      });
      expect(after.tokenHash).toBe(before.tokenHash);
      expect(after.rotatedAt).toEqual(before.rotatedAt);
      const rotated = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Origin', origin)
        .set('Cookie', cookie(session.refreshToken))
        .expect(200);
      await request(app.getHttpServer())
        .post('/api/v1/auth/session')
        .set('Origin', origin)
        .set('Cookie', cookie(session.refreshToken))
        .expect(401);
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', bearer(rotated.body.data.accessToken))
        .expect(401);
      expect(
        (
          await prisma.authSession.findUniqueOrThrow({
            where: { id: before.id },
          })
        ).revokeReason,
      ).toBe('TOKEN_REUSE');
      await request(app.getHttpServer())
        .post('/api/v1/auth/session')
        .set('Cookie', cookie(session.refreshToken))
        .expect(403);
      const activeCookie = rotated.headers['set-cookie'][0].split(';')[0];
      await request(app.getHttpServer())
        .post('/api/v1/auth/session')
        .set('Origin', origin)
        .set('Cookie', activeCookie)
        .expect(401);
    });
    it('requires actual refresh after the original access window instead of extending it on page restore', async () => {
      const session = await login('bob');
      const jwt = app.get(JwtService);
      const payload = jwt.decode<{ sub: string; sid: string; fid: string }>(
        session.refreshToken,
      );
      const expiredAccessCookie = await jwt.signAsync(
        {
          sub: payload.sub,
          sid: payload.sid,
          fid: payload.fid,
          type: 'refresh',
          jti: randomUUID(),
          iat: Math.floor(Date.now() / 1000) - 1000,
        },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: 86400,
          issuer: 'ecommerce-api',
          audience: 'refresh',
        },
      );
      await prisma.authSession.update({
        where: { id: payload.sid },
        data: { tokenHash: tokenHash(expiredAccessCookie) },
      });
      const restored = await request(app.getHttpServer())
        .post('/api/v1/auth/session')
        .set('Origin', origin)
        .set('Cookie', cookie(expiredAccessCookie))
        .expect(200);
      expect(restored.body.data).toEqual({ requiresRefresh: true });
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Origin', origin)
        .set('Cookie', cookie(expiredAccessCookie))
        .expect(200);
    });
    it('stores token hashes, rotates refresh and commits family revocation on reuse', async () => {
      const session = await login('alice');
      const stored = await prisma.authSession.findFirstOrThrow({
        where: { userId: users.alice.id, tokenHash: { not: '' } },
        orderBy: { createdAt: 'desc' },
      });
      expect(stored.tokenHash).not.toBe(session.refreshToken);
      expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      const rotated = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Origin', origin)
        .set('Cookie', cookie(session.refreshToken))
        .expect(200);
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Origin', origin)
        .set('Cookie', cookie(session.refreshToken))
        .expect(401);
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', bearer(rotated.body.data.accessToken))
        .expect(401);
    });
    it('serializes concurrent refresh; reuse revokes even the winning rotation', async () => {
      const session = await login('alice');
      const results = await Promise.all(
        [1, 2].map(() =>
          request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .set('Origin', origin)
            .set('Cookie', cookie(session.refreshToken)),
        ),
      );
      expect(
        results.map((result) => result.status).sort((a, b) => a - b),
      ).toEqual([200, 401]);
      const winner = results.find((result) => result.status === 200)!;
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', bearer(winner.body.data.accessToken))
        .expect(401);
    });
    it('does not accept refresh tokens as access tokens; logout invalidates issued access', async () => {
      const session = await login('alice');
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', bearer(session.refreshToken))
        .expect(401);
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Origin', origin)
        .set('Authorization', bearer(session.accessToken))
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', bearer(session.accessToken))
        .expect(401);
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Origin', origin)
        .set('Cookie', cookie(session.refreshToken))
        .expect(401);
    });
    it('enforces address/session ownership and atomically switches default addresses', async () => {
      const alice = await login('alice'),
        bob = await login('bob');
      const address = {
        recipientName: 'Test recipient',
        phone: '0000000000',
        countryCode: 'VN',
        line1: 'Test street',
        isDefaultShipping: true,
      };
      const created = await request(app.getHttpServer())
        .post('/api/v1/me/addresses')
        .set('Authorization', bearer(alice.accessToken))
        .send(address)
        .expect(201);
      await request(app.getHttpServer())
        .patch(`/api/v1/me/addresses/${created.body.data.id}`)
        .set('Authorization', bearer(bob.accessToken))
        .send({ line1: 'Other' })
        .expect(404);
      await request(app.getHttpServer())
        .patch(`/api/v1/me/addresses/${created.body.data.id}`)
        .set('Authorization', bearer(alice.accessToken))
        .send({ recipientName: null })
        .expect(400);
      const others = await Promise.all(
        [1, 2].map(() =>
          request(app.getHttpServer())
            .post('/api/v1/me/addresses')
            .set('Authorization', bearer(alice.accessToken))
            .send(address),
        ),
      );
      expect(others.map((result) => result.status)).toEqual([201, 201]);
      expect(
        await prisma.address.count({
          where: {
            userId: users.alice.id,
            isDefaultShipping: true,
            archivedAt: null,
          },
        }),
      ).toBe(1);
      const sessions = await request(app.getHttpServer())
        .get('/api/v1/me/sessions')
        .set('Authorization', bearer(alice.accessToken))
        .expect(200);
      expect(sessions.body.data[0].tokenHash).toBeUndefined();
      await request(app.getHttpServer())
        .delete(`/api/v1/me/sessions/${sessions.body.data[0].id}`)
        .set('Authorization', bearer(bob.accessToken))
        .expect(404);
    });
    it('reads permission grants live; cannot modify system grants, self-promote or lock last admin', async () => {
      const admin = await login('admin'),
        staff = await login('staff');
      await request(app.getHttpServer())
        .get('/api/v1/admin/accounts')
        .set('Authorization', bearer(staff.accessToken))
        .expect(403);
      const created = await request(app.getHttpServer())
        .post('/api/v1/admin/access/roles')
        .set('Authorization', bearer(admin.accessToken))
        .send({ code: 'SUPPORT', name: 'Support' })
        .expect(201);
      const roleId = created.body.data.id;
      await request(app.getHttpServer())
        .put(`/api/v1/admin/access/roles/${roleId}/permissions`)
        .set('Authorization', bearer(admin.accessToken))
        .send({ codes: ['accounts.read', 'accounts.manage'] })
        .expect(200);
      await request(app.getHttpServer())
        .put(`/api/v1/admin/access/users/${users.staff.id}/roles`)
        .set('Authorization', bearer(admin.accessToken))
        .send({ roleIds: [roleId] })
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/v1/admin/accounts')
        .set('Authorization', bearer(staff.accessToken))
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/accounts/${users.admin.id}/status`)
        .set('Authorization', bearer(staff.accessToken))
        .send({ status: 'LOCKED' })
        .expect(409);
      await request(app.getHttpServer())
        .put(`/api/v1/admin/access/roles/${roleId}/permissions`)
        .set('Authorization', bearer(admin.accessToken))
        .send({ codes: [] })
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/v1/admin/accounts')
        .set('Authorization', bearer(staff.accessToken))
        .expect(403);
      const adminRole = await prisma.role.findUniqueOrThrow({
        where: { code: 'ADMIN' },
      });
      await request(app.getHttpServer())
        .put(`/api/v1/admin/access/roles/${adminRole.id}/permissions`)
        .set('Authorization', bearer(admin.accessToken))
        .send({ codes: [] })
        .expect(403);
      await request(app.getHttpServer())
        .put(`/api/v1/admin/access/users/${users.admin.id}/roles`)
        .set('Authorization', bearer(admin.accessToken))
        .send({ roleIds: [adminRole.id] })
        .expect(403);
      expect(await prisma.permission.count()).toBe(10);
    });
    it('locks accounts and revokes access; profile updates cannot grant privileges', async () => {
      const admin = await login('admin'),
        bob = await login('bob');
      await request(app.getHttpServer())
        .patch('/api/v1/me')
        .set('Authorization', bearer(bob.accessToken))
        .send({ status: 'ACTIVE', roleCodes: ['ADMIN'] })
        .expect(400);
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/accounts/${users.bob.id}/status`)
        .set('Authorization', bearer(admin.accessToken))
        .send({ status: 'LOCKED' })
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', bearer(bob.accessToken))
        .expect(401);
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', origin)
        .send({ email: users.bob.email, password })
        .expect(401);
    });
    it('issues generic reset responses; reset is one-time and revokes all sessions', async () => {
      const alice = await login('alice');
      const known = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .set('Origin', origin)
        .send({ email: users.alice.email })
        .expect(202);
      const unknown = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .set('Origin', origin)
        .send({ email: 'missing@example.test' })
        .expect(202);
      expect(known.body.data).toEqual(unknown.body.data);
      expect(known.body.data.token).toBeUndefined();
      const mail = app
        .get(ChallengeDelivery)
        .takeForLocalTesting()
        .find((message) => message.purpose === 'RESET_PASSWORD')!;
      const next = 'ChangedPassword-2026!';
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .set('Origin', origin)
        .send({ token: mail.token, newPassword: next })
        .expect(200);
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .set('Origin', origin)
        .send({ token: mail.token, newPassword: next })
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', bearer(alice.accessToken))
        .expect(401);
      await expect(login('alice')).rejects.toThrow();
      await auth.login({ email: users.alice.email, password: next });
    });
    it('confirms email once and rejects expired challenges', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/verification/request')
        .set('Origin', origin)
        .send({ email: users.admin.email })
        .expect(202);
      const mail = app
        .get(ChallengeDelivery)
        .takeForLocalTesting()
        .find((message) => message.purpose === 'VERIFY_EMAIL')!;
      await request(app.getHttpServer())
        .post('/api/v1/auth/verification/confirm')
        .set('Origin', origin)
        .send({ token: mail.token })
        .expect(200);
      await request(app.getHttpServer())
        .post('/api/v1/auth/verification/confirm')
        .set('Origin', origin)
        .send({ token: mail.token })
        .expect(400);
      await auth.issueChallenge(users.staff.email, 'RESET_PASSWORD');
      const expired = app.get(ChallengeDelivery).takeForLocalTesting()[0];
      await prisma.authChallenge.updateMany({
        where: { userId: users.staff.id },
        data: { expiresAt: new Date(0) },
      });
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .set('Origin', origin)
        .send({ token: expired.token, newPassword: password })
        .expect(400);
    });
    it('changes a password with current-password proof and archives without deleting history', async () => {
      const staff = await login('staff');
      const next = 'AnotherPassword-2026!';
      await request(app.getHttpServer())
        .patch('/api/v1/me/password')
        .set('Authorization', bearer(staff.accessToken))
        .send({ currentPassword: 'wrong', newPassword: next })
        .expect(401);
      await request(app.getHttpServer())
        .patch('/api/v1/me/password')
        .set('Authorization', bearer(staff.accessToken))
        .send({ currentPassword: password, newPassword: next })
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', bearer(staff.accessToken))
        .expect(401);
      const session = await auth.login({
        email: users.staff.email,
        password: next,
      });
      await request(app.getHttpServer())
        .post('/api/v1/me/archive')
        .set('Authorization', bearer(session.accessToken))
        .send({ currentPassword: next })
        .expect(201);
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: users.staff.id } }))
          .status,
      ).toBe('ARCHIVED');
      expect(
        await prisma.auditLog.count({ where: { actorId: users.staff.id } }),
      ).toBeGreaterThan(0);
    });
    it('enforces the global request rate limit before authentication', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 121; i++)
        statuses.push(
          (await request(app.getHttpServer()).get('/api/v1/auth/me')).status,
        );
      expect(statuses.slice(0, 120).every((status) => status === 401)).toBe(
        true,
      );
      expect(statuses[120]).toBe(429);
    });
  },
);
