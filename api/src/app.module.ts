import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnvironment } from './platform/environment.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthController } from './platform/health.controller.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { AccessModule } from './modules/access/access.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { PricingModule } from './modules/pricing/pricing.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { StorefrontModule } from './modules/storefront/storefront.module.js';
import { CommerceModule } from './modules/commerce/commerce.module.js';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AccessModule,
    AuthModule,
    AccountsModule,
    CatalogModule,
    PricingModule,
    InventoryModule,
    MediaModule,
    StorefrontModule,
    CommerceModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
