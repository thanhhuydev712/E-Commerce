import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service.js';
import { PricingController, CurrencyController } from './pricing.controller.js';
@Module({
  providers: [PricingService],
  controllers: [PricingController, CurrencyController],
})
export class PricingModule {}
