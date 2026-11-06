import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AuthOriginGuard } from './cookie-security.js';
import { ChallengeDelivery } from './challenge-delivery.js';
@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    AuthOriginGuard,
    ChallengeDelivery,
  ],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}
