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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RoleGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductResponseDto } from './dto/product-response.dto.js';
import { QueryProDuctDto } from './dto/query-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Create Product
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo sản phẩm',
  })
  @ApiBody({
    type: CreateProductDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Đã tạo sản phẩm thành công',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Sai dữ liệu nhập',
  })
  @ApiResponse({
    status: 409,
    description: 'SKU đã tồn tại',
  })
  @ApiResponse({
    status: 403,
    description: 'Truy cập bị từ chối',
  })
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productsService.create(createProductDto);
  }

  // Get all products
  @Get('')
  @ApiOperation({
    summary: 'Lấy tất cả sản phẩm',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/ProductResponseDto',
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
            },
            page: {
              type: 'number',
            },
            limit: {
              type: 'number',
            },
            totalPages: {
              type: 'number',
            },
          },
        },
      },
    },
  })
  async findAll(@Query() queryDto: QueryProDuctDto) {
    return await this.productsService.findAll(queryDto);
  }

  // Get product by ID
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy sản phẩm theo ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết sản phẩm',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sản phẩm',
  })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return await this.productsService.findOne(id);
  }

  // Update a product
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update sản phẩm ',
  })
  @ApiBody({
    type: UpdateProductDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Update sản phẩm thành công',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sản phẩm',
  })
  @ApiResponse({
    status: 409,
    description: 'Sku đã tồn tại',
  })
  async update(
    @Param('id') id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productsService.update(id, updateProductDto);
  }

  // Update stock product
  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Chỉnh số lượng sản phẩm',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantity: {
          type: 'number',
          description: 'Điều chỉnh hàng tồn kho',
          example: 10,
        },
      },
      required: ['quantity'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Chỉnh sửa hàng tồn kho thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sản phẩm',
  })
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ): Promise<ProductResponseDto> {
    return await this.productsService.updateStock(id, quantity);
  }

  // Delete product
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Xoá sản phẩm',
  })
  @ApiResponse({
    status: 200,
    description: 'Xoá sản phẩm thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sản phẩm',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete product in active orders',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    return await this.productsService.delete(id);
  }
}
