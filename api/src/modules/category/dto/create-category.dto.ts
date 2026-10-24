import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'The name of the category',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'Devices and gadgets including phones, laptops, and accessories',
    description: 'This is description category',
    required: false,
  })
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    example: 'electronics',
    description: 'The URL-Friendly slug for the category',
    required: false,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({
    example: 'https://example.com/images/electronics.png',
    description: 'URL of the category image',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  imageUrl?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the category is active',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
