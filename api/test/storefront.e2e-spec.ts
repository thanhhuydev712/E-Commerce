import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { Client } from 'pg';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, sep } from 'node:path';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { seedAccess } from '../src/modules/access/access.seed.js';
import { configureHttp } from '../src/platform/http.js';

const schema = `codex_store_test_${randomUUID().replaceAll('-', '')}`;
const mediaRoot = resolve('.tmp', schema);
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  'Database seed and storefront commerce (real PostgreSQL)',
  () => {
    let app: INestApplication,
      db: Client,
      prisma: PrismaService,
      created = false,
      token = '',
      other = '',
      productId = '',
      variantId = '',
      quoteId = '',
      orderId = '';
    const http = () => request(app.getHttpServer());
    const me = (
      method: 'get' | 'post' | 'put' | 'delete',
      path: string,
      bearer = token,
    ) =>
      http()
        [method](`/api/v1/me/${path}`)
        .set('Authorization', `Bearer ${bearer}`);
    const seed = () =>
      execFileSync(
        process.execPath,
        ['prisma/seed-storefront.cjs', '--apply'],
        {
          cwd: process.cwd(),
          env: { ...process.env, MEDIA_ROOT: mediaRoot },
          encoding: 'utf8',
          timeout: 150000,
        },
      );
    beforeAll(async () => {
      Object.assign(process.env, {
        NODE_ENV: 'test',
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        DATABASE_SCHEMA: schema,
        JWT_SECRET: randomBytes(48).toString('hex'),
        JWT_REFRESH_SECRET: randomBytes(48).toString('hex'),
        ALLOWED_ORIGINS: 'http://localhost:3000',
        MEDIA_ROOT: mediaRoot,
      });
      // Empty values override ConfigModule's .env loading; deleting would allow
      // developer sandbox credentials to be loaded again inside this test app.
      process.env.STRIPE_SECRET_KEY = '';
      process.env.STRIPE_WEBHOOK_SECRET = '';
      db = new Client({
        connectionString: process.env.TEST_DATABASE_URL,
        connectionTimeoutMillis: 15000,
        statement_timeout: 120000,
      });
      await db.connect();
      await db.query('BEGIN');
      await db.query(`CREATE SCHEMA "${schema}"`);
      await db.query(`SET LOCAL search_path TO "${schema}"`);
      for (const file of [
        'prisma/v2/migrations/20261105000000_commerce_v2_baseline/migration.sql',
        'prisma/migrations/20261106010000_storefront_saved_builds/migration.sql',
      ]) {
        const sql = await readFile(file, 'utf8');
        await db.query(
          sql.replace(/^BEGIN;\s*$/m, '').replace(/COMMIT;\s*$/, ''),
        );
      }
      await db.query('COMMIT');
      created = true;
      await mkdir(mediaRoot, { recursive: true });
      seed();
      const { AppModule } = await import('../src/app.module.js');
      const module = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = module.createNestApplication({ logger: false });
      configureHttp(app);
      await app.init();
      prisma = app.get(PrismaService);
      await seedAccess(prisma);
      for (const email of ['buyer@storefront.test', 'other@storefront.test']) {
        const response = await http()
          .post('/api/v1/auth/register')
          .set('Origin', 'http://localhost:3000')
          .send({
            email,
            password: 'IntegrationPassword-2026!',
            firstName: 'Buyer',
          })
          .expect(201);
        if (email.startsWith('buyer')) token = response.body.data.accessToken;
        else other = response.body.data.accessToken;
      }
    }, 240000);
    afterAll(async () => {
      if (app) await app.close();
      if (db) {
        await db.query('ROLLBACK');
        if (created && /^codex_store_test_[a-f0-9]{32}$/.test(schema))
          await db.query(`DROP SCHEMA "${schema}" CASCADE`);
        await db.end();
      }
      if (mediaRoot.startsWith(resolve('.tmp') + sep))
        await rm(mediaRoot, { recursive: true, force: true });
    });
    it('seeds relational catalog idempotently without duplicating stock or ledger', async () => {
      const before = await prisma.inventoryMovement.count();
      seed();
      expect(await prisma.product.count()).toBe(183);
      expect(await prisma.productVariant.count()).toBe(185);
      expect(await prisma.inventoryMovement.count()).toBe(before);
    });
    it('serves database-backed catalog, articles and safe local media', async () => {
      const response = await http().get('/api/v1/storefront').expect(200);
      const data = response.body.data;
      expect(data.products).toHaveLength(183);
      expect(data.categories).toHaveLength(26);
      expect(data.articles).toHaveLength(8);
      const product = data.products.find(
        (p: { id: string }) => p.id === 'ryzen-7600',
      );
      productId = product.databaseId;
      variantId = product.variants[0].id;
      expect(typeof product.price).toBe('string');
      expect(product.technical.integrated).toBe(true);
      expect(product.image).toMatch(/^\/api\/v1\/media\//);
      await http()
        .get(product.image)
        .expect(200)
        .expect('X-Content-Type-Options', 'nosniff');
    });
    it('protects cart mutations and rejects browser prices/overselling', async () => {
      await http()
        .post('/api/v1/me/cart/items')
        .send({ variantId, quantity: 1 })
        .expect(401);
      await me('post', 'cart/items')
        .send({ variantId, quantity: 1, price: '1' })
        .expect(400);
      await me('post', 'cart/items')
        .send({ variantId, quantity: 99 })
        .expect(409);
      await me('post', 'cart/items')
        .send({ variantId, quantity: 1 })
        .expect(201);
      expect((await me('get', 'cart').expect(200)).body.data.lines).toEqual([
        { variantId, quantity: 1 },
      ]);
      expect(
        (await me('get', 'cart', other).expect(200)).body.data.lines,
      ).toEqual([]);
    });
    it('persists wishlist, saved builds, support and notification preferences per owner', async () => {
      expect(
        (await me('post', `wishlist/${productId}`).expect(201)).body.data,
      ).toContain('ryzen-7600');
      const build = await me('post', 'builds')
        .send({ name: 'My PC', components: { cpu: productId } })
        .expect(201);
      expect(build.body.data[0].build.cpu).toBe('ryzen-7600');
      expect((await me('get', 'builds', other).expect(200)).body.data).toEqual(
        [],
      );
      await me('delete', `builds/${build.body.data[0].id}`, other).expect(200);
      expect((await me('get', 'builds').expect(200)).body.data).toHaveLength(1);
      await me('post', 'support')
        .send({
          subject: 'Delivery question',
          body: 'Please explain the delivery policy',
        })
        .expect(201);
      expect((await me('get', 'support').expect(200)).body.data).toHaveLength(
        1,
      );
      await me('put', 'preferences').send({ enabled: false }).expect(200);
      expect(
        (await me('get', 'preferences').expect(200)).body.data.enabled,
      ).toBe(false);
    });
    it('quotes server prices and refuses unconfigured online payment', async () => {
      for (const optional of [{ express: null }, { couponCode: null }])
        await me('post', 'checkout/quote')
          .send({
            customer: 'Test Buyer',
            phone: '0900000000',
            address: 'Demo address, Vietnam',
            ...optional,
          })
          .expect(400);
      await me('post', 'support')
        .send({
          subject: 'Invalid optional',
          body: 'Do not create a ticket',
          orderId: null,
        })
        .expect(400);
      const response = await me('post', 'checkout/quote')
        .send({
          customer: 'Test Buyer',
          phone: '0900000000',
          address: 'Demo address, Vietnam',
          express: false,
        })
        .expect(201);
      quoteId = response.body.data.id;
      expect(response.body.data.total).toBe('4620000');
      await me('post', 'orders')
        .set('Idempotency-Key', 'stripe-not-configured')
        .send({ quoteId, method: 'STRIPE' })
        .expect(503);
      await me('post', 'orders')
        .set('Idempotency-Key', 'order-client-price')
        .send({ quoteId, method: 'COD', total: '1' })
        .expect(400);
    });
    it('places the same COD order exactly once, with immutable totals and stock reservation', async () => {
      const results = await Promise.all(
        [1, 2].map(() =>
          me('post', 'orders')
            .set('Idempotency-Key', 'storefront-order-001')
            .send({ quoteId, method: 'COD' })
            .expect(201),
        ),
      );
      expect(results[0].body.data.id).toBe(results[1].body.data.id);
      orderId = results[0].body.data.id;
      expect(await prisma.order.count()).toBe(1);
      expect(results[0].body.data.total).toBe('4620000');
      expect(results[0].body.data.payment).toBe('pending');
      expect(
        (
          await prisma.inventoryBalance.findFirstOrThrow({
            where: { variantId },
          })
        ).reserved,
      ).toBe(1);
      await me('get', `orders/${orderId}`, other).expect(404);
      await me('post', 'orders')
        .set('Idempotency-Key', 'storefront-order-001')
        .send({ quoteId: randomUUID(), method: 'COD' })
        .expect(409);
    });
    it('cancels idempotently and releases reserved stock once, preserving on-hand ledger', async () => {
      await Promise.all(
        [1, 2].map(() => me('post', `orders/${orderId}/cancel`).expect(200)),
      );
      const balance = await prisma.inventoryBalance.findFirstOrThrow({
        where: { variantId },
      });
      expect(balance.reserved).toBe(0);
      expect(balance.onHand).toBe(12);
      expect(
        await prisma.inventoryMovement.count({
          where: { sourceId: orderId, kind: 'RELEASE' },
        }),
      ).toBe(1);
      expect(
        (await me('get', `orders/${orderId}`).expect(200)).body.data.total,
      ).toBe('4620000');
    });
    it('allocates coupon discount exactly to order lines and restores eligibility after cancellation', async () => {
      await me('post', 'cart/items')
        .send({ variantId, quantity: 1 })
        .expect(201);
      const quote = await me('post', 'checkout/quote')
        .send({
          customer: 'Coupon Buyer',
          phone: '0900000000',
          address: 'Demo address, Vietnam',
          couponCode: 'RIGFORGE5',
        })
        .expect(201);
      expect(quote.body.data.discount).toBe('229500');
      expect(quote.body.data.total).toBe('4390500');
      const order = await me('post', 'orders')
        .set('Idempotency-Key', 'coupon-order-001')
        .send({ quoteId: quote.body.data.id, method: 'COD' })
        .expect(201);
      const lines = await prisma.orderItem.findMany({
        where: { orderId: order.body.data.id },
      });
      expect(lines.reduce((sum, line) => sum + line.discountAmount, 0n)).toBe(
        229500n,
      );
      expect(
        lines.reduce((sum, line) => sum + line.lineTotal, 0n) +
          BigInt(order.body.data.shipping),
      ).toBe(BigInt(order.body.data.total));
      await me('post', `orders/${order.body.data.id}/cancel`).expect(200);
    });
    it('serializes competing customers for the last unit and rejects a stale price quote', async () => {
      const balance = await prisma.inventoryBalance.findFirstOrThrow({
        where: { variantId },
      });
      await prisma.inventoryBalance.update({
        where: { id: balance.id },
        data: { onHand: 1, version: { increment: 1 } },
      });
      await prisma.inventoryMovement.create({
        data: {
          balanceId: balance.id,
          onHandDelta: 1 - balance.onHand,
          reservedDelta: 0,
          unavailableDelta: 0,
          kind: 'ADJUST',
          operationKey: 'test:last-unit',
          sourceType: 'TEST_FIXTURE',
          sourceId: balance.id,
          reason: 'Last unit concurrency fixture',
          occurredAt: new Date(),
        },
      });
      const dto = {
        customer: 'Concurrent Buyer',
        phone: '0900000000',
        address: 'Demo address, Vietnam',
      };
      await me('post', 'cart/items')
        .send({ variantId, quantity: 1 })
        .expect(201);
      await me('post', 'cart/items', other)
        .send({ variantId, quantity: 1 })
        .expect(201);
      const stale = await me('post', 'checkout/quote').send(dto).expect(201);
      await prisma.variantPrice.update({
        where: { variantId_currencyCode: { variantId, currencyCode: 'VND' } },
        data: { amount: 4590001n },
      });
      await me('post', 'orders')
        .set('Idempotency-Key', 'stale-price-001')
        .send({ quoteId: stale.body.data.id, method: 'COD' })
        .expect(409);
      await prisma.variantPrice.update({
        where: { variantId_currencyCode: { variantId, currencyCode: 'VND' } },
        data: { amount: 4590000n },
      });
      const first = await me('post', 'checkout/quote').send(dto).expect(201);
      const second = await me('post', 'checkout/quote', other)
        .send(dto)
        .expect(201);
      const outcomes = await Promise.all([
        me('post', 'orders')
          .set('Idempotency-Key', 'last-unit-user-a')
          .send({ quoteId: first.body.data.id, method: 'COD' }),
        me('post', 'orders', other)
          .set('Idempotency-Key', 'last-unit-user-b')
          .send({ quoteId: second.body.data.id, method: 'COD' }),
      ]);
      expect(outcomes.map((r) => r.status).sort((a, b) => a - b)).toEqual([
        201, 409,
      ]);
      expect(
        (
          await prisma.inventoryBalance.findUniqueOrThrow({
            where: { id: balance.id },
          })
        ).reserved,
      ).toBe(1);
    });
  },
);
