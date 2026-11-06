import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CatalogReferenceDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
}
export class BrandResponseDto extends CatalogReferenceDto {
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty() status: string;
  @ApiProperty({ type: String, nullable: true, format: 'uuid' }) logoAssetId:
    string | null;
  @ApiProperty({ type: String, nullable: true }) logoUrl: string | null;
  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiProperty({ type: Date }) updatedAt: Date;
}
export class CategoryResponseDto extends CatalogReferenceDto {
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'uuid' }) parentId:
    string | null;
  @ApiProperty() sortOrder: number;
  @ApiProperty() status: string;
  @ApiProperty({ type: String, nullable: true, format: 'uuid' }) imageAssetId:
    string | null;
  @ApiProperty({ type: String, nullable: true }) imageUrl: string | null;
  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiProperty({ type: Date }) updatedAt: Date;
}
export class ProductCategoryResponseDto extends CatalogReferenceDto {
  @ApiProperty() isPrimary: boolean;
}
export class AttributeResponseDto {
  @ApiProperty({ format: 'uuid' }) attributeId: string;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) unit: string | null;
  @ApiProperty({ enum: ['TEXT', 'NUMBER', 'BOOLEAN'] }) dataType: string;
  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'boolean' }],
    description: 'NUMBER is an exact decimal string',
  })
  value: string | boolean;
}
export class OptionValueResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() code: string;
  @ApiProperty() label: string;
}
export class OptionResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: [OptionValueResponseDto] })
  values: OptionValueResponseDto[];
}
export class ProductPriceDto {
  @ApiProperty({ type: String, example: '1500000' }) amount: string;
  @ApiProperty({ enum: ['VND'] }) currency: string;
  @ApiProperty({ type: String, nullable: true }) compareAtAmount: string | null;
}
export class ProductVariantResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() sku: string;
  @ApiProperty({ type: String, nullable: true }) name: string | null;
  @ApiProperty({ type: Number, nullable: true }) weightGrams: number | null;
  @ApiProperty({ type: ProductPriceDto }) price: ProductPriceDto;
  @ApiProperty({
    description:
      'Aggregate available quantity at active warehouses; not a reservation',
  })
  available: number;
  @ApiProperty({ type: [OptionValueResponseDto] })
  optionValues: OptionValueResponseDto[];
  @ApiProperty({ type: [AttributeResponseDto] })
  attributes: AttributeResponseDto[];
}
export class ProductMediaResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) assetId: string;
  @ApiProperty({ type: String, nullable: true, format: 'uuid' }) variantId:
    string | null;
  @ApiProperty() url: string;
  @ApiProperty({ type: String, nullable: true }) altText: string | null;
  @ApiProperty() isPrimary: boolean;
  @ApiProperty({ type: Number, nullable: true }) width: number | null;
  @ApiProperty({ type: Number, nullable: true }) height: number | null;
}
export class ProductResponseDto extends CatalogReferenceDto {
  @ApiProperty({ type: String, nullable: true }) summary: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Untrusted text; sanitize if rendering HTML',
  })
  description: string | null;
  @ApiProperty({ type: CatalogReferenceDto, nullable: true })
  brand: CatalogReferenceDto | null;
  @ApiProperty({ type: [ProductCategoryResponseDto] })
  categories: ProductCategoryResponseDto[];
  @ApiProperty({ type: [OptionResponseDto] }) options: OptionResponseDto[];
  @ApiProperty({ type: [AttributeResponseDto] })
  attributes: AttributeResponseDto[];
  @ApiProperty({ type: [ProductMediaResponseDto] })
  media: ProductMediaResponseDto[];
  @ApiProperty({ type: [ProductVariantResponseDto] })
  variants: ProductVariantResponseDto[];
  @ApiProperty({ type: Date }) publishedAt: Date;
}
export class ProductPageDto {
  @ApiProperty({ type: [ProductResponseDto] }) items: ProductResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}
export class CatalogResourceDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiPropertyOptional({
    description: 'See administrative resource contract for additional fields',
  })
  status?: string;
}
