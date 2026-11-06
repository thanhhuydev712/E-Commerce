import { describe, it, expect } from 'vitest';
import { validateEnvironment } from './environment.js';
import { serialize } from './http.js';
const valid = {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  JWT_SECRET: 'a'.repeat(48),
  JWT_REFRESH_SECRET: 'b'.repeat(48),
};
describe('API environment and response contract', () => {
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
});
