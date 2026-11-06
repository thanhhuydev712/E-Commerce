import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'ID sản phẩm cần thêm vào giỏ hàng',
    format: 'uuid',
  })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({
    description: 'Số lượng sản phẩm, mặc định là 1',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}
