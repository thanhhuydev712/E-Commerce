import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CartLineDto } from './commerce.dto.js';
const money = {
  type: String,
  pattern: '^[0-9]+$',
  description: 'Integer VND amount',
};
export class CartResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() version: number;
  @ApiProperty({ type: [CartLineDto] }) lines: CartLineDto[];
}
class TotalsDto {
  @ApiProperty(money) subtotal: string;
  @ApiProperty(money) discount: string;
  @ApiProperty(money) shipping: string;
  @ApiProperty(money) total: string;
}
class QuoteLineDto {
  @ApiProperty({ format: 'uuid' }) variantId: string;
  @ApiProperty({ format: 'uuid' }) productId: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) label: string | null;
  @ApiProperty() sku: string;
  @ApiProperty(money) price: string;
  @ApiProperty() quantity: number;
}
export class QuoteResponseDto extends TotalsDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ type: Date }) expiresAt: Date;
  @ApiProperty({ format: 'uuid' }) cartId: string;
  @ApiProperty() cartVersion: number;
  @ApiProperty({ type: [QuoteLineDto] }) lines: QuoteLineDto[];
  @ApiProperty() customer: string;
  @ApiProperty() address: string;
  @ApiProperty() phone: string;
  @ApiProperty() express: boolean;
  @ApiProperty({ type: String, nullable: true, format: 'uuid' }) couponId:
    string | null;
  @ApiProperty({ type: String, nullable: true, format: 'uuid' }) promotionId:
    string | null;
  @ApiProperty({ type: [String], enum: ['COD'] }) methods: string[];
  @ApiProperty() taxIncluded: boolean;
}
class OrderLineDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) variantId: string;
  @ApiProperty() name: string;
  @ApiProperty(money) price: string;
  @ApiProperty() quantity: number;
}
class OrderHistoryDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() toStatus: string;
  @ApiProperty({ type: String, nullable: true }) reason: string | null;
  @ApiProperty({ type: Date }) createdAt: Date;
}
class OrderDocumentDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ type: String, nullable: true }) number: string | null;
  @ApiProperty() status: string;
  @ApiProperty(money) totalAmount: string;
  @ApiProperty({ type: Date, nullable: true }) issuedAt: Date | null;
}
export class OrderResponseDto extends TotalsDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() number: string;
  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiProperty({ enum: ['processing', 'cancelled'] }) status: string;
  @ApiProperty() backendStatus: string;
  @ApiProperty({ enum: ['paid', 'pending'] }) payment: string;
  @ApiProperty({ type: [OrderLineDto] }) lines: OrderLineDto[];
  @ApiProperty() customer: string;
  @ApiProperty() address: string;
  @ApiProperty() canCancel: boolean;
  @ApiPropertyOptional({ type: [OrderHistoryDto] }) history?: OrderHistoryDto[];
  @ApiPropertyOptional({ type: [OrderDocumentDto] })
  documents?: OrderDocumentDto[];
}
