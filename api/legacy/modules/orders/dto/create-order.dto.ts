import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class OrderItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({
    example: 99.99,
  })
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    { message: 'Giá cần phải đúng tiêu chuẩn (99.99)' },
  )
  @Type(() => Number)
  price: number;
}

export class CreateOrdersDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingAddress: string;
}
