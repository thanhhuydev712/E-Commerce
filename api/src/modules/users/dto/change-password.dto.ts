// DTO for changing user password

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu mới cho người dùng.',
    example: 'NewP@ssw0rd',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống.' })
  currentPassword: string;

  @ApiProperty({
    description: 'Mật khẩu mới cho người dùng.',
    example: 'NewP@ssw0rd',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Mật khẩu mới không được để trống.',
  })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' })
  @Matches(/^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$$!%*?&]/, {
    message:
      'Mật khẩu mới phải chứa ít nhất một chữ cái viết hoa, một chữ cái viết thường, một chữ số và một ký tự đặc biệt.',
  })
  newPassword: string;
}
