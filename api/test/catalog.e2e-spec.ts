import 'reflect-metadata';
import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Client } from 'pg';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { seedAccess } from '../src/modules/access/access.seed.js';
import { configureHttp } from '../src/platform/http.js';

const schema = `codex_catalog_test_${randomUUID().replaceAll('-', '')}`;
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1hYAAAAASUVORK5CYII=',
  'base64',
);
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  'Catalog/pricing/media/inventory APIs (isolated PostgreSQL)',
  () => {
    let app: INestApplication,
      prisma: PrismaService,
      db: Client,
      mediaRoot: string;
    let schemaCreated = false,
      admin = '',
      customer = '',
      actorId = '',
      productId = '',
      variantId = '',
      categoryId = '',
      brandId = '',
      warehouseId = '',
      attributeId = '',
      otherProduct = '',
      assetId = '';
    const http = () => request(app.getHttpServer());
    const adminRequest = (
      method: 'get' | 'post' | 'put' | 'patch',
      route: string,
    ) =>
      http()
        [method](`/api/v1/${route}`)
        .set('Authorization', `Bearer ${admin}`);
    beforeAll(async () => {
      process.env.NODE_ENV = 'test';
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
      process.env.DATABASE_SCHEMA = schema;
      process.env.JWT_SECRET = randomBytes(48).toString('hex');
      process.env.JWT_REFRESH_SECRET = randomBytes(48).toString('hex');
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      process.env.JWT_EXPIRES_IN = '900';
      process.env.REFRESH_TTL_SECONDS = '604800';
      delete process.env.STRIPE_SECRET_KEY;
      mediaRoot = await mkdtemp(join(tmpdir(), 'codex-catalog-media-'));
      process.env.MEDIA_ROOT = mediaRoot;
      db = new Client({
        connectionString: process.env.TEST_DATABASE_URL,
        connectionTimeoutMillis: 15000,
        statement_timeout: 120000,
      });
      await db.connect();
      const sql = await readFile(
        new URL(
          '../prisma/v2/migrations/20261105000000_commerce_v2_baseline/migration.sql',
          import.meta.url,
        ),
        'utf8',
      );
      await db.query('BEGIN');
      await db.query(`CREATE SCHEMA "${schema}"`);
      await db.query(`SET LOCAL search_path TO "${schema}"`);
      await db.query(
        sql.replace(/^BEGIN;\s*$/m, '').replace(/COMMIT;\s*$/, ''),
      );
      await db.query('COMMIT');
      schemaCreated = true;
      const { AppModule } = await import('../src/app.module.js');
      const module = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = module.createNestApplication({ logger: false });
      configureHttp(app);
      await app.init();
      prisma = app.get(PrismaService);
      await seedAccess(prisma);
      await prisma.currency.create({
        data: {
          code: 'VND',
          name: 'Vietnamese dong',
          minorUnit: 0,
          isActive: true,
        },
      });
      const hash = await bcrypt.hash('CatalogPassword-2026!', 12);
      for (const code of ['ADMIN', 'CUSTOMER']) {
        const role = await prisma.role.findUniqueOrThrow({ where: { code } });
        const user = await prisma.user.create({
          data: {
            email: `${code.toLowerCase()}@catalog.test`,
            passwordHash: hash,
            status: 'ACTIVE',
            userRolesByUser: { create: { roleId: role.id } },
          },
        });
        const session = await app
          .get(AuthService)
          .login({ email: user.email, password: 'CatalogPassword-2026!' });
        if (code === 'ADMIN') {
          admin = session.accessToken;
          actorId = user.id;
        } else customer = session.accessToken;
      }
    });
    afterAll(async () => {
      if (app) await app.close();
      if (db) {
        await db.query('ROLLBACK');
        if (schemaCreated && /^codex_catalog_test_[a-f0-9]{32}$/.test(schema))
          await db.query(`DROP SCHEMA "${schema}" CASCADE`);
        await db.end();
      }
      if (
        mediaRoot &&
        resolve(mediaRoot).startsWith(resolve(tmpdir()) + sep) &&
        mediaRoot.includes('codex-catalog-media-')
      )
        await rm(mediaRoot, { recursive: true, force: true });
    });
    it('requires the correct permission and validates queries/unknown fields', async () => {
      await http().post('/api/v1/admin/products').send({}).expect(401);
      await http()
        .get('/api/v1/admin/inventory/balances')
        .set('Authorization', `Bearer ${customer}`)
        .expect(403);
      await http()
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${customer}`)
        .send({ name: 'X', slug: 'x' })
        .expect(403);
      await http().get('/api/v1/products?limit=101').expect(400);
      await http().get('/api/v1/products?page=999999999999999999').expect(400);
      await adminRequest(
        'get',
        'admin/inventory/balances?page=21474838',
      ).expect(400);
      await adminRequest('get', 'admin/accounts?page=21474838').expect(400);
      await adminRequest('post', 'admin/products')
        .send({ name: 'X', slug: 'x', price: '1', stock: 5 })
        .expect(400);
      const swagger = await http().get('/api/docs-json').expect(200);
      expect(
        swagger.body.components.schemas.ProductPriceDto.properties.amount.type,
      ).toBe('string');
      expect(swagger.body.paths['/api/v1/products']).toBeDefined();
      expect(swagger.body.paths['/api/v1/orders']).toBeUndefined();
    });
    it('rejects null for non-nullable optional fields before database mutations', async () => {
      const unknownId = randomUUID();
      await adminRequest('post', 'admin/categories')
        .send({
          name: 'Invalid category',
          slug: 'invalid-null',
          sortOrder: null,
        })
        .expect(400);
      await adminRequest('patch', `admin/categories/${unknownId}`)
        .send({ sortOrder: null })
        .expect(400);
      await adminRequest('patch', `admin/variants/${unknownId}`)
        .send({ optionValueIds: null })
        .expect(400);
      await adminRequest('post', 'admin/attributes')
        .send({
          code: 'null_flag',
          name: 'Invalid flag',
          dataType: 'BOOLEAN',
          isFilterable: null,
        })
        .expect(400);
      for (const invalid of [{ sortOrder: null }, { isPrimary: null }])
        await adminRequest('post', `admin/products/${unknownId}/media`)
          .send({ assetId: unknownId, ...invalid })
          .expect(400);
      await adminRequest('post', `admin/tax-classes/${unknownId}/rates`)
        .send({
          code: 'VAT',
          countryCode: 'VN',
          rate: '0.1',
          effectiveFrom: '2026-01-01T00:00:00Z',
          priority: null,
        })
        .expect(400);
    });
    it('creates taxonomy and a private draft; rejects publication without a category', async () => {
      const category = await adminRequest('post', 'admin/categories')
        .send({ name: 'Components', slug: 'components', sortOrder: 9 })
        .expect(201);
      categoryId = category.body.data.id;
      const brand = await adminRequest('post', 'admin/brands')
        .send({ name: 'Example brand', slug: 'example-brand' })
        .expect(201);
      brandId = brand.body.data.id;
      const attribute = await adminRequest('post', 'admin/attributes')
        .send({
          code: 'clock',
          name: 'Clock',
          dataType: 'NUMBER',
          unit: 'MHz',
          isFilterable: true,
        })
        .expect(201);
      attributeId = attribute.body.data.id;
      await adminRequest('put', `admin/categories/${categoryId}/attributes`)
        .send({ attributes: [{ attributeId, isRequired: true }] })
        .expect(200);
      const product = await adminRequest('post', 'admin/products')
        .send({ name: 'Demo CPU', slug: 'demo-cpu', brandId })
        .expect(201);
      productId = product.body.data.id;
      await http().get('/api/v1/products/demo-cpu').expect(404);
      await adminRequest('post', `admin/products/${productId}/publish`).expect(
        409,
      );
    });
    it('requires an active SKU, a VND price and required attributes before publication', async () => {
      await adminRequest('put', `admin/products/${productId}/categories`)
        .send({ categoryIds: [categoryId], primaryCategoryId: categoryId })
        .expect(200);
      const variant = await adminRequest(
        'post',
        `admin/products/${productId}/variants`,
      )
        .send({ sku: 'CPU-DEFAULT' })
        .expect(201);
      variantId = variant.body.data.id;
      await adminRequest('post', `admin/products/${productId}/publish`).expect(
        409,
      );
      await adminRequest('put', `admin/variants/${variantId}/price`)
        .send({ amount: '9007199254740993' })
        .expect(200);
      await adminRequest('post', `admin/products/${productId}/publish`).expect(
        409,
      );
    });
    it('validates typed attributes and publishes exact VND prices without losing precision', async () => {
      await adminRequest('put', `admin/products/${productId}/attributes`)
        .send({ attributes: [{ attributeId, textValue: 'wrong type' }] })
        .expect(400);
      await adminRequest('put', `admin/products/${productId}/attributes`)
        .send({
          attributes: [
            { attributeId, numberValue: '3200.125000', booleanValue: false },
          ],
        })
        .expect(400);
      await adminRequest('put', `admin/products/${productId}/attributes`)
        .send({ attributes: [{ attributeId, numberValue: '3200.125000' }] })
        .expect(200);
      await adminRequest('post', `admin/products/${productId}/publish`).expect(
        200,
      );
      const visible = await http().get('/api/v1/products/demo-cpu').expect(200);
      expect(visible.body.data.variants[0].price).toMatchObject({
        amount: '9007199254740993',
        currency: 'VND',
      });
      expect(visible.body.data.attributes[0].value).toBe('3200.125');
      expect(visible.body.data.variants[0].inventoryBalances).toBeUndefined();
      await adminRequest('put', `admin/products/${productId}/attributes`)
        .send({ attributes: [] })
        .expect(409);
      expect(
        await prisma.productAttributeValue.count({ where: { productId } }),
      ).toBe(1);
      await adminRequest('put', `admin/categories/${categoryId}/attributes`)
        .send({ attributes: [] })
        .expect(409);
    });
    it('validates VND strings/ranges and rolls back invalid prices', async () => {
      for (const data of [
        { amount: 100 },
        { amount: '1.25' },
        { amount: '-1' },
        { amount: '9223372036854775808' },
        { amount: '100', compareAtAmount: '99' },
        { amount: '100', currency: 'USD' },
      ])
        await adminRequest('put', `admin/variants/${variantId}/price`)
          .send(data)
          .expect(400);
      expect(
        (
          await prisma.variantPrice.findFirstOrThrow({ where: { variantId } })
        ).amount.toString(),
      ).toBe('9007199254740993');
      const query = await http()
        .get(
          `/api/v1/products?q=CPU-DEFAULT&brandId=${brandId}&categoryId=${categoryId}&minPrice=9007199254740993&maxPrice=9007199254740993&sort=name`,
        )
        .expect(200);
      expect(query.body.data.total).toBe(1);
      await http().get('/api/v1/products?minPrice=20&maxPrice=10').expect(400);
      await http()
        .get('/api/v1/products?minPrice=9223372036854775808')
        .expect(400);
    });
    it('rejects category cycles, including concurrent parent changes; keeps omitted sort order', async () => {
      const first = await adminRequest('post', 'admin/categories')
        .send({ name: 'Root X', slug: 'root-x' })
        .expect(201);
      const second = await adminRequest('post', 'admin/categories')
        .send({ name: 'Root Y', slug: 'root-y' })
        .expect(201);
      const x = first.body.data.id,
        y = second.body.data.id;
      const results = await Promise.all([
        adminRequest('patch', `admin/categories/${x}`).send({ parentId: y }),
        adminRequest('patch', `admin/categories/${y}`).send({ parentId: x }),
      ]);
      expect(
        results.map((result) => result.status).sort((a, b) => a - b),
      ).toEqual([200, 400]);
      await adminRequest('patch', `admin/categories/${categoryId}`)
        .send({ parentId: categoryId })
        .expect(400);
      await adminRequest('patch', `admin/categories/${categoryId}`)
        .send({ description: 'Still order nine' })
        .expect(200);
      expect(
        (await prisma.category.findUniqueOrThrow({ where: { id: categoryId } }))
          .sortOrder,
      ).toBe(9);
    });
    it('hides products when category ancestry or brand is archived', async () => {
      const parent = await adminRequest('post', 'admin/categories')
        .send({ name: 'Parent', slug: 'parent' })
        .expect(201);
      await adminRequest('patch', `admin/categories/${categoryId}`)
        .send({ parentId: parent.body.data.id })
        .expect(200);
      await adminRequest(
        'put',
        `admin/categories/${parent.body.data.id}/status`,
      )
        .send({ status: 'ARCHIVED' })
        .expect(200);
      await http().get('/api/v1/products/demo-cpu').expect(404);
      expect(
        (await http().get('/api/v1/categories').expect(200)).body.data.some(
          (row: { id: string }) => row.id === categoryId,
        ),
      ).toBe(false);
      await adminRequest(
        'put',
        `admin/categories/${parent.body.data.id}/status`,
      )
        .send({ status: 'ACTIVE' })
        .expect(200);
      await adminRequest('put', `admin/brands/${brandId}/status`)
        .send({ status: 'ARCHIVED' })
        .expect(200);
      await http().get('/api/v1/products/demo-cpu').expect(404);
      await adminRequest('put', `admin/brands/${brandId}/status`)
        .send({ status: 'ACTIVE' })
        .expect(200);
      await http().get('/api/v1/products/demo-cpu').expect(200);
    });
    it('scopes option values to the product and rejects duplicate SKU/combinations', async () => {
      const product = await adminRequest('post', 'admin/products')
        .send({ name: 'RAM', slug: 'ram' })
        .expect(201);
      otherProduct = product.body.data.id;
      const option = await adminRequest(
        'post',
        `admin/products/${otherProduct}/options`,
      )
        .send({
          code: 'capacity',
          name: 'Capacity',
          values: [
            { code: '16', label: '16 GB' },
            { code: '32', label: '32 GB' },
          ],
        })
        .expect(201);
      const ids = option.body.data.productOptionValues.map(
        (value: { id: string }) => value.id,
      );
      const variant = await adminRequest(
        'post',
        `admin/products/${otherProduct}/variants`,
      )
        .send({ sku: 'RAM-16', optionValueIds: [ids[0]] })
        .expect(201);
      await adminRequest('post', `admin/products/${otherProduct}/variants`)
        .send({ sku: 'RAM-DUP', optionValueIds: [ids[0]] })
        .expect(409);
      await adminRequest('post', `admin/products/${otherProduct}/variants`)
        .send({ sku: 'RAM-16', optionValueIds: [ids[1]] })
        .expect(409);
      await adminRequest('post', `admin/products/${otherProduct}/variants`)
        .send({ sku: 'RAM-INVALID', optionValueIds: [] })
        .expect(400);
      await adminRequest('patch', `admin/variants/${variantId}`)
        .send({ optionValueIds: [ids[0]] })
        .expect(400);
      await adminRequest('post', `admin/products/${productId}/options`)
        .send({
          code: 'invalid',
          name: 'Cannot edit active',
          values: [{ code: 'x', label: 'X' }],
        })
        .expect(409);
      await adminRequest('patch', `admin/variants/${variant.body.data.id}`)
        .send({ sku: 'MUTATED' })
        .expect(400);
    });
    it('stores boolean false without losing its declared type', async () => {
      const attribute = await adminRequest('post', 'admin/attributes')
        .send({ code: 'rgb', name: 'RGB', dataType: 'BOOLEAN' })
        .expect(201);
      await adminRequest('put', `admin/products/${otherProduct}/attributes`)
        .send({
          attributes: [
            { attributeId: attribute.body.data.id, booleanValue: false },
          ],
        })
        .expect(200);
      expect(
        (
          await prisma.productAttributeValue.findFirstOrThrow({
            where: { productId: otherProduct },
          })
        ).booleanValue,
      ).toBe(false);
    });
    it('adjusts stock exactly once and rejects payload/key mismatch', async () => {
      const warehouse = await adminRequest('post', 'admin/inventory/warehouses')
        .send({ code: 'DEMO', name: 'Demo warehouse', address: 'Test address' })
        .expect(201);
      warehouseId = warehouse.body.data.id;
      const dto = {
        variantId,
        warehouseId,
        delta: 10,
        expectedVersion: 0,
        reason: 'Opening fixture',
      };
      await adminRequest('post', 'admin/inventory/adjustments')
        .send(dto)
        .expect(400);
      const [first, repeated] = await Promise.all(
        [1, 2].map(() =>
          adminRequest('post', 'admin/inventory/adjustments')
            .set('Idempotency-Key', 'catalog-opening-001')
            .send(dto)
            .expect(200),
        ),
      );
      expect(repeated.body.data).toEqual(first.body.data);
      await adminRequest('post', 'admin/inventory/adjustments')
        .set('Idempotency-Key', 'catalog-opening-001')
        .send({ ...dto, delta: 1 })
        .expect(409);
      expect(await prisma.inventoryMovement.count()).toBe(1);
      const visible = await http().get('/api/v1/products/demo-cpu').expect(200);
      expect(visible.body.data.variants[0].available).toBe(10);
    });
    it('serializes stock updates; protects unavailable/reserved stock and serial tracking', async () => {
      const outcomes = await Promise.all(
        [1, 2].map((index) =>
          adminRequest('post', 'admin/inventory/adjustments')
            .set('Idempotency-Key', `concurrent-stock-${index}`)
            .send({
              variantId,
              warehouseId,
              delta: 1,
              expectedVersion: 1,
              reason: 'Concurrent adjustment',
            }),
        ),
      );
      expect(
        outcomes.map((result) => result.status).sort((a, b) => a - b),
      ).toEqual([200, 409]);
      let balance = await prisma.inventoryBalance.findFirstOrThrow({
        where: { variantId },
      });
      await prisma.inventoryBalance.update({
        where: { id: balance.id },
        data: { unavailable: 3 },
      });
      await prisma.inventoryMovement.create({
        data: {
          balanceId: balance.id,
          onHandDelta: 0,
          reservedDelta: 0,
          unavailableDelta: 3,
          kind: 'QUARANTINE',
          operationKey: 'fixture-quarantine',
          sourceType: 'TEST',
          sourceId: balance.id,
          actorId,
          occurredAt: new Date(),
        },
      });
      await adminRequest('post', 'admin/inventory/adjustments')
        .set('Idempotency-Key', 'below-unavailable-001')
        .send({
          variantId,
          warehouseId,
          delta: -balance.onHand,
          expectedVersion: balance.version,
          reason: 'Invalid removal',
        })
        .expect(409);
      await prisma.inventoryBalance.update({
        where: { id: balance.id },
        data: { reserved: 1 },
      });
      await adminRequest('post', `admin/products/${productId}/archive`).expect(
        409,
      );
      await adminRequest('put', `admin/variants/${variantId}/status`)
        .send({ status: 'ARCHIVED' })
        .expect(409);
      await prisma.inventoryBalance.update({
        where: { id: balance.id },
        data: { reserved: 0 },
      });
      await prisma.productVariant.update({
        where: { id: variantId },
        data: { trackSerial: true },
      });
      await adminRequest('post', 'admin/inventory/adjustments')
        .set('Idempotency-Key', 'serial-adjust-001')
        .send({
          variantId,
          warehouseId,
          delta: 1,
          expectedVersion: balance.version,
          reason: 'Serial not enabled',
        })
        .expect(409);
      await prisma.productVariant.update({
        where: { id: variantId },
        data: { trackSerial: false },
      });
      balance = await prisma.inventoryBalance.findUniqueOrThrow({
        where: { id: balance.id },
      });
      const ledger = await prisma.inventoryMovement.aggregate({
        where: { balanceId: balance.id },
        _sum: { onHandDelta: true, unavailableDelta: true },
      });
      expect(balance.onHand).toBe(ledger._sum.onHandDelta);
      expect(balance.unavailable).toBe(ledger._sum.unavailableDelta);
    });
    it('rejects spoofed/unsafe media and keeps unlinked uploads private', async () => {
      await adminRequest('post', 'admin/media')
        .attach('file', Buffer.from('ffd8' + 'ff'.repeat(18) + 'd9', 'hex'), {
          filename: 'truncated.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);
      await adminRequest('post', 'admin/media')
        .attach('file', Buffer.from('<svg/>'), {
          filename: 'x.svg',
          contentType: 'image/svg+xml',
        })
        .expect(400);
      await adminRequest('post', 'admin/media')
        .attach('file', Buffer.from('not a png'), {
          filename: 'x.png',
          contentType: 'image/png',
        })
        .expect(400);
      const uploaded = await adminRequest('post', 'admin/media')
        .attach('file', png, {
          filename: 'image.png',
          contentType: 'image/png',
        })
        .expect(201);
      assetId = uploaded.body.data.id;
      expect(uploaded.body.data).toMatchObject({
        status: 'READY',
        width: 1,
        height: 1,
      });
      expect(uploaded.body.data.storageKey).toBeUndefined();
      await http().get(`/api/v1/media/${assetId}`).expect(404);
      await adminRequest('get', `admin/media/${assetId}/content`)
        .expect('Content-Type', /image\/png/)
        .expect(200);
      await http()
        .get(`/api/v1/admin/media/${assetId}`)
        .set('Authorization', `Bearer ${customer}`)
        .expect(403);
    });
    it('publishes only attached READY media and guards variant ownership', async () => {
      const foreign = await prisma.productVariant.findFirstOrThrow({
        where: { productId: otherProduct },
      });
      await adminRequest('post', `admin/products/${productId}/media`)
        .send({ assetId, variantId: foreign.id, isPrimary: true })
        .expect(400);
      await adminRequest('post', `admin/products/${productId}/media`)
        .send({ assetId, isPrimary: true, altText: 'Example' })
        .expect(201);
      const image = await http()
        .get(`/api/v1/media/${assetId}`)
        .expect('Content-Type', /image\/png/)
        .expect(200);
      expect(image.headers['x-content-type-options']).toBe('nosniff');
      expect(image.body).toEqual(png);
      await adminRequest(
        'post',
        `admin/products/${productId}/unpublish`,
      ).expect(200);
      await http().get(`/api/v1/media/${assetId}`).expect(404);
      await adminRequest('post', `admin/products/${productId}/publish`).expect(
        200,
      );
      const pending = await prisma.mediaAsset.create({
        data: {
          storageKey: 'pending/legacy',
          originalName: 'legacy',
          mimeType: 'image/png',
          sizeBytes: 0n,
          status: 'PENDING',
        },
      });
      await adminRequest('post', `admin/products/${productId}/media`)
        .send({ assetId: pending.id })
        .expect(400);
    });
    it('supports exact tax metadata and rejects overlapping effective intervals', async () => {
      const group = await adminRequest('post', 'admin/tax-classes')
        .send({ code: 'STANDARD', name: 'Standard' })
        .expect(201);
      const id = group.body.data.id;
      const dto = {
        code: 'VAT',
        countryCode: 'VN',
        rate: '0.1',
        effectiveFrom: '2026-01-01T00:00:00Z',
        effectiveTo: '2027-01-01T00:00:00Z',
      };
      const rate = await adminRequest('post', `admin/tax-classes/${id}/rates`)
        .send(dto)
        .expect(201);
      expect(rate.body.data.rate).toBe('0.1');
      await adminRequest('post', `admin/tax-classes/${id}/rates`)
        .send({ ...dto, effectiveFrom: '2026-06-01T00:00:00Z' })
        .expect(409);
      await adminRequest('post', `admin/tax-classes/${id}/rates`)
        .send({
          ...dto,
          effectiveFrom: dto.effectiveTo,
          effectiveTo: '2028-01-01T00:00:00Z',
        })
        .expect(201);
      await adminRequest('post', `admin/tax-classes/${id}/rates`)
        .send({ ...dto, rate: '1.2' })
        .expect(400);
      expect(
        await prisma.auditLog.count({
          where: { actorId, action: 'VARIANT_PRICE_SET' },
        }),
      ).toBe(1);
      expect(await prisma.order.count()).toBe(0);
    });
  },
);
