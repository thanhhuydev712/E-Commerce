import { Module } from '@nestjs/common';
import { CommerceService } from './commerce.service.js';
import { OrderService } from './order.service.js';
import { CommerceController } from './commerce.controller.js';
import { AdminStoreController } from './admin.controller.js';
import { StripeGateway } from './stripe.gateway.js';
import { StripePaymentService } from './stripe-payment.service.js';
import { StripeController } from './stripe.controller.js';
@Module({
  providers: [
    CommerceService,
    OrderService,
    StripeGateway,
    StripePaymentService,
  ],
  controllers: [CommerceController, AdminStoreController, StripeController],
})
export class CommerceModule {}
