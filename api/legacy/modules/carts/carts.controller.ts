import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import type { Request } from 'express';

import { CartsService } from './carts.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

// Sử dụng đúng JwtAuthGuard mà những controller hiện có của bạn đang dùng.
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RoleGuard } from '../../common/guards/roles.guard.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import { ModerateThrottle } from '../../common/decorators/custom-throttler.decorator.js';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@ApiTags('carts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Lấy giỏ hàng của người dùng hiện tại',
  })
  @ApiOkResponse({
    description: 'Lấy giỏ hàng thành công',
  })
  async getMyCart(@GetUser('id') userId: string) {
    return await this.cartsService.getMyCart(userId);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Thêm sản phẩm vào giỏ hàng',
  })
  @ApiCreatedResponse({
    description: 'Thêm sản phẩm thành công',
  })
  addItem(@Req() req: AuthenticatedRequest, @Body() dto: AddCartItemDto) {
    return this.cartsService.addItem(req.user.id, dto);
  }

  @Patch('items/:itemId')
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'itemId',
    description: 'ID của CartItem, không phải Product ID',
  })
  @ApiBody({
    type: UpdateCartItemDto,
  })
  @ApiOkResponse({
    description: 'Cập nhật giỏ hàng thành công',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy giỏ hàng hoặc sản phẩm trong giỏ',
  })
  @ApiBadRequestResponse({
    description: 'Số lượng không hợp lệ hoặc vượt quá tồn kho',
  })
  async updateItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
    @GetUser('id') userId: string,
  ) {
    return this.cartsService.updateItem(userId, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({
    summary: 'Xóa một mặt hàng khỏi giỏ',
  })
  @ApiParam({
    name: 'itemId',
    description: 'ID mặt hàng trong giỏ',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Xóa mặt hàng thành công',
  })
  async removeItem(
    @Req() req: AuthenticatedRequest,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return await this.cartsService.removeItem(req.user.id, itemId);
  }

  @Delete('me/items')
  @ApiOperation({
    summary: 'Xóa toàn bộ sản phẩm trong giỏ',
  })
  @ApiOkResponse({
    description: 'Đã làm trống giỏ hàng',
  })
  async clearCart(@Req() req: AuthenticatedRequest) {
    return await this.cartsService.clearCart(req.user.id);
  }
}
