import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsOptional,
} from 'class-validator';
import { DATABASE_UUID } from '../../common/database-uuid.pipe.js';
import { PageQuery } from '../catalog/catalog.dto.js';
export class WarehouseDto {
  @ApiProperty() @Matches(/^[a-zA-Z0-9_-]{1,64}$/) code: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(150) name: string;
  @ApiProperty({
    description: 'Human-readable warehouse address; stored as a snapshot',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  address: string;
}
export class BalanceQuery extends PageQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID)
  variantId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID)
  warehouseId?: string;
}
export class AdjustStockDto {
  @ApiProperty() @Matches(DATABASE_UUID) variantId: string;
  @ApiProperty() @Matches(DATABASE_UUID) warehouseId: string;
  @ApiProperty({ description: 'Signed integer, nonzero' })
  @IsInt()
  @Min(-2147483647)
  @Max(2147483647)
  delta: number;
  @ApiProperty() @IsInt() @Min(0) @Max(2147483647) expectedVersion: number;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(1000) reason: string;
}
