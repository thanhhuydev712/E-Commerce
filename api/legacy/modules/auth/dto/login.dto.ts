import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Vui lòng cung cấp địa chỉ email hợp lệ.' })
  @IsNotEmpty({ message: 'Email là trường bắt buộc.' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'StrongP@ssw0rd',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu là trường bắt buộc.' })
  password: string;
}
