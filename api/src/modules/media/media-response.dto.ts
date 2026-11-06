import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class MediaResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() status: string;
  @ApiProperty() mimeType: string;
  @ApiProperty({ type: Number, nullable: true }) width: number | null;
  @ApiProperty({ type: Number, nullable: true }) height: number | null;
  @ApiProperty({ type: String }) sizeBytes: string;
  @ApiPropertyOptional() originalName?: string;
  @ApiPropertyOptional({ type: Date }) createdAt?: Date;
}
