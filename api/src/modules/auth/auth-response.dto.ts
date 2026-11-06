import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountResponseDto } from '../accounts/account-response.dto.js';
export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty({ description: 'Seconds until access JWT expiry' })
  expiresIn: number;
  @ApiProperty({ type: AccountResponseDto }) user: AccountResponseDto;
}
export class PrincipalDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) sessionId: string;
  @ApiProperty() email: string;
  @ApiProperty({ type: [String] }) roleCodes: string[];
  @ApiProperty({ type: [String] }) permissions: string[];
}
export class SessionRestoreDto {
  @ApiProperty({
    description:
      'True only when the original access window has expired; call refresh then',
  })
  requiresRefresh: boolean;
  @ApiPropertyOptional() accessToken?: string;
  @ApiPropertyOptional({
    description:
      'Remaining seconds in the original access window, never an extension',
  })
  expiresIn?: number;
}
