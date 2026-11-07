import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
class StorefrontVariantDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() sku: string;
  @ApiProperty() label: string;
  @ApiProperty({ description: 'Integer VND string' }) price: string;
  @ApiProperty({
    description:
      'Compare-at amount for this SKU, or its current price when unset',
  })
  oldPrice: string;
  @ApiProperty() stock: number;
}
class StorefrontReviewDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() rating: number;
  @ApiProperty({ type: String, nullable: true }) title: string | null;
  @ApiProperty() body: string;
}
class StorefrontProductDto {
  @ApiProperty({ description: 'Public slug, used as storefront ID' })
  id: string;
  @ApiProperty({ format: 'uuid' }) databaseId: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiProperty() category: string;
  @ApiProperty() brand: string;
  @ApiProperty() price: string;
  @ApiProperty() oldPrice: string;
  @ApiProperty() image: string;
  @ApiProperty({ type: [String] }) specs: string[];
  @ApiProperty({ type: Object, additionalProperties: true }) technical: Record<
    string,
    unknown
  >;
  @ApiProperty() builderEligible: boolean;
  @ApiProperty({ type: [StorefrontVariantDto] })
  variants: StorefrontVariantDto[];
  @ApiProperty() stock: number;
  @ApiProperty() warranty: string;
  @ApiPropertyOptional() badge?: string;
  @ApiProperty({ type: [StorefrontReviewDto] }) reviews: StorefrontReviewDto[];
}
class StorefrontCategoryDto {
  @ApiProperty() id: string;
  @ApiProperty({ format: 'uuid' }) databaseId: string;
  @ApiProperty() name: string;
  @ApiProperty() short: string;
  @ApiProperty() icon: string;
}
class StorefrontArticleDto {
  @ApiProperty() id: string;
  @ApiProperty({ format: 'uuid' }) databaseId: string;
  @ApiProperty() title: string;
  @ApiProperty() tag: string;
  @ApiProperty() image: string;
  @ApiProperty() content: string;
}
class StorefrontPageBodyDto {
  @ApiProperty({ type: [String] }) paragraphs: string[];
}
class StorefrontPageDto {
  @ApiProperty() slug: string;
  @ApiProperty() title: string;
  @ApiProperty({ type: StorefrontPageBodyDto }) body: StorefrontPageBodyDto;
}
export class StorefrontResponseDto {
  @ApiProperty({ type: [StorefrontProductDto] })
  products: StorefrontProductDto[];
  @ApiProperty({ type: [StorefrontCategoryDto] })
  categories: StorefrontCategoryDto[];
  @ApiProperty({ type: [StorefrontArticleDto] })
  articles: StorefrontArticleDto[];
  @ApiProperty({ type: [StorefrontPageDto] }) pages: StorefrontPageDto[];
  @ApiProperty({
    type: Object,
    additionalProperties: true,
    description:
      'Public layout/menu/banner/shelf/showroom/shipping configuration; see frontend Presentation contract',
  })
  presentation: Record<string, unknown>;
}
