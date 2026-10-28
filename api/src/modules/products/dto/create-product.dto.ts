import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  // 1. Tên sản phẩm - Bắt buộc
  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Iphone 12 Pro',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  // 2. Mô tả sản phẩm - Không bắt buộc
  @ApiPropertyOptional({
    description: 'Mô tả sản phẩm',
    example: 'Iphone 12 Pro được ra mắt trước Iphone 18',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  // 3. Giá sản phẩm - Bắt buộc
  @ApiProperty({
    description: 'Giá sản phẩm: USD',
    example: 99.99,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  price: number;

  // 4. Số lượng tồn kho - Bắt buộc
  @ApiProperty({
    description: 'Số lượng sản phẩm tồn kho',
    example: 15,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  // 5. SKU - Bắt buộc
  @ApiProperty({
    description: 'Mã SKU của sản phẩm',
    example: 'IP-012',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  // 6. URL hình ảnh - Không bắt buộc
  @ApiPropertyOptional({
    description: 'URL hình ảnh sản phẩm',
    example: 'https://example.com/image.png',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  // 7. ID danh mục - Bắt buộc
  @ApiProperty({
    description: 'ID danh mục của sản phẩm',
    example: '52658f1a-f06a-46c2-bab9-be6d0bb2a8d0',
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  // 8. Trạng thái sản phẩm - Không bắt buộc
  @ApiPropertyOptional({
    description:
      'Cho biết sản phẩm có đang hoạt động và có sẵn để mua hay không.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
