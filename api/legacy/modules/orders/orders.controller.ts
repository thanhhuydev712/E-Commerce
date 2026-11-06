import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RoleGuard } from '../../common/guards/roles.guard.js';
import { OrdersService } from './orders.service.js';
import {
  ModerateThrottle,
  RelaxedThrottle,
} from '../../common/decorators/custom-throttler.decorator.js';
import { CreateOrdersDto } from './dto/create-order.dto.js';
import {
  OrderApiResponseDto,
  OrderResponseDto,
  PaginatedOrderResponseDto,
} from './dto/order-response.dto.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import { Role } from '@prisma/client';
import { QueryOrderDto } from './dto/query-order.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';

@ApiExtraModels(OrderResponseDto)
@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Create orders
  @Post()
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Tạo mới đơn đặt hàng',
  })
  @ApiBody({
    type: CreateOrdersDto,
  })
  @ApiCreatedResponse({
    description: 'Đơn hàng được tạo thành công',
    type: OrderApiResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu không hợp lệ hoặc không đủ hàng tồn kho',
    type: OrderApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy giỏ hàng hoặc trống',
  })
  @ApiTooManyRequestsResponse({
    description: 'Quá nhiều yêu cầu - vượt quá giới hạn số lượng yêu cầu',
  })
  async create(
    @Body() createOrderDto: CreateOrdersDto,
    @GetUser('id') userId: string,
  ) {
    return await this.ordersService.create(createOrderDto, userId);
  }

  // Get all user for admin
  @Get('admin/all')
  @Roles(Role.ADMIN)
  @RelaxedThrottle()
  @ApiOperation({
    summary: '[ADMIN] Lấy tất cả đơn đặt hàng',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @ApiResponse({
    description: 'Danh sách đặt đặt hàng',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            $ref: getSchemaPath(OrderResponseDto),
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Cần quyền ADMIN',
  })
  async findAllForAdmin(@Query() query: QueryOrderDto) {
    return await this.ordersService.findAllForAdmin(query);
  }

  // User get own orders
  @Get()
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Lấy tất cả đơn hàng của current user',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
  })
  @ApiOkResponse({
    description: 'Danh sách đơn hàng của user',
    type: PaginatedOrderResponseDto,
  })
  async findAll(@Query() query: QueryOrderDto, @GetUser('id') userId: string) {
    return await this.ordersService.findAll(query, userId);
  }

  // Get order by ID
  @Get('admin/:id')
  @Roles(Role.ADMIN)
  @RelaxedThrottle()
  @ApiOperation({
    summary: '[ADMIN] Get order by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
  })
  @ApiOkResponse({
    description: 'Chi tiết đặt hàng',
    type: OrderApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy đơn đặt hàng',
  })
  @ApiForbiddenResponse({
    description: 'Cần quyền ADMIN',
  })
  async findOneAdmin(@Param('id') id: string) {
    return await this.ordersService.findOne(id);
  }

  // User: Get own order by id
  @Get('id')
  @RelaxedThrottle()
  @ApiOperation({
    summary: 'Lấy đơn hàng theo ID cho người dùng hiện tại.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Đơn hàng',
  })
  @ApiOkResponse({
    description: 'Chi tiết đơn hàng',
    type: OrderApiResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy đơn hàng',
  })
  async findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return await this.ordersService.findOne(id, userId);
  }

  // ADMIN: update order
  @Patch('/admin/:id')
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Chỉnh sửa đơn đặt hàng [ADMIN]',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
  })
  @ApiBody({
    type: UpdateOrderDto,
  })
  @ApiOkResponse({
    description: 'Đơn đặt hàng được chỉnh sửa thành công',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy đơn đặt hàng',
  })
  @ApiForbiddenResponse({
    description: 'Cần quyền ADMIN',
  })
  async updateAdmin(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return await this.ordersService.update(id, dto);
  }

  // User Updating Order
  @Patch('/:id')
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Chỉnh sửa đơn đặt hàng [USER]',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
  })
  @ApiBody({
    type: UpdateOrderDto,
  })
  @ApiOkResponse({
    description: 'Đơn đặt hàng được chỉnh sửa thành công',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy đơn đặt hàng',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @GetUser('id') userId: string,
  ) {
    return await this.ordersService.update(id, dto, userId);
  }

  // Cancle order ADMIN
  @Delete('admin/:id')
  @Roles(Role.ADMIN)
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Huỷ đơn đặt hàng [ADMIN]',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
  })
  @ApiOkResponse({
    description: 'Đơn đặt hàng được huỷ thành công',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy đơn đặt hàng',
  })
  @ApiForbiddenResponse({
    description: 'Cần quyền Admin',
  })
  async cancleAdmin(@Param('id') id: string) {
    return await this.ordersService.cancle(id);
  }

  // Cancle order USER
  @Delete(':id')
  @ModerateThrottle()
  @ApiOperation({
    summary: 'Huỷ đơn đặt hàng [USER]',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
  })
  @ApiOkResponse({
    description: 'Đơn đặt hàng được huỷ thành công',
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy đơn đặt hàng',
  })
  async cancel(@Param('id') id: string, @GetUser('id') userId: string) {
    return await this.ordersService.cancle(id, userId);
  }
}
