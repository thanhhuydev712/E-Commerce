import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureHttp } from './platform/http.js';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  configureHttp(app);
  app.enableShutdownHooks();
  await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'));
}
bootstrap().catch(() => {
  Logger.error(
    'API startup failed; check environment and database availability.',
  );
  process.exitCode = 1;
});
