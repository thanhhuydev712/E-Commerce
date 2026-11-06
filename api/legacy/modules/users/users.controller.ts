import {
  Controller,
  Get,
  UseGuards,
  Req,
  Param,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RoleGuard } from '../../common/guards/roles.guard.js';
import { UsersService } from './users.service.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {
    // Get current user profile
  }

  @Get('me')
  @ApiOperation({
    summary: 'Lấy thông tin người dùng hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng hiện tại thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  async getProfile(@Req() req: RequestWithUser): Promise<UserResponseDto> {
    return await this.usersService.findOne(req.user.id);
  }

  // Get all-user (for-admin purposes)
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Lấy tất cả người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy tất cả người dùng thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  async findAll(): Promise<UserResponseDto[]> {
    return await this.usersService.findAll();
  }

  // Get user by id
  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Lấy người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy người dùng bằng ID',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
  })
  async getUserById(@Param('id') userId: string): Promise<UserResponseDto> {
    return await this.usersService.findOne(userId);
  }

  // Update cur user profile
  @Patch('me')
  @ApiOperation({
    summary: ' Thay đổi tài khoản',
  })
  @ApiBody({
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Thay đổi thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  @ApiResponse({
    status: 409,
    description: 'Email này đã được sử dụng',
  })
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() UpdateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.update(req.user.id, UpdateUserDto);
  }

  // Change current user password
  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Thay đổi mât khẩu',
  })
  @ApiResponse({
    status: 200,
    description: 'Thay đổi mật khẩu thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  async changePassword(
    @GetUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return await this.usersService.changePassword(userId, changePasswordDto);
  }

  // Delete current user
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xoá tài khoản',
  })
  @ApiResponse({
    status: 200,
    description: 'Xoá tài khoản thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  async deleteCurrentUser(
    @GetUser('id') userId: string,
  ): Promise<{ message: string }> {
    return await this.usersService.remove(userId);
  }

  // Delete user by ID
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xoá người dùng bằng ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Xoá người dùng bằng ID thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  async deleteUserById(
    @Param('id') userId: string,
  ): Promise<{ message: string }> {
    return await this.usersService.remove(userId);
  }
}
