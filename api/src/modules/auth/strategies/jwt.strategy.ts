// Jwt strategy for auth requests

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Stratehgy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}
}
