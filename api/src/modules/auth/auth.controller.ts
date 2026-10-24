import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { RefreshTokenGuard } from './guards/refresh-token.guards.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { LoginDto } from './dto/login.dto.js';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // Register api
  @Post('register')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Tạo tài khoản người dùng',
  })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Yêu cầu không hợp lệ. Dữ liệu không vượt qua bước kiểm tra tính hợp lệ hoặc người dùng đã tồn tại.',
  })
  @ApiResponse({
    status: 429,
    description:
      'Quá nhiều yêu cầu. Đã vượt quá giới hạn số lượng yêu cầu cho phép.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: AuthResponseDto,
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  // Refresh access token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('JWT-refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Tạo Access Token mới bằng cách sử dụng Refresh Token hợp lệ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã tạo Access Token mới thành công.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa được xác thực. Thông tin đăng nhập không hợp lệ.',
  })
  @ApiResponse({
    status: 429,
    description:
      'Quá nhiều yêu cầu. Đã vượt quá giới hạn số lượng yêu cầu cho phép.',
  })
  async refresh(@GetUser('id') userId: string): Promise<AuthResponseDto> {
    return await this.authService.refreshTokens(userId);
  }

  // Logout user and invalidate refresh token
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Đăng xuất người dùng và vô hiệu hóa Refresh Token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa được xác thực. Thông tin đăng nhập không hợp lệ.',
  })
  @ApiResponse({
    status: 429,
    description:
      'Quá nhiều yêu cầu. Đã vượt quá giới hạn số lượng yêu cầu cho phép.',
  })
  async logout(@GetUser('id') userId: string): Promise<{ message: string }> {
    await this.authService.logout(userId);
    return { message: 'Successfully logged out' };
  }

  // Login
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Xác thực người dùng và trả về Access Token cùng Refresh Token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa được xác thực. Thông tin đăng nhập không hợp lệ.',
  })
  @ApiResponse({
    status: 429,
    description:
      'Quá nhiều yêu cầu. Đã vượt quá giới hạn số lượng yêu cầu cho phép.',
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }
}
