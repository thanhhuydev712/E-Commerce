import { ApiProperty } from '@nestjs/swagger';

export class OrderApiResponseDto<T> {
  @ApiProperty({
    description: 'Cho biết yêu cầu đã được thực hiện thành công hay chưa',
  })
  success: boolean;

  @ApiProperty({
    description: 'Trả lại dữ liệu',
    type: Object,
  })
  data: T;

  @ApiProperty({
    description: 'Thông báo tùy chọn',
    nullable: true,
    required: false,
  })
  message: string;
}

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  productId: string;
  @ApiProperty()
  productName: string;
  @ApiProperty()
  quantity: number;
  @ApiProperty()
  price: number;
  @ApiProperty()
  subtotal: number;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  userId: string;
  @ApiProperty()
  status: string;
  @ApiProperty()
  total: number;
  @ApiProperty()
  shippingAddress: string;

  @ApiProperty({
    type: [OrderItemResponseDto],
  })
  items: OrderItemResponseDto[];

  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedOrderResponseDto {
  @ApiProperty({
    type: [OrderApiResponseDto],
  })
  data: OrderResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
