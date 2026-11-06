import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class QueryCategoryDto {
  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái hoạt động.',
    example: true,
  })
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Từ khóa tìm kiếm dùng để lọc các danh mục theo tên hoặc mô tả.',
    example: 'electronics',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Số trang dùng để phân trang.',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page: 1;

  @ApiPropertyOptional({
    description: 'Số lượng mục hiển thị trên mỗi trang khi phân trang.',
    example: 10,
    default: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit: 10;
}
