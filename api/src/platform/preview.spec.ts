import express from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { previewBoundary } from './preview.js';

function fixture(enabled: boolean, interactiveDemo = false) {
  const app = express();
  let calls = 0;
  app.use(previewBoundary(enabled, interactiveDemo));
  app.use((_req, res) => {
    calls += 1;
    res.status(200).json({ ok: true });
  });
  return { app, calls: () => calls };
}
describe('Public preview HTTP boundary', () => {
  it('preserves normal application behavior when disabled', async () => {
    const target = fixture(false);
    await request(target.app).post('/api/v1/me/orders').expect(200);
    expect(target.calls()).toBe(1);
  });
  it('allows public catalog and media reads', async () => {
    const target = fixture(true);
    for (const path of [
      '/api/v1/storefront',
      '/api/v1/products/example',
      '/api/v1/media/image-id',
      '/api/v1/health/ready',
    ])
      await request(target.app).get(path).expect(200);
    expect(target.calls()).toBe(4);
  });
  it('blocks write operations before any downstream handler executes', async () => {
    const target = fixture(true);
    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const response = await request(target.app)
        [method]('/api/v1/me/orders')
        .send({ price: 1 })
        .expect(503);
      expect(response.body.error.code).toBe('PREVIEW_READ_ONLY');
    }
    await request(target.app).post('/api/v1/webhooks/stripe').expect(503);
    await request(target.app).post('/api/v1/auth/forgot-password').expect(503);
    await request(target.app).post('/api/v1/auth/reset-password').expect(503);
    expect(target.calls()).toBe(0);
  });
  it('does not restore sessions or expose private/admin reads', async () => {
    const target = fixture(true);
    await request(target.app)
      .post('/api/v1/auth/session?ignored=1')
      .expect(401);
    await request(target.app)
      .get('/api/v1/me/orders')
      .set('Authorization', 'Bearer ignored')
      .expect(401);
    await request(target.app).get('/api/v1/admin/products').expect(401);
    expect(target.calls()).toBe(0);
  });
});

describe('Interactive preview HTTP boundary', () => {
  it('allows only the supported login, cart and saved-build methods, including trailing slashes', async () => {
    const target = fixture(true, true);
    const routes = [
      ['post', '/api/v1/auth/login'],
      ['post', '/api/v1/auth/session?ignored=1'],
      ['post', '/api/v1/auth/refresh'],
      ['post', '/api/v1/auth/logout'],
      ['get', '/api/v1/auth/me'],
      ['head', '/api/v1/auth/me'],
      ['get', '/api/v1/me'],
      ['head', '/api/v1/me'],
      ['get', '/api/v1/me/cart'],
      ['head', '/api/v1/me/cart'],
      ['put', '/api/v1/me/cart'],
      ['post', '/api/v1/me/cart/items'],
      ['post', '/api/v1/me/cart/build'],
      ['get', '/api/v1/me/builds'],
      ['head', '/api/v1/me/builds'],
      ['post', '/api/v1/me/builds'],
      ['delete', '/api/v1/me/builds/00000000-0000-0000-0000-000000000001'],
    ] as const;
    for (const [method, path] of routes) {
      await request(target.app)[method](path).expect(200);
      // Query parameters do not participate in route authorization.
      await request(target.app)
        [method](path.split('?')[0] + '/')
        .expect(200);
    }
    expect(target.calls()).toBe(routes.length * 2);
  });

  it('keeps registration, recovery, checkout, orders, payments and admin closed before handlers run', async () => {
    const target = fixture(true, true);
    for (const path of [
      '/api/v1/auth/register',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/verification/request',
      '/api/v1/auth/verification/confirm',
      '/api/v1/me/checkout/quote',
      '/api/v1/me/orders',
      '/api/v1/me/orders/00000000-0000-0000-0000-000000000001/cancel',
      '/api/v1/me/orders/00000000-0000-0000-0000-000000000001/stripe-checkout',
      '/api/v1/webhooks/stripe',
      '/api/v1/admin/media',
      '/api/v1/me/wishlist/item',
      '/api/v1/me/support',
    ]) {
      for (const suffix of ['', '/'])
        await request(target.app)
          .post(path + suffix)
          .expect(503);
    }
    for (const path of [
      '/api/v1/me/orders',
      '/api/v1/admin/products',
      '/api/v1/me/wishlist',
      '/api/v1/me/sessions',
      '/api/v1/me/addresses',
      '/api/v1/me/preferences',
      '/api/v1/me/notifications',
    ]) {
      const response = await request(target.app).get(path).expect(503);
      expect(response.body.error.code).toBe('DEMO_FEATURE_DISABLED');
      await request(target.app).head(path).expect(503);
    }
    expect(target.calls()).toBe(0);
  });

  it('rejects unsupported methods, extra segments and encoded path aliases', async () => {
    const target = fixture(true, true);
    for (const [method, path] of [
      ['get', '/api/v1/auth/login'],
      ['head', '/api/v1/auth/session'],
      ['get', '/api/v1/auth/login/extra'],
      ['post', '/api/v1/auth/login/extra'],
      ['post', '/api/v1/me'],
      ['patch', '/api/v1/me'],
      ['post', '/api/v1/me/cart'],
      ['delete', '/api/v1/me/cart'],
      ['patch', '/api/v1/me/cart'],
      ['head', '/api/v1/me/cart/items'],
      ['put', '/api/v1/me/cart/items'],
      ['post', '/api/v1/me/cart/build/extra'],
      ['post', '/api/v1/me/cart//items'],
      ['post', '/api/v1/me%2fcart/items'],
      ['post', '/api/v1/me/cart/%69tems'],
      ['post', '/api/v1/me/cart/items//'],
      ['get', '/api/v1/me/builds/00000000-0000-0000-0000-000000000001'],
      ['put', '/api/v1/me/builds'],
      ['delete', '/api/v1/me/builds/not-a-uuid'],
      [
        'delete',
        '/api/v1/me/builds/00000000-0000-0000-0000-000000000001/extra',
      ],
    ] as const) {
      await request(target.app)[method](path).expect(503);
    }
    expect(target.calls()).toBe(0);
  });

  it('does not enable demo paths by default and preserves public reads/preflight', async () => {
    const readOnly = fixture(true);
    await request(readOnly.app).post('/api/v1/auth/login').expect(503);
    await request(readOnly.app).get('/api/v1/me/cart').expect(401);
    expect(readOnly.calls()).toBe(0);
    const demo = fixture(true, true);
    await request(demo.app).get('/api/v1/storefront').expect(200);
    await request(demo.app).head('/api/v1/products/example/').expect(200);
    await request(demo.app).options('/api/v1/me/orders').expect(200);
    expect(demo.calls()).toBe(3);
  });
});
