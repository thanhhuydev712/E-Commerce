import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional({ nullable: true, type: String }) firstName:
    string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) lastName:
    string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) phone: string | null;
  @ApiProperty({ enum: ['ACTIVE', 'LOCKED', 'ARCHIVED'] }) status: string;
  @ApiPropertyOptional({ nullable: true, type: Date })
  emailVerifiedAt: Date | null;
  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiProperty({ type: Date }) updatedAt: Date;
  @ApiProperty({ type: [String] }) roleCodes: string[];
  @ApiProperty({ type: [String] }) permissions: string[];
}
export class SessionResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiPropertyOptional({ nullable: true, type: String }) deviceLabel:
    string | null;
  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiProperty({ type: Date }) expiresAt: Date;
  @ApiPropertyOptional({ nullable: true, type: Date }) rotatedAt: Date | null;
}
export class AddressResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) userId: string;
  @ApiPropertyOptional({ nullable: true, type: String }) label: string | null;
  @ApiProperty() recipientName: string;
  @ApiProperty() phone: string;
  @ApiProperty() countryCode: string;
  @ApiPropertyOptional({ nullable: true, type: String }) regionCode:
    string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) regionName:
    string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) locality:
    string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) postalCode:
    string | null;
  @ApiProperty() line1: string;
  @ApiPropertyOptional({ nullable: true, type: String }) line2: string | null;
  @ApiProperty() isDefaultShipping: boolean;
  @ApiProperty() isDefaultBilling: boolean;
  @ApiPropertyOptional({ nullable: true, type: Date }) archivedAt: Date | null;
  @ApiProperty({ type: Date }) createdAt: Date;
  @ApiProperty({ type: Date }) updatedAt: Date;
}
export class AccountPageDto {
  @ApiProperty({ type: [AccountResponseDto] }) items: AccountResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}
