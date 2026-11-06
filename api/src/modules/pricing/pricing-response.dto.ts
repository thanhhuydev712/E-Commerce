import { ApiProperty } from '@nestjs/swagger';
export class VariantPriceResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) variantId: string;
  @ApiProperty({ enum: ['VND'] }) currencyCode: string;
  @ApiProperty({ type: String }) amount: string;
  @ApiProperty({ type: String, nullable: true }) compareAtAmount: string | null;
  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiProperty({ type: Date }) updatedAt: Date;
}
export class CurrencyResponseDto {
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty() minorUnit: number;
}
