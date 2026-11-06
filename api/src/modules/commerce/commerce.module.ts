import { Module } from '@nestjs/common';
import { CommerceService } from './commerce.service.js';
import { OrderService } from './order.service.js';
import { CommerceController } from './commerce.controller.js';
import { AdminStoreController } from './admin.controller.js';
@Module({
  providers: [CommerceService, OrderService],
  controllers: [CommerceController, AdminStoreController],
})
export class CommerceModule {}
