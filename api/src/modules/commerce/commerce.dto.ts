import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  ValidateIf,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DATABASE_UUID } from '../../common/database-uuid.pipe.js';
export class CartLineDto {
  @ApiProperty() @Matches(DATABASE_UUID) variantId: string;
  @ApiProperty() @IsInt() @Min(0) @Max(99) quantity: number;
}
export class CartLinesDto {
  @ApiProperty({ type: [CartLineDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  lines: CartLineDto[];
}
export class QuoteDto {
  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  customer: string;
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(500) address: string;
  @ApiProperty() @Matches(/^[+0-9 ()-]{8,32}$/) phone: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  express?: boolean;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(64)
  couponCode?: string;
}
export class PlaceOrderDto {
  @ApiProperty() @Matches(DATABASE_UUID) quoteId: string;
  @ApiProperty({ enum: ['COD', 'STRIPE'] }) @IsIn(['COD', 'STRIPE']) method:
    'COD' | 'STRIPE';
}
export class SavedBuildDto {
  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;
  @ApiProperty() @IsObject() components: Record<string, string>;
}
export class SupportDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(250) subject: string;
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(5000) body: string;
  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @Matches(DATABASE_UUID)
  orderId?: string;
}
export class ReviewDto {
  @ApiProperty() @Matches(DATABASE_UUID) orderItemId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(5) rating: number;
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(3000) body: string;
}
export class PreferenceDto {
  @ApiProperty() @IsBoolean() enabled: boolean;
}
export class SerialLookupDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(150) serial: string;
}
