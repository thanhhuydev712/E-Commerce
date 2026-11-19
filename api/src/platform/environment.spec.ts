import { describe, it, expect } from 'vitest';
import { validateEnvironment } from './environment.js';
import { serialize } from './http.js';
const valid = {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  JWT_SECRET: 'a'.repeat(48),
  JWT_REFRESH_SECRET: 'b'.repeat(48),
};
describe('API environment and response contract', () => {
  it('validates SMTP credentials, TLS settings and preview/production delivery modes', () => {
    const smtp = {
      ...valid,
      CHALLENGE_DELIVERY: 'smtp',
      SMTP_HOST: 'smtp.example.test',
      SMTP_USER: 'fixture',
      SMTP_PASSWORD: 'fixture-only',
      SMTP_FROM: 'noreply@example.test',
    };
    expect(validateEnvironment(smtp)).toMatchObject({
      SMTP_PORT: 587,
      SMTP_SECURE: false,
    });
    expect(validateEnvironment({ ...smtp, SMTP_PORT: 465 })).toMatchObject({
      SMTP_SECURE: true,
    });
    for (const invalid of [
      { SMTP_PASSWORD: '' },
      { SMTP_FROM: 'sender@example.test\r\nBcc: victim@example.test' },
      { SMTP_HOST: 'smtp://example.test' },
      { SMTP_PORT: 'bad' },
      { SMTP_SECURE: 'yes' },
      { PREVIEW_READ_ONLY: true },
    ])
      expect(() => validateEnvironment({ ...smtp, ...invalid })).toThrow();
    expect(
      validateEnvironment({
        ...valid,
        NODE_ENV: 'production',
        ALLOWED_ORIGINS: 'https://shop.example.test',
      }).CHALLENGE_DELIVERY,
    ).toBe('disabled');
    expect(() =>
      validateEnvironment({
        ...valid,
        NODE_ENV: 'production',
        ALLOWED_ORIGINS: 'https://shop.example.test',
        CHALLENGE_DELIVERY: 'memory',
      }),
    ).toThrow();
  });
  it('validates preview flags and refuses payment credentials in public preview', () => {
    expect(
      validateEnvironment({ ...valid, PREVIEW_READ_ONLY: 'true' })
        .PREVIEW_READ_ONLY,
    ).toBe(true);
    expect(() =>
      validateEnvironment({ ...valid, PREVIEW_READ_ONLY: 'yes' }),
    ).toThrow();
    expect(() =>
      validateEnvironment({
        ...valid,
        PREVIEW_READ_ONLY: 'true',
        STRIPE_SECRET_KEY: 'sk_test_fixture',
      }),
    ).toThrow();
  });
  it('requires verified TLS configuration when enabled', () => {
    expect(() =>
      validateEnvironment({ ...valid, DATABASE_TLS_REQUIRED: 'true' }),
    ).toThrow();
    expect(
      validateEnvironment({
        ...valid,
        DATABASE_TLS_REQUIRED: 'true',
        DATABASE_URL:
          valid.DATABASE_URL +
          '?sslmode=verify-full&sslrootcert=/run/certs/ca.pem',
      }).DATABASE_TLS_REQUIRED,
    ).toBe(true);
  });
  it('only trusts a configured single proxy hop and defaults to direct access', () => {
    expect(validateEnvironment(valid).TRUST_PROXY_HOPS).toBe(0);
    expect(
      validateEnvironment({ ...valid, TRUST_PROXY_HOPS: '1' }).TRUST_PROXY_HOPS,
    ).toBe(1);
    for (const value of ['true', '*', '1x', '-1', '2'])
      expect(() =>
        validateEnvironment({ ...valid, TRUST_PROXY_HOPS: value }),
      ).toThrow();
  });
  it('requires separate strong secrets and operational schema', () => {
    expect(() =>
      validateEnvironment({ ...valid, JWT_SECRET: 'short' }),
    ).toThrow();
    expect(() =>
      validateEnvironment({ ...valid, JWT_REFRESH_SECRET: valid.JWT_SECRET }),
    ).toThrow();
    expect(() =>
      validateEnvironment({ ...valid, DATABASE_SCHEMA: 'legacy_v1' }),
    ).toThrow();
  });
  it('accepts identity-only configuration without payment credentials', () => {
    expect(validateEnvironment(valid)).toMatchObject({
      PORT: 3001,
      JWT_EXPIRES_IN: 900,
      DATABASE_SCHEMA: 'public',
    });
    expect(() => validateEnvironment({ ...valid, PORT: 'wrong' })).toThrow();
    expect(() =>
      validateEnvironment({ ...valid, ALLOWED_ORIGINS: '*' }),
    ).toThrow();
  });
  it('preserves money beyond Number.MAX_SAFE_INTEGER and serializes timestamps', () => {
    expect(
      serialize({
        amount: 900719925474099312345n,
        at: new Date('2026-11-06T00:00:00Z'),
      }),
    ).toEqual({
      amount: '900719925474099312345',
      at: '2026-11-06T00:00:00.000Z',
    });
  });
  it('only permits Stripe test keys and an allowlisted storefront return origin', () => {
    expect(() =>
      validateEnvironment({ ...valid, STRIPE_SECRET_KEY: 'sk_live_fixture' }),
    ).toThrow();
    expect(() =>
      validateEnvironment({
        ...valid,
        STOREFRONT_URL: 'https://attacker.test',
      }),
    ).toThrow();
    expect(
      validateEnvironment({
        ...valid,
        STRIPE_SECRET_KEY: 'sk_test_fixture',
        STRIPE_WEBHOOK_SECRET: 'whsec_fixture',
      }),
    ).toMatchObject({ STOREFRONT_URL: 'http://localhost:3000' });
  });
});
