import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RoleGuard } from '../../common/guards/roles.guard.js';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';
import {
  CreatePaymentIntentApiResponseDto,
  PaymentApiResponDto,
  PaymentResponseDto,
} from './dto/payment-response.dto.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto.js';

@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiTags('payments')
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Create payments
  @Post('create-intent')
  @ApiOperation({
    summary: 'Tạo payment',
    description: 'Tạo payment cho orders',
  })
  @ApiCreatedResponse({
    description: 'Tạo payments thành công',
    type: CreatePaymentIntentApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu không hợp lệ hoặc không tìm thấy đơn hàng',
  })
  async createPaymentIntent(
    @Body() createPaymentIntent: CreatePaymentIntentDto,
    @GetUser('id') userId: string,
  ) {
    return await this.paymentsService.createPaymentIntent(
      createPaymentIntent,
      userId,
    );
  }

  @Post('confirm')
  @ApiOperation({
    summary: 'Xác nhận thanh toán',
    description: 'Xác nhận thanh toán đơn hàng',
  })
  @ApiResponse({
    status: 200,
    description: 'Xác nhận thanh toán thành công',
    type: PaymentApiResponDto,
  })
  @ApiBadRequestResponse({
    description: 'Không tìm thấy thanh toán hoặc đã hoàn tất',
  })
  async confirmPayment(
    @Body() confirmPaymentDto: ConfirmPaymentDto,
    @GetUser('id') userId: string,
  ) {
    return await this.paymentsService.confirmPayment(userId, confirmPaymentDto);
  }

  // Get all payments
  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả đơn thanh toán',
    description: 'Lấy tất cả đơn thanh toán',
  })
  @ApiOkResponse({
    description: 'Lấy thành công',
    type: PaymentApiResponDto,
  })
  async findAll(@GetUser('id') userId: string) {
    return await this.paymentsService.findAll(userId);
  }

  // get payment by id
  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: '12341242142141414-ee23123-ee23123',
  })
  @ApiOperation({
    summary: 'Lấy đơn thanh toán by ID',
  })
  @ApiResponse({
    description: 'Lấy theo ID thành công',
    type: PaymentApiResponDto,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy thanh toán',
  })
  async findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return await this.paymentsService.findOne(id, userId);
  }

  // Get payment by order by id
  @Get('order/:orderId')
  @ApiParam({
    name: 'orderId',
    description: 'Order ID',
    example: 'order-123',
  })
  @ApiOperation({
    summary: 'Lấy đơn thanh toán theo ID đặt hàng',
    description: 'Lấy đơn hàng theo ID',
  })
  @ApiOkResponse({
    description: 'Lấy thanh toán thành công',
    type: PaymentApiResponDto,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy đơn thanh toán',
  })
  async findByOrder(
    @Param('orderId') orderId: string,
    @GetUser('id') userId: string,
  ) {
    return await this.paymentsService.findByOrder(orderId, userId);
  }
}
