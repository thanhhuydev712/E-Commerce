import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Product ID',
    example: '50e484-ere8458454-45erer4844858',
  })
  id: string;

  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Iphone 12 Pro',
  })
  name: string;

  @ApiProperty({
    description: 'Mô tả sản phẩm',
    example: 'Mô tả bla bla',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Giá',
    example: 99.99,
  })
  price: number;

  @ApiProperty({
    description: 'Tồn kho',
    example: 99,
  })
  stock: number;

  @ApiProperty({
    description: 'Liên kết hình ảnh sản phẩm',
    example: 'https://example.com/image.png',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Category sản phẩm',
    example: 'iphone',
  })
  category: string | null;

  @ApiProperty({
    description: 'Trạng thái sản phẩm',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'updation timestamp',
  })
  updatedAt: Date;
}
