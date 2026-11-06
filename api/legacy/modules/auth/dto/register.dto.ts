// Data Transfert Object (DTO) for users registration

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Vui lòng cung cấp địa chỉ email hợp lệ.' })
  @IsNotEmpty({ message: 'Email là trường bắt buộc' })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'StrongP@ssw0rd',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu là trường bắt buộc.' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  @Matches(/^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$$!%*?&]/, {
    message:
      'Mật khẩu phải chứa ít nhất một chữ cái viết hoa, một chữ cái viết thường, một chữ số và một ký tự đặc biệt.',
  })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}
