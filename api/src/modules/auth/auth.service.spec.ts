import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService, tokenHash } from './auth.service.js';
import { ChallengeDelivery } from './challenge-delivery.js';
import { PrismaService } from '../../prisma/prisma.service.js';

vi.mock('bcrypt', () => ({ hash: vi.fn(async () => 'bcrypt-hash') }));

function fixture() {
  const user = {
    id: 'user-id',
    email: 'customer@example.test',
    status: 'ACTIVE',
    emailVerifiedAt: null,
  };
  const challenge = {
    id: 'challenge-id',
    userId: user.id,
    purpose: 'RESET_PASSWORD',
    consumedAt: null as Date | null,
    expiresAt: new Date(Date.now() + 60_000),
    user,
  };
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    user: { findUnique: vi.fn().mockResolvedValue(user), update: vi.fn() },
    authChallenge: {
      findUnique: vi.fn().mockImplementation(async () => ({ ...challenge })),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn().mockImplementation(async () => {
        challenge.consumedAt = new Date();
      }),
    },
    authSession: { updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  const db = {
    ...tx,
    schema: 'public',
    $transaction: vi.fn(async (callback: (db: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const delivery = { assertAvailable: vi.fn(), send: vi.fn() };
  const service = new AuthService(
    db as unknown as PrismaService,
    new JwtService(),
    new ConfigService(),
    delivery as unknown as ChallengeDelivery,
  );
  return { user, challenge, tx, db, delivery, service };
}
describe('Password recovery service', () => {
  it('rejects reset tokens outside the controlled account allowlist', async () => {
    const f = fixture();
    const service = new AuthService(
      f.db as unknown as PrismaService,
      new JwtService(),
      new ConfigService({
        PASSWORD_RECOVERY_ENABLED: true,
        PASSWORD_RECOVERY_ALLOWED_EMAILS: 'another@example.test',
      }),
      f.delivery as unknown as ChallengeDelivery,
    );
    await expect(
      service.consumeChallenge('token', 'RESET_PASSWORD', 'NewPassword-2026!'),
    ).rejects.toThrow('invalid or expired');
    expect(f.tx.user.update).not.toHaveBeenCalled();
    expect(f.tx.authSession.updateMany).not.toHaveBeenCalled();
  });
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  it('normalizes email and persists only a hash of a random, expiring token', async () => {
    const { service, delivery, tx } = fixture();
    const before = Date.now();
    const response = await service.issueChallenge(
      ' CUSTOMER@EXAMPLE.TEST ',
      'RESET_PASSWORD',
    );
    const sent = delivery.send.mock.calls[0][0];
    expect(sent.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tx.authChallenge.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        purpose: 'RESET_PASSWORD',
        tokenHash: tokenHash(sent.token),
        expiresAt: sent.expiresAt,
      },
    });
    expect(sent.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 30 * 60_000,
    );
    expect(tx.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'customer@example.test' },
    });
    expect(JSON.stringify(response)).not.toContain(sent.token);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });
  it('returns the same message for missing, locked, throttled and SMTP-failure cases', async () => {
    const success = fixture();
    const expected = await success.service.issueChallenge(
      success.user.email,
      'RESET_PASSWORD',
    );
    for (const kind of ['missing', 'locked', 'recent', 'smtp']) {
      const current = fixture();
      if (kind === 'missing')
        current.tx.user.findUnique.mockResolvedValue(null);
      if (kind === 'locked') current.user.status = 'LOCKED';
      if (kind === 'recent')
        current.tx.authChallenge.findFirst.mockResolvedValue({ id: 'recent' });
      if (kind === 'smtp') {
        current.delivery.send.mockRejectedValue(
          new Error('sensitive provider error'),
        );
        vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
      }
      expect(
        await current.service.issueChallenge(
          current.user.email,
          'RESET_PASSWORD',
        ),
      ).toEqual(expected);
      if (kind !== 'smtp') {
        expect(current.delivery.send).not.toHaveBeenCalled();
        expect(current.tx.authChallenge.create).not.toHaveBeenCalled();
      }
    }
  });
  it('consumes once, changes password and revokes all sessions in one locked transaction', async () => {
    const { service, tx, db } = fixture();
    await service.consumeChallenge(
      'token',
      'RESET_PASSWORD',
      'NewPassword-2026!',
    );
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        passwordHash: 'bcrypt-hash',
        passwordChangedAt: expect.any(Date),
      },
    });
    expect(tx.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', revokedAt: null },
      data: { revokedAt: expect.any(Date), revokeReason: 'PASSWORD_RESET' },
    });
    expect(tx.authChallenge.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', purpose: 'RESET_PASSWORD', consumedAt: null },
      data: { consumedAt: expect.any(Date) },
    });
    await expect(
      service.consumeChallenge(
        'token',
        'RESET_PASSWORD',
        'OtherPassword-2026!',
      ),
    ).rejects.toThrow('invalid or expired');
    expect(tx.user.update).toHaveBeenCalledTimes(1);
    expect(tx.authSession.updateMany).toHaveBeenCalledTimes(1);
  });
  it.each(['expired', 'used', 'wrong-purpose', 'locked', 'missing'])(
    'rejects a %s challenge before modifying credentials',
    async (kind) => {
      const { service, challenge, user, tx } = fixture();
      if (kind === 'expired') challenge.expiresAt = new Date(0);
      if (kind === 'used') challenge.consumedAt = new Date();
      if (kind === 'wrong-purpose') challenge.purpose = 'VERIFY_EMAIL';
      if (kind === 'locked') user.status = 'LOCKED';
      if (kind === 'missing')
        tx.authChallenge.findUnique.mockResolvedValue(null);
      await expect(
        service.consumeChallenge(
          'token',
          'RESET_PASSWORD',
          'NewPassword-2026!',
        ),
      ).rejects.toThrow('invalid or expired');
      expect(tx.user.update).not.toHaveBeenCalled();
      expect(tx.authSession.updateMany).not.toHaveBeenCalled();
    },
  );
});
