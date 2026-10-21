import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthenResponseDto } from './dto/auth-response.dto.js';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Register a new user
  async register(registerDto: RegisterDto): Promise<AuthenResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with email already exists');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          password: false,
        },
      });

      const tokens = await this.generateTokens(user.id, user.email);
    } catch (error) {}
  }

  // Generate access and refresh tokens
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{
    acctessToken: string;
    refreshTokens: string;
  }> {
    const payload = { sub: userId, email };
    const refreshId = randomBytes(16).toString('hex');
    const { accessToken, refreshToken } = await Promise.all([
      this.jwtService.signAsync(payload, {}),
    ]);

    return;
  }
}
