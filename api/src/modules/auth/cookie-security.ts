import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
export const REFRESH_COOKIE = 'refresh_token';
@Injectable()
export class AuthOriginGuard implements CanActivate {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.headers.origin;
    if (
      !origin ||
      !this.config
        .getOrThrow<string>('ALLOWED_ORIGINS')
        .split(',')
        .includes(origin)
    )
      throw new ForbiddenException('An allowed Origin header is required');
    return true;
  }
}
export function refreshCookie(request: Request) {
  const pairs = (request.headers.cookie ?? '')
    .split(';')
    .map((value) => value.trim())
    .filter((value) => value.startsWith(`${REFRESH_COOKIE}=`));
  if (pairs.length !== 1)
    throw new UnauthorizedException('Refresh cookie is required');
  try {
    return decodeURIComponent(pairs[0].slice(REFRESH_COOKIE.length + 1));
  } catch {
    throw new UnauthorizedException('Invalid refresh cookie');
  }
}
export function setRefreshCookie(
  response: Response,
  token: string,
  config: ConfigService,
  expiresAt: Date,
) {
  response.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.get('NODE_ENV') === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    expires: expiresAt,
  });
}
export function clearRefreshCookie(response: Response, config: ConfigService) {
  response.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: config.get('NODE_ENV') === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  });
}
