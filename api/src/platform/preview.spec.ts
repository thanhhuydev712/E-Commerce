import express from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { previewBoundary } from './preview.js';

function fixture(enabled: boolean) {
  const app = express();
  let calls = 0;
  app.use(previewBoundary(enabled));
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
