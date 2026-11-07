import { Controller, Headers, HttpCode, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiHeader, ApiProperty, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/get-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { DatabaseUuidPipe } from '../../common/database-uuid.pipe.js';
import type { Principal } from '../../common/interfaces/request-with-user.interface.js';
import { ApiData } from '../../platform/api-response.js';
import { StripePaymentService } from './stripe-payment.service.js';

class StripeCheckoutResponseDto {
  @ApiProperty({ type: String, nullable: true }) url: string | null;
  @ApiProperty({ format: 'uuid' }) orderId: string;
}
@ApiTags('payments')
@Controller()
export class StripeController {
  constructor(@Inject(StripePaymentService) private readonly payments: StripePaymentService) {}
  @Post('me/orders/:id/stripe-checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiData(StripeCheckoutResponseDto, 200)
  @HttpCode(200)
  checkout(@CurrentUser() user: Principal, @Param('id', DatabaseUuidPipe) id: string) {
    return this.payments.checkout(user.id, id);
  }
  @Post('webhooks/stripe')
  @HttpCode(200)
  @SkipThrottle()
  @ApiHeader({ name: 'Stripe-Signature', required: true })
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature?: string) {
    return this.payments.webhook(req.rawBody, signature);
  }
}
