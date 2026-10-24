import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Iphone 12 Pro',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'mô tả sản phẩm',
    example: 'Iphone 12 Pro được ra mắt trước Iphone 18',
    maxLength: 255,
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Giá sản phẩm: USD',
    example: 99.99,
    minimum: 0,
  })
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: 'Sản phẩm tồn',
    example: 15,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({
    description: 'Sku của sản phẩm',
    example: 'IP-012',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @ApiProperty({
    description: 'URL Sản phẩm',
    example: 'https:// example.com/iamge.png',
    required: false,
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Category Sản phẩm',
    example: 'iphone',
    required: true,
  })
  @IsString()
  @IsOptional()
  categoryId: string;

  @ApiProperty({
    description:
      'Cho biết sản phẩm có đang ở trạng thái hoạt động và có sẵn để mua hay không.',
    example: true,
    default: true,
    required: false,
  })
  isActive?: boolean;
}
