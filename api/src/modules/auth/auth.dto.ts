import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateBy,
} from 'class-validator';
export function PasswordField(minimum = 12): PropertyDecorator {
  return (target, key) => {
    IsString()(target, key);
    MinLength(minimum)(target, key);
    MaxLength(72)(target, key);
    ValidateBy({
      name: 'passwordBytes',
      validator: {
        validate: (value) =>
          typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 72,
        defaultMessage: () => 'Password must fit within 72 UTF-8 bytes',
      },
    })(target, key);
  };
}
export class EmailDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email: string;
}
export class LoginDto extends EmailDto {
  @ApiProperty() @PasswordField(1) password: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceLabel?: string;
}
export class RegisterDto extends EmailDto {
  @ApiProperty({ minLength: 12, maxLength: 72 })
  @PasswordField()
  password: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}
export class ChallengeTokenDto {
  @ApiProperty() @IsString() @MinLength(32) @MaxLength(256) token: string;
}
export class ResetPasswordDto extends ChallengeTokenDto {
  @ApiProperty() @PasswordField() newPassword: string;
}
export class ChangePasswordDto {
  @ApiProperty() @PasswordField(1) currentPassword: string;
  @ApiProperty() @PasswordField() newPassword: string;
}
