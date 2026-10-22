// Refresh token strategy

import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  // Validate refresh token
  async validate(req: Request, payload: { sub: string; email: string }) {
    console.log('RefreshTokenStrategy.validate called');
    console.log('Payload: ', {
      sub: payload.sub,
      email: payload.email,
    });

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('No authorization header found');
      throw new UnauthorizedException('Refrsh token not provided');
    }

    const refreshToken = authHeader.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token is empty after axtraction',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },

      select: {
        id: true,
        email: true,
        role: true,
        refreshToken: true,
      },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh does not match');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
