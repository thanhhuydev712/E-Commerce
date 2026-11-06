import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { accountSelect, accountView } from '../accounts/account-view.js';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      issuer: 'ecommerce-api',
      audience: 'access',
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
  }
  async validate(payload: { sub?: string; sid?: string; type?: string }) {
    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
      payload.type !== 'access' ||
      !payload.sub ||
      !payload.sid ||
      !uuid.test(payload.sub) ||
      !uuid.test(payload.sid)
    )
      throw new UnauthorizedException();
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { user: { select: accountSelect } },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== 'ACTIVE'
    )
      throw new UnauthorizedException();
    const user = accountView(session.user);
    return {
      id: user.id,
      sessionId: session.id,
      email: user.email,
      roleCodes: user.roleCodes,
      permissions: user.permissions,
    };
  }
}
