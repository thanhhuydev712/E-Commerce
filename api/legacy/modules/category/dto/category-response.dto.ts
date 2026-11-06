import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CategoryResponseDto {
  @ApiProperty({
    example: '550e484-ere8458454-45erer4844858',
    description: 'The unique identifier of the category',
  })
  id: string;

  @ApiProperty({
    example: 'Electronics',
    description: 'The name of the category',
  })
  name: string;

  @ApiProperty({
    example: 'Devices and gadgets including phones, laptops, and accessories',
    description: 'This is decription category',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    example: 'electronics',
    description: 'The URL-Friendly slug for the category',
    nullable: true,
  })
  slug: string | null;

  @ApiProperty({
    example: 'https://example.com/images/electronics.png',
    description: 'URL of the category image',
    nullable: true,
  })
  imgUrl: string | null;

  @ApiProperty({
    example: true,
    description: 'Indicates if the category is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive: boolean | null;

  @ApiProperty({
    example: 150,
    description: 'Number of products in this category',
  })
  productCount: number;

  @ApiProperty({
    example: '2026-10-23T12:00:00Z',
    description: 'The date and time when the category was create',
  })
  createAt: Date;

  @ApiProperty({
    example: '2026-10-23T15:00:00Z',
    description: 'The date and time when the category was last updated',
  })
  updateAt: Date;
}
