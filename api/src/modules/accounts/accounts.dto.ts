import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ChangePasswordDto, PasswordField } from '../auth/auth.dto.js';
export { ChangePasswordDto };
export class UpdateProfileDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}
export class ArchiveAccountDto {
  @ApiProperty() @PasswordField(1) currentPassword: string;
}
export class AccountStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'LOCKED', 'ARCHIVED'] })
  @IsIn(['ACTIVE', 'LOCKED', 'ARCHIVED'])
  status: string;
}
export class ListAccountsDto {
  @ApiPropertyOptional({ default: 1, maximum: 21474837 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  // Giữ offset phân trang trong giới hạn int32 của Prisma/PostgreSQL.
  @Max(21474837)
  page: number = 1;
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
export class CreateAddressDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  recipientName: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(32) phone: string;
  @ApiProperty({ example: 'VN' }) @IsString() @Length(2, 2) countryCode: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  regionCode?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  regionName?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  locality?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(300) line1: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  line2?: string;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefaultShipping?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefaultBilling?: boolean;
}
export class UpdateAddressDto extends PartialType(CreateAddressDto, {
  skipNullProperties: false,
}) {}
