import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ nullable: true })
  imageUrl!: string | null;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  stock!: number;
}

export class CartResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  checkedOut!: boolean;

  @ApiProperty({ type: [CartItemResponseDto] })
  items!: CartItemResponseDto[];

  @ApiProperty()
  totalItems!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
