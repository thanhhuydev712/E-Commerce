import { Body, Controller } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthenResponseDto } from './dto/auth-response.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
    // Register api
  }
  async register(@Body() registerDto: RegisterDto): Promise<AuthenResponseDto> {
    return this.authService.register(registerDto);
  }
}
