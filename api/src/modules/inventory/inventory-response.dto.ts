import { ApiProperty } from '@nestjs/swagger';
export class AdjustmentResponseDto {
  @ApiProperty({ format: 'uuid' }) movementId: string;
  @ApiProperty({ format: 'uuid' }) balanceId: string;
  @ApiProperty({ format: 'uuid' }) variantId: string;
  @ApiProperty({ format: 'uuid' }) warehouseId: string;
  @ApiProperty() onHand: number;
  @ApiProperty() reserved: number;
  @ApiProperty() unavailable: number;
  @ApiProperty() available: number;
  @ApiProperty() version: number;
}
