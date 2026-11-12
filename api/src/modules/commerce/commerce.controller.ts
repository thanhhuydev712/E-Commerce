import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { DatabaseUuidPipe } from '../../common/database-uuid.pipe.js';
import { CurrentUser } from '../../common/decorators/get-user.decorator.js';
import type { Principal } from '../../common/interfaces/request-with-user.interface.js';
import { CommerceService } from './commerce.service.js';
import { OrderService } from './order.service.js';
import { StripePaymentService } from './stripe-payment.service.js';
import { ApiData } from '../../platform/api-response.js';
import {
  CartResponseDto,
  QuoteResponseDto,
  OrderResponseDto,
} from './commerce-response.dto.js';
import {
  CartLineDto,
  CartLinesDto,
  PlaceOrderDto,
  PreferenceDto,
  QuoteDto,
  ReviewDto,
  SavedBuildDto,
  SupportDto,
  SerialLookupDto,
} from './commerce.dto.js';
@ApiTags('commerce')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class CommerceController {
  constructor(
    @Inject(CommerceService) private readonly commerce: CommerceService,
    @Inject(OrderService) private readonly orders: OrderService,
    @Inject(StripePaymentService)
    private readonly payments: StripePaymentService,
  ) {}
  @Post('warranty/lookup') lookup(
    @CurrentUser() user: Principal,
    @Body() dto: SerialLookupDto,
  ) {
    return this.commerce.lookupSerial(user.id, dto.serial);
  }
  @Get('cart') @ApiData(CartResponseDto) cart(@CurrentUser() user: Principal) {
    return this.commerce.cart(user.id);
  }
  @Put('cart') @ApiData(CartResponseDto) cartSet(
    @CurrentUser() user: Principal,
    @Body() dto: CartLinesDto,
  ) {
    return this.commerce.setCart(user.id, dto.lines);
  }
  @Post('cart/items') @ApiData(CartResponseDto, 201) add(
    @CurrentUser() user: Principal,
    @Body() dto: CartLineDto,
  ) {
    return this.commerce.setCart(user.id, [dto], true);
  }
  @Post('cart/build') @ApiData(CartResponseDto, 201) buildCart(
    @CurrentUser() user: Principal,
    @Body() dto: CartLinesDto,
  ) {
    return this.commerce.setCart(user.id, dto.lines, true);
  }
  @Post('checkout/quote') @ApiData(QuoteResponseDto, 201) quote(
    @CurrentUser() user: Principal,
    @Body() dto: QuoteDto,
  ) {
    return this.orders.quote(user.id, dto);
  }
  @Post('orders')
  @ApiData(OrderResponseDto, 201)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  place(
    @CurrentUser() user: Principal,
    @Headers('idempotency-key') key: string | undefined,
    @Body() dto: PlaceOrderDto,
  ) {
    return this.orders.place(user.id, key, dto);
  }
  @Get('orders') @ApiData(OrderResponseDto, 200, true) ordersList(
    @CurrentUser() user: Principal,
  ) {
    return this.orders.list(user.id);
  }
  @Get('orders/:id') @ApiData(OrderResponseDto) order(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.orders.detail(user.id, id);
  }
  @Post('orders/:id/cancel') @ApiData(OrderResponseDto) @HttpCode(200) cancel(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.payments.cancel(user.id, id);
  }
  @Get('wishlist') wishlist(@CurrentUser() user: Principal) {
    return this.commerce.wishlist(user.id);
  }
  @Post('wishlist/:id') toggle(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.commerce.toggleWishlist(user.id, id);
  }
  @Get('builds') builds(@CurrentUser() user: Principal) {
    return this.commerce.builds(user.id);
  }
  @Post('builds') saveBuild(
    @CurrentUser() user: Principal,
    @Body() dto: SavedBuildDto,
  ) {
    return this.commerce.saveBuild(user.id, dto);
  }
  @Delete('builds/:id') deleteBuild(
    @CurrentUser() user: Principal,
    @Param('id', DatabaseUuidPipe) id: string,
  ) {
    return this.commerce.deleteBuild(user.id, id);
  }
  @Get('support') tickets(@CurrentUser() user: Principal) {
    return this.commerce.tickets(user.id);
  }
  @Post('support') support(
    @CurrentUser() user: Principal,
    @Body() dto: SupportDto,
  ) {
    return this.commerce.support(user.id, dto);
  }
  @Get('notifications') notifications(@CurrentUser() user: Principal) {
    return this.commerce.notifications(user.id);
  }
  @Post('notifications/read') read(@CurrentUser() user: Principal) {
    return this.commerce.readNotifications(user.id);
  }
  @Get('preferences') preference(@CurrentUser() user: Principal) {
    return this.commerce.preference(user.id);
  }
  @Put('preferences') setPreference(
    @CurrentUser() user: Principal,
    @Body() dto: PreferenceDto,
  ) {
    return this.commerce.setPreference(user.id, dto.enabled);
  }
  @Get('reviews') reviews(@CurrentUser() user: Principal) {
    return this.commerce.reviews(user.id);
  }
  @Post('reviews') review(
    @CurrentUser() user: Principal,
    @Body() dto: ReviewDto,
  ) {
    return this.commerce.review(user.id, dto);
  }
}
