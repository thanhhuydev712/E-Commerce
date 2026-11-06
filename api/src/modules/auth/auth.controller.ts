import { ApiData, MessageDto } from '../../platform/api-response.js';
import {
  AuthResponseDto,
  PrincipalDto,
  SessionRestoreDto,
} from './auth-response.dto.js';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  RegisterDto,
  LoginDto,
  EmailDto,
  ChallengeTokenDto,
  ResetPasswordDto,
} from './auth.dto.js';
import {
  AuthOriginGuard,
  clearRefreshCookie,
  refreshCookie,
  setRefreshCookie,
} from './cookie-security.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/get-user.decorator.js';
import type { Principal } from '../../common/interfaces/request-with-user.interface.js';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}
  private respond(
    response: Response,
    result: Awaited<ReturnType<AuthService['login']>>,
  ) {
    setRefreshCookie(
      response,
      result.refreshToken,
      this.config,
      result.expiresAt,
    );
    const { refreshToken: _token, expiresAt: _expiry, ...data } = result;
    return data;
  }
  @ApiData(AuthResponseDto, 201)
  @Post('register')
  @UseGuards(AuthOriginGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.respond(response, await this.auth.register(dto));
  }
  @ApiData(AuthResponseDto, 200)
  @Post('login')
  @HttpCode(200)
  @UseGuards(AuthOriginGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.respond(
      response,
      await this.auth.login(dto, request.headers['user-agent']),
    );
  }
  @ApiData(SessionRestoreDto, 200)
  @Post('session')
  @HttpCode(200)
  @ApiCookieAuth()
  @UseGuards(AuthOriginGuard)
  restore(@Req() request: Request) {
    return this.auth.restore(refreshCookie(request));
  }
  @ApiData(AuthResponseDto, 200)
  @Post('refresh')
  @HttpCode(200)
  @ApiCookieAuth()
  @UseGuards(AuthOriginGuard)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      return this.respond(
        response,
        await this.auth.refresh(refreshCookie(request)),
      );
    } catch (error) {
      clearRefreshCookie(response, this.config);
      throw error;
    }
  }
  @ApiData(MessageDto, 200)
  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(AuthOriginGuard, JwtAuthGuard)
  async logout(
    @CurrentUser() user: Principal,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.logout(user.id, user.sessionId);
    clearRefreshCookie(response, this.config);
    return result;
  }
  @ApiData(PrincipalDto)
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: Principal) {
    return user;
  }
  @ApiData(MessageDto, 202)
  @Post('forgot-password')
  @HttpCode(202)
  @UseGuards(AuthOriginGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgot(@Body() dto: EmailDto) {
    return this.auth.issueChallenge(dto.email, 'RESET_PASSWORD');
  }
  @ApiData(MessageDto, 200)
  @Post('reset-password')
  @HttpCode(200)
  @UseGuards(AuthOriginGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.consumeChallenge(
      dto.token,
      'RESET_PASSWORD',
      dto.newPassword,
    );
  }
  @ApiData(MessageDto, 202)
  @Post('verification/request')
  @HttpCode(202)
  @UseGuards(AuthOriginGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  requestVerification(@Body() dto: EmailDto) {
    return this.auth.issueChallenge(dto.email, 'VERIFY_EMAIL');
  }
  @ApiData(MessageDto, 200)
  @Post('verification/confirm')
  @HttpCode(200)
  @UseGuards(AuthOriginGuard)
  verify(@Body() dto: ChallengeTokenDto) {
    return this.auth.consumeChallenge(dto.token, 'VERIFY_EMAIL');
  }
}
