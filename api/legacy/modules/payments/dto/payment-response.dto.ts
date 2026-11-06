import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({
    example: '1222222222222233sfofof-455dd',
  })
  id: string;

  @ApiProperty({
    example: 'order-123',
  })
  orderId: string;

  @ApiProperty({
    example: 88.88,
  })
  amount: number;

  @ApiProperty({
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({
    example: 'usd',
  })
  currency: string;

  @ApiProperty({
    example: 'COMPLETED',
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({
    example: 'STRIPE',
    nullable: true,
  })
  paymentMethod: string | null;

  @ApiProperty({
    example: 'pi_123213123',
    nullable: true,
  })
  transactionId: string | null;

  @ApiProperty({})
  createdAt: Date;

  @ApiProperty({})
  updatedAt: Date;
}

export class CreatePaymentIntentResponse {
  @ApiProperty({
    example: 'pi_123213123',
    description: 'Mã xác nhận bí mật khách hàng để thanh toán ATM',
  })
  clientSecret: string;

  @ApiProperty({
    example: '12342142=232=3213sadasd',
    description: 'Payment ID trong database',
  })
  paymentId: string;
}

export class CreatePaymentIntentApiResponseDto {
  @ApiProperty({
    example: true,
  })
  success: boolean;

  @ApiProperty({
    type: CreatePaymentIntentResponse,
  })
  data: CreatePaymentIntentResponse;

  @ApiProperty({
    example: 'Tạo thanh toán thành công',
    required: false,
  })
  message?: string;
}

export class PaymentApiResponDto {
  @ApiProperty({
    example: true,
  })
  success: boolean;

  @ApiProperty({
    type: PaymentResponseDto,
  })
  data: PaymentResponseDto;

  @ApiProperty({
    example: 'Tạo thanh toán thành công',
    required: false,
  })
  message?: string;
}
