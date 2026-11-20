import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordRecoveryService } from './password-recovery.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  ChallengeDelivery,
  type ChallengeMessage,
} from './challenge-delivery.js';
import { tokenHash } from './auth.service.js';

type Row = {
  id: string;
  recipientHash: string;
  payloadCiphertext: string;
  status: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
  availableAt: Date;
  leaseUntil: Date | null;
  leaseToken: string | null;
};
const settings = {
  NODE_ENV: 'test',
  PREVIEW_READ_ONLY: true,
  INTERACTIVE_DEMO: true,
  PASSWORD_RECOVERY_ENABLED: true,
  PASSWORD_RECOVERY_ALLOWED_EMAILS: 'customer@example.test',
  JWT_REFRESH_SECRET: 'fixture-refresh-secret-with-sufficient-entropy',
};
function fixture() {
  const rows: Row[] = [];
  const challenges = new Map<
    string,
    {
      id: string;
      userId: string;
      purpose: string;
      tokenHash: string;
      expiresAt: Date;
      consumedAt: Date | null;
    }
  >();
  const user = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'customer@example.test',
    status: 'ACTIVE',
  };
  const apply = (row: Row, data: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(data)) {
      if (key === 'attempts')
        row.attempts += (value as { increment: number }).increment;
      else Object.assign(row, { [key]: value });
    }
    return { ...row };
  };
  const outbox = {
    findFirst: vi.fn(
      async ({ where }) =>
        rows.find(
          (row) =>
            row.recipientHash === where.recipientHash &&
            row.createdAt > where.createdAt.gt,
        ) ?? null,
    ),
    count: vi.fn(
      async ({ where }) =>
        rows.filter((row) =>
          where.recipientHash
            ? row.recipientHash === where.recipientHash &&
              row.createdAt > where.createdAt.gt
            : where.status.in.includes(row.status),
        ).length,
    ),
    create: vi.fn(async ({ data }) => {
      const row = {
        status: 'PENDING',
        attempts: 0,
        createdAt: new Date(),
        availableAt: new Date(),
        leaseToken: null,
        leaseUntil: null,
        ...data,
      } as Row;
      rows.push(row);
      return { ...row };
    }),
    findUnique: vi.fn(async ({ where }) => {
      const row = rows.find((row) => row.id === where.id);
      return row ? { ...row } : null;
    }),
    update: vi.fn(async ({ where, data }) =>
      apply(
        rows.find((row) => row.id === where.id)!,
        data,
      ),
    ),
    updateMany: vi.fn(async ({ where, data }) => {
      const matching = rows.filter(
        (row) =>
          row.id === where.id &&
          (where.leaseToken === undefined ||
            row.leaseToken === where.leaseToken) &&
          (!where.status || row.status === where.status),
      );
      matching.forEach((row) => apply(row, data));
      return { count: matching.length };
    }),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  };
  const tx = {
    $executeRaw: vi.fn(async () => 1),
    $queryRaw: vi.fn(async (statement) =>
      statement.sql.includes('SKIP LOCKED')
        ? rows
            .filter(
              (row) =>
                (row.status === 'PENDING' && row.availableAt <= new Date()) ||
                (row.status === 'PROCESSING' &&
                  row.leaseUntil &&
                  row.leaseUntil <= new Date()),
            )
            .slice(0, 1)
            .map(({ id }) => ({ id }))
        : [],
    ),
    authRecoveryRequest: outbox,
    user: { findUnique: vi.fn(async () => ({ ...user })) },
    authChallenge: {
      create: vi.fn(async ({ data }) => {
        challenges.set(data.id, { ...data, consumedAt: null });
        return data;
      }),
      updateMany: vi.fn(async () => {
        for (const challenge of challenges.values())
          challenge.consumedAt = new Date();
        return { count: challenges.size };
      }),
      findUnique: vi.fn(async ({ where }) => challenges.get(where.id) ?? null),
    },
  };
  const db = {
    ...tx,
    schema: 'public',
    $transaction: vi.fn(async (callback: (db: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const delivery = {
    assertAvailable: vi.fn(),
    send: vi.fn(async (_message: ChallengeMessage) => {}),
  };
  const config = new ConfigService({ ...settings });
  const restart = () =>
    new PasswordRecoveryService(
      db as unknown as PrismaService,
      config,
      delivery as unknown as ChallengeDelivery,
    );
  return {
    rows,
    challenges,
    user,
    tx,
    db,
    outbox,
    delivery,
    config,
    service: restart(),
    restart,
  };
}
describe('Durable password recovery', () => {
  beforeEach(() =>
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {}),
  );
  it('accepts existing and unknown emails through the same durable path without user lookup or SMTP', async () => {
    const f = fixture();
    f.delivery.send.mockImplementation(() => new Promise(() => {}));
    const known = await f.service.request(' CUSTOMER@EXAMPLE.TEST ');
    expect(await f.service.request('unknown@example.test')).toEqual(known);
    expect(f.rows).toHaveLength(2);
    for (const row of f.rows) {
      expect(row.recipientHash).toMatch(/^[a-f0-9]{64}$/);
      expect(row.payloadCiphertext).toMatch(/^v1\./);
      expect(row.payloadCiphertext).not.toContain('@');
      expect(JSON.stringify(known)).not.toContain(row.recipientHash);
    }
    expect(f.tx.user.findUnique).not.toHaveBeenCalled();
    expect(f.delivery.send).not.toHaveBeenCalled();
  });
  it('applies address cooldown and daily cap independently of account existence', async () => {
    const f = fixture();
    await f.service.request('unknown@example.test');
    await f.service.request(' UNKNOWN@EXAMPLE.TEST ');
    expect(f.rows).toHaveLength(1);
    for (let i = 0; i < 6; i++) {
      f.rows.forEach((row) => {
        row.createdAt = new Date(Date.now() - 120_000);
      });
      await f.service.request('unknown@example.test');
    }
    expect(f.rows).toHaveLength(5);
    expect(f.tx.user.findUnique).not.toHaveBeenCalled();
  });
  it('bounds pending work and refuses disabled recovery', async () => {
    const f = fixture();
    f.outbox.count.mockResolvedValue(1000);
    await f.service.request(f.user.email);
    expect(f.rows).toHaveLength(0);
    f.config.set('PASSWORD_RECOVERY_ENABLED', false);
    await expect(f.service.request(f.user.email)).rejects.toThrow('disabled');
  });
  it('survives restart and only stores ciphertext plus a hash of the single-use token', async () => {
    const f = fixture();
    await f.service.request(f.user.email);
    f.delivery.send.mockImplementation(async (message) => {
      expect(f.rows[0].payloadCiphertext).not.toContain(message.token);
      expect(f.rows[0].payloadCiphertext).not.toContain(message.email);
      expect([...f.challenges.values()][0].tokenHash).toBe(
        tokenHash(message.token),
      );
      expect(message.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });
    await f.restart().drain();
    expect(f.delivery.send).toHaveBeenCalledTimes(1);
    expect(f.rows[0]).toMatchObject({
      status: 'SENT',
      payloadCiphertext: '',
      leaseToken: null,
    });
  });
  it('retries with the same token/challenge and only logs a generic warning', async () => {
    const warnings = vi.spyOn(Logger.prototype, 'warn');
    const f = fixture();
    await f.service.request(f.user.email);
    f.delivery.send.mockRejectedValueOnce(
      new Error('sensitive provider payload'),
    );
    await f.service.drain();
    expect(f.rows[0]).toMatchObject({ status: 'PENDING', attempts: 1 });
    const first = f.delivery.send.mock.calls[0][0];
    expect(f.rows[0].payloadCiphertext).not.toContain(first.token);
    f.rows[0].availableAt = new Date(0);
    await f.restart().drain();
    expect(f.delivery.send.mock.calls[1][0]).toEqual(first);
    expect(f.tx.authChallenge.create).toHaveBeenCalledTimes(1);
    expect(f.rows[0].status).toBe('SENT');
    expect(warnings.mock.calls.flat().join(' ')).not.toContain('sensitive');
  });
  it.each(['not-allowed', 'missing', 'locked', 'changed-after-lock'])(
    'does not send for %s recipients',
    async (kind) => {
      const f = fixture();
      const email =
        kind === 'not-allowed' ? 'other@example.test' : f.user.email;
      if (kind === 'missing')
        f.tx.user.findUnique.mockResolvedValue(null as never);
      if (kind === 'locked') f.user.status = 'LOCKED';
      if (kind === 'changed-after-lock')
        f.tx.user.findUnique
          .mockResolvedValueOnce(f.user)
          .mockResolvedValue({ ...f.user, status: 'LOCKED' });
      await f.service.request(email);
      await f.service.drain();
      expect(f.rows[0]).toMatchObject({
        status: 'IGNORED',
        payloadCiphertext: '',
      });
      expect(f.delivery.send).not.toHaveBeenCalled();
    },
  );
  it('does not resend a token consumed after a failed transport attempt', async () => {
    const f = fixture();
    await f.service.request(f.user.email);
    f.delivery.send.mockRejectedValueOnce(new Error('failed'));
    await f.service.drain();
    for (const challenge of f.challenges.values())
      challenge.consumedAt = new Date();
    f.rows[0].availableAt = new Date(0);
    await f.service.drain();
    expect(f.delivery.send).toHaveBeenCalledTimes(1);
    expect(f.rows[0].status).toBe('IGNORED');
  });
  it('does not send expired/corrupt payloads and stops after five attempts', async () => {
    for (const kind of ['expired', 'corrupt', 'exhausted']) {
      const f = fixture();
      await f.service.request(f.user.email);
      if (kind === 'expired') f.rows[0].expiresAt = new Date(0);
      if (kind === 'corrupt') f.rows[0].payloadCiphertext = 'v1.invalid';
      if (kind === 'exhausted') {
        f.rows[0].attempts = 4;
        f.delivery.send.mockRejectedValue(new Error('failed'));
      }
      await f.service.drain();
      if (kind === 'exhausted')
        expect(f.rows[0]).toMatchObject({
          status: 'FAILED',
          payloadCiphertext: '',
        });
      else expect(f.delivery.send).not.toHaveBeenCalled();
    }
  });
  it('leases work so another worker cannot send it concurrently', async () => {
    const f = fixture();
    await f.service.request(f.user.email);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    f.delivery.send.mockReturnValue(pending);
    const first = f.service.drain();
    await vi.waitFor(() => expect(f.delivery.send).toHaveBeenCalledTimes(1));
    await f.restart().drain();
    expect(f.delivery.send).toHaveBeenCalledTimes(1);
    release();
    await first;
    expect(f.rows[0].status).toBe('SENT');
  });
  it('fences a stale sender from acknowledging another lease', async () => {
    const f = fixture();
    await f.service.request(f.user.email);
    f.delivery.send.mockImplementation(async () => {
      f.rows[0].leaseToken = 'new-lease';
    });
    await f.service.drain();
    expect(f.rows[0]).toMatchObject({
      status: 'PROCESSING',
      leaseToken: 'new-lease',
    });
    expect(f.rows[0].payloadCiphertext).not.toBe('');
  });
});
