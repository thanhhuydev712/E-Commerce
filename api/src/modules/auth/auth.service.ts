import {
  Inject,
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { lockUser, type DbTransaction } from '../../common/database.js';
import { accountSelect, accountView } from '../accounts/account-view.js';
import {
  ChallengeDelivery,
  type ChallengeMessage,
} from './challenge-delivery.js';
import type { RegisterDto, LoginDto } from './auth.dto.js';

export const tokenHash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
function hashesMatch(left: string, right: string) {
  const a = Buffer.from(left),
    b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
interface RefreshPayload {
  sub: string;
  sid: string;
  fid: string;
  type: string;
  iat: number;
}
const ISSUER = 'ecommerce-api';
@Injectable()
export class AuthService {
  private readonly dummyPassword = bcrypt.hash(
    randomBytes(32).toString('hex'),
    12,
  );
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(ChallengeDelivery) private readonly delivery: ChallengeDelivery,
  ) {}

  private accessToken(userId: string, sessionId: string, issuedAt?: number) {
    return this.jwt.signAsync(
      {
        sub: userId,
        sid: sessionId,
        type: 'access',
        ...(issuedAt === undefined ? {} : { iat: issuedAt }),
      },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.getOrThrow<number>('JWT_EXPIRES_IN'),
        issuer: ISSUER,
        audience: 'access',
      },
    );
  }
  private refreshToken(
    userId: string,
    sessionId: string,
    familyId: string,
    expiresAt: Date,
  ) {
    return this.jwt.signAsync(
      {
        sub: userId,
        sid: sessionId,
        fid: familyId,
        type: 'refresh',
        jti: randomUUID(),
      },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: Math.max(
          1,
          Math.floor((expiresAt.getTime() - Date.now()) / 1000),
        ),
        issuer: ISSUER,
        audience: 'refresh',
      },
    );
  }
  private async createSession(
    tx: DbTransaction,
    userId: string,
    deviceLabel?: string,
    userAgent?: string,
  ) {
    const id = randomUUID(),
      familyId = randomUUID();
    const expiresAt = new Date(
      Date.now() + this.config.getOrThrow<number>('REFRESH_TTL_SECONDS') * 1000,
    );
    const refreshToken = await this.refreshToken(
      userId,
      id,
      familyId,
      expiresAt,
    );
    await tx.authSession.create({
      data: {
        id,
        userId,
        familyId,
        tokenHash: tokenHash(refreshToken),
        expiresAt,
        deviceLabel: deviceLabel ?? undefined,
        userAgent: userAgent?.slice(0, 512),
      },
    });
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: accountSelect,
    });
    return {
      accessToken: await this.accessToken(userId, id),
      expiresIn: this.config.getOrThrow<number>('JWT_EXPIRES_IN'),
      user: accountView(user),
      refreshToken,
      expiresAt,
    };
  }
  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { code: 'CUSTOMER' } });
      if (!role)
        throw new ServiceUnavailableException(
          'Customer role is not configured',
        );
      const user = await tx.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: 'ACTIVE',
          userRolesByUser: { create: { roleId: role.id } },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actorType: 'USER',
          action: 'ACCOUNT_REGISTER',
          entityType: 'USER',
          entityId: user.id,
        },
      });
      return this.createSession(tx, user.id);
    });
  }
  async login(dto: LoginDto, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    const valid = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? (await this.dummyPassword),
    );
    if (!valid || !user || user.status !== 'ACTIVE')
      throw new UnauthorizedException('Invalid credentials');
    return this.prisma.$transaction(async (tx) => {
      await lockUser(tx, this.prisma.schema, user.id);
      const current = await tx.user.findUnique({ where: { id: user.id } });
      if (
        !current ||
        current.status !== 'ACTIVE' ||
        current.passwordHash !== user.passwordHash
      )
        throw new UnauthorizedException('Invalid credentials');
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actorType: 'USER',
          action: 'SESSION_LOGIN',
          entityType: 'USER',
          entityId: user.id,
        },
      });
      return this.createSession(tx, user.id, dto.deviceLabel, userAgent);
    });
  }
  private async parseRefresh(token: string) {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        issuer: ISSUER,
        audience: 'refresh',
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
      payload.type !== 'refresh' ||
      !Number.isInteger(payload.iat) ||
      ![payload.sub, payload.sid, payload.fid].every(
        (value) => typeof value === 'string' && uuid.test(value),
      )
    )
      throw new UnauthorizedException('Invalid refresh token');
    return payload;
  }
  // Valid page bootstrap is read-only: navigation must not consume the cookie.
  // Keep the original access window; restoring a page never extends JWT lifetime.
  async restore(token: string) {
    const payload = await this.parseRefresh(token);
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { user: { select: { status: true } } },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.familyId !== payload.fid ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== 'ACTIVE'
    )
      throw new UnauthorizedException(
        'Session is invalid or no longer current',
      );
    if (!hashesMatch(tokenHash(token), session.tokenHash)) {
      // Reuse the locked revocation path; stale credentials must not bypass it.
      await this.refresh(token);
      throw new UnauthorizedException('Session is no longer current');
    }
    const expiresIn =
      payload.iat +
      this.config.getOrThrow<number>('JWT_EXPIRES_IN') -
      Math.floor(Date.now() / 1000);
    if (expiresIn <= 0) return { requiresRefresh: true };
    return {
      requiresRefresh: false,
      accessToken: await this.accessToken(
        session.userId,
        session.id,
        payload.iat,
      ),
      expiresIn,
    };
  }
  async refresh(token: string) {
    const payload = await this.parseRefresh(token);
    const result = await this.prisma.$transaction(async (tx) => {
      await lockUser(tx, this.prisma.schema, payload.sub);
      const session = await tx.authSession.findUnique({
        where: { id: payload.sid },
        include: { user: { select: accountSelect } },
      });
      if (
        !session ||
        session.userId !== payload.sub ||
        session.familyId !== payload.fid ||
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        session.user.status !== 'ACTIVE'
      )
        return null;
      const hash = tokenHash(token);
      if (!hashesMatch(hash, session.tokenHash)) {
        // The signature proves this was a server-issued token for this family, including older rotations.
        await tx.authSession.updateMany({
          where: { familyId: session.familyId, revokedAt: null },
          data: { revokedAt: new Date(), revokeReason: 'TOKEN_REUSE' },
        });
        await tx.auditLog.create({
          data: {
            actorId: session.userId,
            actorType: 'USER',
            action: 'REFRESH_REUSE_REVOKE',
            entityType: 'SESSION',
            entityId: session.id,
          },
        });
        return null; // Commit revocation BEFORE returning the authentication error.
      }
      const refreshToken = await this.refreshToken(
        session.userId,
        session.id,
        session.familyId,
        session.expiresAt,
      );
      await tx.authSession.update({
        where: { id: session.id },
        data: {
          previousTokenHash: session.tokenHash,
          tokenHash: tokenHash(refreshToken),
          rotatedAt: new Date(),
        },
      });
      return {
        accessToken: await this.accessToken(session.userId, session.id),
        expiresIn: this.config.getOrThrow<number>('JWT_EXPIRES_IN'),
        user: accountView(session.user),
        refreshToken,
        expiresAt: session.expiresAt,
      };
    });
    if (!result)
      throw new UnauthorizedException('Refresh session is invalid or revoked');
    return result;
  }
  async logout(userId: string, sessionId: string) {
    await this.prisma.$transaction(async (tx) => {
      await lockUser(tx, this.prisma.schema, userId);
      await tx.authSession.updateMany({
        where: { id: sessionId, userId, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'LOGOUT' },
      });
    });
    return { message: 'Logged out' };
  }
  async issueChallenge(email: string, purpose: ChallengeMessage['purpose']) {
    this.delivery.assertAvailable();
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 60_000);
    const message = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (!user || user.status !== 'ACTIVE') return null;
      await lockUser(tx, this.prisma.schema, user.id);
      const current = await tx.user.findUnique({ where: { id: user.id } });
      if (
        !current ||
        current.status !== 'ACTIVE' ||
        (purpose === 'VERIFY_EMAIL' && current.emailVerifiedAt)
      )
        return null;
      await tx.authChallenge.updateMany({
        where: { userId: user.id, purpose, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.authChallenge.create({
        data: {
          userId: user.id,
          purpose,
          tokenHash: tokenHash(token),
          expiresAt,
        },
      });
      return { email: current.email, token, purpose, expiresAt };
    });
    if (message) await this.delivery.send(message);
    return {
      message: 'If the account is eligible, instructions will be delivered',
    };
  }
  async consumeChallenge(
    token: string,
    purpose: ChallengeMessage['purpose'],
    newPassword?: string,
  ) {
    const hash = tokenHash(token);
    const challenge = await this.prisma.authChallenge.findUnique({
      where: { tokenHash: hash },
    });
    if (!challenge)
      throw new BadRequestException('Challenge is invalid or expired');
    const passwordHash =
      newPassword === undefined
        ? undefined
        : await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction(async (tx) => {
      await lockUser(tx, this.prisma.schema, challenge.userId);
      const current = await tx.authChallenge.findUnique({
        where: { id: challenge.id },
        include: { user: true },
      });
      if (
        !current ||
        current.purpose !== purpose ||
        current.consumedAt ||
        current.expiresAt <= new Date() ||
        current.user.status !== 'ACTIVE'
      )
        throw new BadRequestException('Challenge is invalid or expired');
      await tx.authChallenge.update({
        where: { id: current.id },
        data: { consumedAt: new Date() },
      });
      if (purpose === 'RESET_PASSWORD') {
        if (!passwordHash)
          throw new BadRequestException('New password is required');
        await tx.user.update({
          where: { id: current.userId },
          data: { passwordHash, passwordChangedAt: new Date() },
        });
        await tx.authSession.updateMany({
          where: { userId: current.userId, revokedAt: null },
          data: { revokedAt: new Date(), revokeReason: 'PASSWORD_RESET' },
        });
        await tx.authChallenge.updateMany({
          where: { userId: current.userId, purpose, consumedAt: null },
          data: { consumedAt: new Date() },
        });
      } else
        await tx.user.update({
          where: { id: current.userId },
          data: { emailVerifiedAt: new Date() },
        });
      await tx.auditLog.create({
        data: {
          actorId: current.userId,
          actorType: 'USER',
          action: purpose,
          entityType: 'USER',
          entityId: current.userId,
        },
      });
    });
    return {
      message:
        purpose === 'RESET_PASSWORD'
          ? 'Password reset; sign in again'
          : 'Email verified',
    };
  }
}
