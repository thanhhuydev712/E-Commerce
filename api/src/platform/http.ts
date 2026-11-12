import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  INestApplication,
  Injectable,
  NestInterceptor,
  CallHandler,
  ExecutionContext,
  Logger,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { map } from 'rxjs';
export function serialize(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serialize(item)]),
    );
  return value;
}
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context
      .switchToHttp()
      .getRequest<Request & { requestId: string }>();
    return next.handle().pipe(
      map((value) => ({
        data: serialize(value),
        meta: { requestId: req.requestId },
      })),
    );
  }
}
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request & { requestId: string }>();
    const res = http.getResponse<Response>();
    const dbCode =
      exception && typeof exception === 'object' && 'code' in exception
        ? String(exception.code)
        : undefined;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : dbCode === 'P2002'
          ? 409
          : dbCode === 'P2025'
            ? 404
            : 500;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body =
      typeof raw === 'object' && raw ? (raw as Record<string, unknown>) : {};
    const labels: Record<number, string> = {
      400: 'INVALID_REQUEST',
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      413: 'PAYLOAD_TOO_LARGE',
      415: 'UNSUPPORTED_MEDIA_TYPE',
      429: 'RATE_LIMITED',
      503: 'UNAVAILABLE',
    };
    if (status >= 500)
      Logger.error(
        JSON.stringify({
          event: 'request_failed',
          requestId: req.requestId,
          code: dbCode ?? 'INTERNAL_ERROR',
        }),
      );
    res.status(status).json({
      error: {
        code:
          typeof body.code === 'string'
            ? body.code
            : (labels[status] ?? 'INTERNAL_ERROR'),
        message:
          status === 500
            ? 'Internal server error'
            : typeof body.message === 'string'
              ? body.message
              : typeof raw === 'string'
                ? raw
                : (labels[status] ?? 'Request failed'),
        ...(Array.isArray(body.details) ? { details: body.details } : {}),
      },
      meta: { requestId: req.requestId },
    });
  }
}
export function configureHttp(app: INestApplication) {
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api/v1');
  app.use(
    (
      req: Request & { requestId: string },
      res: Response,
      next: NextFunction,
    ) => {
      req.requestId = randomUUID();
      res.setHeader('X-Request-Id', req.requestId);
      res.setHeader('Cache-Control', 'no-store');
      next();
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: errors.map((error) => ({
            field: error.property,
            messages: Object.values(error.constraints ?? {}),
          })),
        }),
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGINS').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Idempotency-Key',
    ],
    exposedHeaders: ['X-Request-Id'],
  });
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('E-Commerce API')
      .setVersion('1.0')
      .setDescription(
        'Identity, catalog and commerce v2, including COD and Stripe Checkout sandbox with signed webhooks. JSON: { data, meta }; errors: { error, meta }. Money: integer VND strings. Auth POST requires an allowed Origin. Refresh token: HttpOnly cookie.',
      )
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);
}
