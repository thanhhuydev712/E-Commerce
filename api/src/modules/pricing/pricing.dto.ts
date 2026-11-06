import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
export class SetPriceDto {
  @ApiProperty({ example: '1500000', description: 'Integer VND string, no FX' })
  @Matches(/^(0|[1-9]\d{0,18})$/)
  amount: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(/^(0|[1-9]\d{0,18})$/)
  compareAtAmount?: string | null;
}
export class TaxClassDto {
  @ApiProperty() @Matches(/^[a-zA-Z0-9_-]{1,64}$/) code: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(150) name: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
export class TaxRateDto {
  @ApiProperty() @Matches(/^[a-zA-Z0-9_-]{1,64}$/) code: string;
  @ApiProperty() @IsString() @Length(2, 2) countryCode: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  regionCode?: string;
  @ApiProperty({ example: '0.1' })
  @Matches(/^(0(\.\d{1,6})?|1(\.0{1,6})?)$/)
  rate: string;
  @ApiProperty() @IsDateString() effectiveFrom: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
  @ApiPropertyOptional()
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  priority = 0;
}
