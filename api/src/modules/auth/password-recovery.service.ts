import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
} from 'node:crypto';
import { Prisma } from '../../../generated/prisma-v2/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { lockUser } from '../../common/database.js';
import { tokenHash } from './auth.service.js';
import {
  ChallengeDelivery,
  type ChallengeMessage,
} from './challenge-delivery.js';

type Payload = {
  email: string;
  token?: string;
  challengeId?: string;
  expiresAt?: string;
};
const response = {
  message: 'If the account is eligible, instructions will be delivered',
};
const terminal = ['SENT', 'IGNORED', 'FAILED'];
const ttl = 30 * 60_000;
const lease = 5 * 60_000;

@Injectable()
export class PasswordRecoveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PasswordRecoveryService.name);
  private timer?: ReturnType<typeof setInterval>;
  private task?: Promise<void>;
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(ChallengeDelivery) private readonly delivery: ChallengeDelivery,
  ) {}
  private get enabled() {
    return this.config.get('PASSWORD_RECOVERY_ENABLED') === true;
  }
  private get key() {
    return createHash('sha256')
      .update('password-recovery-outbox:v1:')
      .update(this.config.getOrThrow<string>('JWT_REFRESH_SECRET'))
      .digest();
  }
  private encrypt(id: string, value: Payload) {
    const iv = randomBytes(12),
      cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(`auth-recovery-request:v1:${id}`));
    const data = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final(),
    ]);
    return [
      'v1',
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      data.toString('base64url'),
    ].join('.');
  }
  private decrypt(id: string, value: string): Payload {
    const parts = value.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1')
      throw new Error('Invalid recovery payload');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(parts[1], 'base64url'),
    );
    decipher.setAAD(Buffer.from(`auth-recovery-request:v1:${id}`));
    decipher.setAuthTag(Buffer.from(parts[2], 'base64url'));
    return JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(parts[3], 'base64url')),
        decipher.final(),
      ]).toString('utf8'),
    ) as Payload;
  }
  onModuleInit() {
    if (!this.enabled || this.config.get('NODE_ENV') === 'test') return;
    this.timer = setInterval(() => {
      void this.drain();
    }, 10_000);
    this.timer.unref();
    void this.drain();
  }
  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.task;
  }

  async request(email: string) {
    if (!this.enabled)
      throw new ServiceUnavailableException({
        code: 'PASSWORD_RECOVERY_DISABLED',
        message: 'Password recovery is disabled',
      });
    this.delivery.assertAvailable('RESET_PASSWORD');
    const normalized = email.trim().toLowerCase();
    const recipientHash = createHmac('sha256', this.key)
      .update(normalized)
      .digest('hex');
    // No account lookup or SMTP on the HTTP path. Every valid address follows
    // the same queue/cooldown path, independent of account existence/status.
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${recipientHash},20261121))`;
      const now = new Date();
      const recent = await tx.authRecoveryRequest.findFirst({
        where: {
          recipientHash,
          createdAt: { gt: new Date(now.getTime() - 60_000) },
        },
        select: { id: true },
      });
      if (recent) return;
      const daily = await tx.authRecoveryRequest.count({
        where: {
          recipientHash,
          createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60_000) },
        },
      });
      if (daily >= 5) return;
      const pending = await tx.authRecoveryRequest.count({
        where: { status: { in: ['PENDING', 'PROCESSING'] } },
      });
      if (pending >= 1000) return;
      const id = randomUUID();
      await tx.authRecoveryRequest.create({
        data: {
          id,
          recipientHash,
          payloadCiphertext: this.encrypt(id, { email: normalized }),
          expiresAt: new Date(now.getTime() + ttl),
        },
      });
    });
    return { ...response };
  }

  drain() {
    if (!this.enabled) return Promise.resolve();
    if (!this.task)
      this.task = this.processBatch()
        .catch(() => {
          // Database/provider errors can include recipients, credentials and payload.
          this.logger.warn(
            'Password recovery worker failed; pending work will retry',
          );
        })
        .finally(() => {
          this.task = undefined;
        });
    return this.task;
  }
  private async processBatch() {
    await this.prisma.authRecoveryRequest.deleteMany({
      where: {
        status: { in: terminal },
        createdAt: { lt: new Date(Date.now() - 48 * 60 * 60_000) },
      },
    });
    for (let index = 0; index < 10; index++) {
      const claimed = await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
          SELECT id FROM ${Prisma.raw(`"${this.prisma.schema}"."auth_recovery_requests"`)}
          WHERE (status='PENDING' AND available_at<=now())
            OR (status='PROCESSING' AND lease_until<=now())
          ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1
        `);
        if (!rows[0]) return null;
        return tx.authRecoveryRequest.update({
          where: { id: rows[0].id },
          data: {
            status: 'PROCESSING',
            leaseToken: randomUUID(),
            leaseUntil: new Date(Date.now() + lease),
            attempts: { increment: 1 },
          },
        });
      });
      if (!claimed) return;
      try {
        const message = await this.prepare(claimed.id, claimed.leaseToken!);
        if (!message) continue;
        // SMTP is outside database locks. A crash after acceptance may resend
        // the same token, which still expires and can only be consumed once.
        await this.delivery.send(message);
        await this.prisma.authRecoveryRequest.updateMany({
          where: {
            id: claimed.id,
            leaseToken: claimed.leaseToken,
            status: 'PROCESSING',
          },
          data: {
            status: 'SENT',
            payloadCiphertext: '',
            leaseUntil: null,
            leaseToken: null,
          },
        });
      } catch {
        const failed = claimed.attempts >= 5 || claimed.expiresAt <= new Date();
        await this.prisma.authRecoveryRequest.updateMany({
          where: {
            id: claimed.id,
            leaseToken: claimed.leaseToken,
            status: 'PROCESSING',
          },
          data: {
            status: failed ? 'FAILED' : 'PENDING',
            ...(failed ? { payloadCiphertext: '' } : {}),
            availableAt: new Date(
              Date.now() + Math.min(5, 2 ** (claimed.attempts - 1)) * 60_000,
            ),
            leaseUntil: null,
            leaseToken: null,
          },
        });
        this.logger.warn(
          'Password recovery delivery failed; check transport and worker health',
        );
      }
    }
  }

  private async prepare(
    id: string,
    leaseToken: string,
  ): Promise<ChallengeMessage | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM ${Prisma.raw(`"${this.prisma.schema}"."auth_recovery_requests"`)} WHERE id=${id}::uuid FOR UPDATE`,
      );
      const row = await tx.authRecoveryRequest.findUnique({ where: { id } });
      if (!row || row.leaseToken !== leaseToken || row.status !== 'PROCESSING')
        return null;
      const ignore = async () => {
        await tx.authRecoveryRequest.update({
          where: { id },
          data: {
            status: 'IGNORED',
            payloadCiphertext: '',
            leaseToken: null,
            leaseUntil: null,
          },
        });
        return null;
      };
      if (row.expiresAt <= new Date()) return ignore();
      const payload = this.decrypt(id, row.payloadCiphertext);
      const allowed = this.config
        .getOrThrow<string>('PASSWORD_RECOVERY_ALLOWED_EMAILS')
        .split(',');
      if (!allowed.includes(payload.email)) return ignore();
      const user = await tx.user.findUnique({
        where: { email: payload.email },
      });
      if (!user || user.status !== 'ACTIVE') return ignore();
      await lockUser(tx, this.prisma.schema, user.id);
      const current = await tx.user.findUnique({ where: { id: user.id } });
      if (
        !current ||
        current.status !== 'ACTIVE' ||
        current.email !== payload.email
      )
        return ignore();
      if (payload.token && payload.challengeId) {
        const challenge = await tx.authChallenge.findUnique({
          where: { id: payload.challengeId },
        });
        if (
          !challenge ||
          challenge.userId !== user.id ||
          challenge.purpose !== 'RESET_PASSWORD' ||
          challenge.consumedAt ||
          challenge.expiresAt <= new Date() ||
          challenge.tokenHash !== tokenHash(payload.token)
        )
          return ignore();
        return {
          email: payload.email,
          token: payload.token,
          purpose: 'RESET_PASSWORD',
          expiresAt: challenge.expiresAt,
        };
      }
      const token = randomBytes(32).toString('base64url'),
        challengeId = randomUUID();
      await tx.authChallenge.updateMany({
        where: { userId: user.id, purpose: 'RESET_PASSWORD', consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.authChallenge.create({
        data: {
          id: challengeId,
          userId: user.id,
          purpose: 'RESET_PASSWORD',
          tokenHash: tokenHash(token),
          expiresAt: row.expiresAt,
        },
      });
      await tx.authRecoveryRequest.update({
        where: { id },
        data: {
          payloadCiphertext: this.encrypt(id, {
            ...payload,
            token,
            challengeId,
          }),
        },
      });
      return {
        email: payload.email,
        token,
        purpose: 'RESET_PASSWORD',
        expiresAt: row.expiresAt,
      };
    });
  }
}
