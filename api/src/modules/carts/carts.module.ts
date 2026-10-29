import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module.js';

import { CartsController } from './carts.controller.js';
import { CartsService } from './carts.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
