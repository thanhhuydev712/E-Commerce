import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { Client } from 'pg';
import Stripe from 'stripe';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, sep } from 'node:path';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { seedAccess } from '../src/modules/access/access.seed.js';
import { configureHttp } from '../src/platform/http.js';
import { StripeGateway } from '../src/modules/commerce/stripe.gateway.js';
import { StripePaymentService } from '../src/modules/commerce/stripe-payment.service.js';

// The development PostgreSQL connection may be remote; keep network latency
// separate from assertions about transaction correctness.
vi.setConfig({ testTimeout: 180000 });

const schema = `codex_stripe_test_${randomUUID().replaceAll('-', '')}`;
const mediaRoot = resolve('.tmp', schema);
const signingSecret = 'whsec_isolated_stripe_fixture';
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  'Stripe v2 (isolated PostgreSQL, signed webhooks, fake provider)',
  () => {
    let app: INestApplication,
      db: Client,
      prisma: PrismaService,
      gateway: StripeGateway;
    let created = false,
      connected = false,
      token = '',
      other = '',
      variantId = '';
    const sessions = new Map<string, Stripe.Checkout.Session>();
    const creates: Parameters<StripeGateway['create']>[0][] = [];
    let failNext = false;
    let beforeResponse:
      ((session: Stripe.Checkout.Session) => Promise<void>) | undefined;
    const http = () => request(app.getHttpServer());
    const me = (method: 'get' | 'post', path: string, bearer = token) =>
      http()
        [method](`/api/v1/me/${path}`)
        .set('Authorization', `Bearer ${bearer}`);
    const sign = (
      session: Stripe.Checkout.Session,
      type = 'checkout.session.completed',
      extra: Record<string, unknown> = {},
    ) => {
      const payload = JSON.stringify({
        id: `evt_${randomUUID()}`,
        object: 'event',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        type,
        data: { object: session },
        ...extra,
      });
      const signature = Stripe.webhooks.generateTestHeaderString({
        payload,
        secret: signingSecret,
      });
      return http()
        .post('/api/v1/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', signature)
        .send(payload);
    };
    const paid = (session: Stripe.Checkout.Session) =>
      ({
        ...session,
        status: 'complete',
        payment_status: 'paid',
        payment_intent: `pi_${session.metadata!.attemptId}`,
      }) as Stripe.Checkout.Session;
    async function place() {
      await me('post', 'cart/items')
        .send({ variantId, quantity: 1 })
        .expect(201);
      const quote = await me('post', 'checkout/quote')
        .send({
          customer: 'Stripe Test',
          phone: '0900000000',
          address: 'Test address, Vietnam',
        })
        .expect(201);
      expect(quote.body.data.methods).toContain('STRIPE');
      const response = await me('post', 'orders')
        .set('Idempotency-Key', randomUUID())
        .send({ quoteId: quote.body.data.id, method: 'STRIPE' })
        .expect(201);
      expect(response.body.data.backendStatus).toBe('PENDING_PAYMENT');
      return response.body.data.id as string;
    }
    async function start(id: string) {
      const response = await me('post', `orders/${id}/stripe-checkout`).expect(
        200,
      );
      return sessions.get(response.body.data.url)!;
    }
    beforeAll(async () => {
      Object.assign(process.env, {
        NODE_ENV: 'test',
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        DATABASE_SCHEMA: schema,
        JWT_SECRET: randomBytes(48).toString('hex'),
        JWT_REFRESH_SECRET: randomBytes(48).toString('hex'),
        ALLOWED_ORIGINS: 'http://localhost:3000',
        STOREFRONT_URL: 'http://localhost:3000',
        STRIPE_SECRET_KEY: 'sk_test_isolated_fixture',
        STRIPE_WEBHOOK_SECRET: signingSecret,
        MEDIA_ROOT: mediaRoot,
      });
      db = new Client({
        connectionString: process.env.TEST_DATABASE_URL,
        connectionTimeoutMillis: 15000,
        statement_timeout: 120000,
      });
      await db.connect();
      connected = true;
      await db.query('BEGIN');
      await db.query(`CREATE SCHEMA "${schema}"`);
      await db.query(`SET LOCAL search_path TO "${schema}"`);
      for (const file of [
        'prisma/v2/migrations/20261105000000_commerce_v2_baseline/migration.sql',
        'prisma/migrations/20261106010000_storefront_saved_builds/migration.sql',
      ])
        await db.query(
          (await readFile(file, 'utf8'))
            .replace(/^BEGIN;\s*$/m, '')
            .replace(/COMMIT;\s*$/, ''),
        );
      await db.query('COMMIT');
      created = true;
      execFileSync(
        process.execPath,
        ['prisma/seed-storefront.cjs', '--apply'],
        {
          env: { ...process.env },
          stdio: 'pipe',
          timeout: 150000,
          windowsHide: true,
        },
      );
      const { AppModule } = await import('../src/app.module.js');
      const module = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = module.createNestApplication({ logger: false, rawBody: true });
      gateway = app.get(StripeGateway);
      vi.spyOn(gateway, 'accountId').mockResolvedValue('acct_isolated_fixture');
      vi.spyOn(gateway, 'create').mockImplementation(async (input) => {
        creates.push(input);
        const url = `https://checkout.stripe.com/c/pay/${input.attemptId}`;
        let session = sessions.get(url);
        if (!session) {
          session = {
            id: `cs_test_${input.attemptId}`,
            object: 'checkout.session',
            mode: 'payment',
            livemode: false,
            status: 'open',
            payment_status: 'unpaid',
            currency: 'vnd',
            amount_total: Number(input.amount),
            metadata: {
              attemptId: input.attemptId,
              paymentId: input.paymentId,
              orderId: input.orderId,
            },
            client_reference_id: input.orderId,
            url,
            payment_intent: null,
          } as Stripe.Checkout.Session;
          sessions.set(url, session);
        }
        if (failNext) {
          failNext = false;
          throw new Error('Simulated response timeout after provider creation');
        }
        if (beforeResponse) {
          const callback = beforeResponse;
          beforeResponse = undefined;
          await callback(session);
        }
        return session;
      });
      vi.spyOn(gateway, 'retrieve').mockImplementation(async (id) =>
        [...sessions.values()].find((s) => s.id === id)!,
      );
      vi.spyOn(gateway, 'expire').mockImplementation(async (id) => {
        const session = [...sessions.values()].find((s) => s.id === id)!;
        if (session.status !== 'open')
          throw new Error('Session no longer open');
        const expired = {
          ...session,
          status: 'expired',
        } as Stripe.Checkout.Session;
        sessions.set(session.url!, expired);
        return expired;
      });
      configureHttp(app);
      await app.init();
      prisma = app.get(PrismaService);
      await seedAccess(prisma);
      for (const email of ['stripe@isolated.test', 'other@isolated.test']) {
        const response = await http()
          .post('/api/v1/auth/register')
          .set('Origin', 'http://localhost:3000')
          .send({ email, password: 'StripeFixturePassword-2026!' })
          .expect(201);
        if (email.startsWith('stripe')) token = response.body.data.accessToken;
        else other = response.body.data.accessToken;
      }
      const catalog = await http().get('/api/v1/storefront').expect(200);
      variantId = catalog.body.data.products.find(
        (p: { id: string }) => p.id === 'ryzen-7600',
      ).variants[0].id;
    }, 240000);
    afterAll(async () => {
      if (app) await app.close();
      if (db && connected) {
        await db.query('ROLLBACK');
        if (created && /^codex_stripe_test_[a-f0-9]{32}$/.test(schema))
          await db.query(`DROP SCHEMA "${schema}" CASCADE`);
        await db.end();
      }
      if (mediaRoot.startsWith(resolve('.tmp') + sep))
        await rm(mediaRoot, { recursive: true, force: true });
      vi.restoreAllMocks();
    });

    it('rejects unsigned and modified payloads before writing inbox or money', async () => {
      await http().post('/api/v1/webhooks/stripe').send({}).expect(400);
      await http()
        .post('/api/v1/webhooks/stripe')
        .set('Stripe-Signature', 't=1,v1=invalid')
        .send({})
        .expect(400);
      expect(await prisma.providerEvent.count()).toBe(0);
    });
    it('reuses one attempt under concurrent clicks and enforces ownership and server amount', async () => {
      const id = await place();
      await me('post', `orders/${id}/stripe-checkout`, other).expect(404);
      const responses = await Promise.all(
        [1, 2].map(() =>
          me('post', `orders/${id}/stripe-checkout`)
            .send({ amount: 1 })
            .expect(200),
        ),
      );
      expect(responses[0].body.data.url).toBe(responses[1].body.data.url);
      const attempts = await prisma.paymentAttempt.findMany({
        where: { payment: { orderId: id } },
      });
      expect(attempts).toHaveLength(1);
      expect(attempts[0].requestedAmount).toBe(4620000n);
      expect(
        creates
          .filter((call) => call.orderId === id)
          .every((call) => call.amount === 4620000n),
      ).toBe(true);
      const session = sessions.get(responses[0].body.data.url)!;
      await sign(paid(session)).expect(200);
      await sign(paid(session)).expect(200); // different event ID, same capture
      const payload = paid(session),
        fixedEvent = `evt_${randomUUID()}`;
      await Promise.all(
        [1, 2].map(() =>
          sign(payload, 'checkout.session.completed', {
            id: fixedEvent,
          }).expect(200),
        ),
      );
      expect(
        await prisma.paymentTransaction.count({
          where: { attemptId: attempts[0].id },
        }),
      ).toBe(1);
      const result = await me('get', `orders/${id}`).expect(200);
      expect(result.body.data).toMatchObject({
        payment: 'paid',
        backendStatus: 'CONFIRMED',
        canPay: false,
        canCancel: false,
      });
      expect(
        (
          await prisma.stockReservation.findFirstOrThrow({
            where: { orderItem: { orderId: id } },
          })
        ).status,
      ).toBe('COMMITTED');
      await sign(
        { ...session, status: 'expired' } as Stripe.Checkout.Session,
        'checkout.session.expired',
      ).expect(200);
      expect((await me('get', `orders/${id}`)).body.data.payment).toBe('paid');
      await me('post', `orders/${id}/cancel`).expect(409);
    });
    it('quarantines mismatched amounts and rejects another account or live-mode events', async () => {
      const id = await place(),
        session = await start(id);
      await sign({ ...paid(session), amount_total: 1 }).expect(200);
      expect(
        await prisma.providerEvent.count({
          where: { status: 'DEAD', lastErrorCode: 'SESSION_MISMATCH' },
        }),
      ).toBe(1);
      await sign(paid(session), 'checkout.session.completed', {
        account: 'acct_wrong',
      }).expect(400);
      await sign(paid(session), 'checkout.session.completed', {
        livemode: true,
      }).expect(200);
      expect((await me('get', `orders/${id}`)).body.data.payment).toBe(
        'pending',
      );
      await me('post', `orders/${id}/cancel`).expect(200);
    });
    it('does not regress a webhook received before the create Session HTTP response', async () => {
      const id = await place();
      beforeResponse = async (session) => {
        await sign(paid(session)).expect(200);
      };
      await start(id);
      expect(
        (
          await prisma.paymentAttempt.findFirstOrThrow({
            where: { payment: { orderId: id } },
          })
        ).status,
      ).toBe('SUCCEEDED');
      expect((await me('get', `orders/${id}`)).body.data.payment).toBe('paid');
    });
    it('keeps an ambiguous timeout UNKNOWN and retries the same provider key', async () => {
      const id = await place();
      failNext = true;
      await me('post', `orders/${id}/stripe-checkout`).expect(503);
      expect(
        (
          await prisma.paymentAttempt.findFirstOrThrow({
            where: { payment: { orderId: id } },
          })
        ).status,
      ).toBe('UNKNOWN');
      await start(id);
      const calls = creates.filter((call) => call.orderId === id);
      expect(calls).toHaveLength(2);
      expect(calls[0].key).toBe(calls[1].key);
      expect(calls[0].expiresAt).toEqual(calls[1].expiresAt);
      await me('post', `orders/${id}/cancel`).expect(200);
    });
    it('expires provider Session before cancelling, and records late money without restoring stock', async () => {
      const id = await place(),
        session = await start(id);
      await Promise.all(
        [1, 2].map(() => me('post', `orders/${id}/cancel`).expect(200)),
      );
      expect(sessions.get(session.url!)!.status).toBe('expired');
      expect(
        await prisma.inventoryMovement.count({
          where: { sourceId: id, kind: 'RELEASE' },
        }),
      ).toBe(1);
      await sign(paid(session)).expect(200);
      await sign(paid(session)).expect(200);
      const payment = await prisma.payment.findUniqueOrThrow({
        where: { orderId: id },
      });
      expect(payment.capturedAmount).toBe(4620000n);
      expect((await me('get', `orders/${id}`)).body.data.backendStatus).toBe(
        'CANCELLED',
      );
      expect(
        await prisma.refund.count({
          where: { paymentId: payment.id, status: 'REQUESTED' },
        }),
      ).toBe(1);
      expect(
        (
          await prisma.stockReservation.findFirstOrThrow({
            where: { orderItem: { orderId: id } },
          })
        ).status,
      ).toBe('RELEASED');
    });
    it('releases expired sessions once and reconciles a payment when its webhook was missed', async () => {
      const id = await place(),
        session = await start(id);
      const expired = {
        ...session,
        status: 'expired',
      } as Stripe.Checkout.Session;
      await sign(expired, 'checkout.session.expired').expect(200);
      await sign(expired, 'checkout.session.expired').expect(200);
      expect((await me('get', `orders/${id}`)).body.data.backendStatus).toBe(
        'EXPIRED',
      );
      expect(
        await prisma.inventoryMovement.count({
          where: { sourceId: id, kind: 'RELEASE' },
        }),
      ).toBe(1);
      const missing = await place(),
        complete = paid(await start(missing));
      sessions.set(complete.url!, complete);
      await prisma.order.update({
        where: { id: missing },
        data: { placedAt: new Date(Date.now() - 120000) },
      });
      await app.get(StripePaymentService).reconcilePending();
      expect((await me('get', `orders/${missing}`)).body.data.payment).toBe(
        'paid',
      );
    });
    it('rolls back capture and inbox if a later DB write fails, then accepts the same event retry', async () => {
      const id = await place(),
        session = await start(id);
      const conflicting = await prisma.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: 'PENDING_PAYMENT',
          toStatus: 'CONFIRMED',
          operationKey: `paid:${id}`,
        },
      });
      const eventId = `evt_${randomUUID()}`;
      await sign(paid(session), 'checkout.session.completed', {
        id: eventId,
      }).expect(409);
      const payment = await prisma.payment.findUniqueOrThrow({
        where: { orderId: id },
      });
      expect(payment.capturedAmount).toBe(0n);
      expect(
        await prisma.paymentTransaction.count({
          where: { attemptId: session.metadata!.attemptId },
        }),
      ).toBe(0);
      expect(
        await prisma.providerEvent.count({
          where: { externalEventId: eventId },
        }),
      ).toBe(0);
      expect((await me('get', `orders/${id}`)).body.data.backendStatus).toBe(
        'PENDING_PAYMENT',
      );
      await prisma.orderStatusHistory.delete({ where: { id: conflicting.id } });
      await sign(paid(session), 'checkout.session.completed', {
        id: eventId,
      }).expect(200);
      expect((await me('get', `orders/${id}`)).body.data.payment).toBe('paid');
    });
    it('expires orders that never opened Checkout and keeps provider payloads redacted', async () => {
      const id = await place();
      await prisma.order.update({
        where: { id },
        data: {
          placedAt: new Date(Date.now() - 7200000),
          paymentDeadline: new Date(Date.now() - 1000),
        },
      });
      await app.get(StripePaymentService).reconcilePending();
      expect((await me('get', `orders/${id}`)).body.data.backendStatus).toBe(
        'EXPIRED',
      );
      const records = JSON.stringify(await prisma.providerEvent.findMany());
      expect(records).not.toContain('checkout.stripe.com');
      expect(records).not.toContain('client_secret');
      expect(records).not.toContain('stripe@isolated.test');
    });
  },
);
