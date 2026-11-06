import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoryService } from './category.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RoleGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CategoryResponseDto } from './dto/category-response.dto.js';
import { QueryCategoryDto } from './dto/query-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Create Category
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo Category',
  })
  @ApiBody({
    type: CreateCategoryDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo Category thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Sai dữ liệu nhập',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực',
  })
  @ApiResponse({
    status: 403,
    description: 'Truy cập bị từ chối',
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return await this.categoryService.create(createCategoryDto);
  }

  // Get all Category
  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả Category',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách tất cả category được lấy thành công',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CategoryResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(@Query() queryDto: QueryCategoryDto) {
    return await this.categoryService.findAll(queryDto);
  }

  // Get Category by ID
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy ra category bằng Id',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy ra category bằng ID thành công',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy category',
  })
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    return await this.categoryService.findOne(id);
  }

  // Get Category by slug
  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Lấy category bằng slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết category',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy category',
  })
  async findBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto> {
    return await this.categoryService.findBySlug(slug);
  }

  // Update category
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Chỉnh sửa category',
  })
  @ApiBody({
    type: UpdateCategoryDto,
  })
  @ApiResponse({
    status: 200,
    description: 'category chỉnh sửa thành công',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy category',
  })
  @ApiResponse({
    status: 409,
    description: 'Category slug đã tồn tại',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return await this.categoryService.update(id, updateCategoryDto);
  }

  // Delete category (for ADMIN)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xoá Category (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Xoá thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thế xoá với sản phẩm',
  })
  async remove(@Param('id') id: string): Promise<{
    message: string;
  }> {
    return await this.categoryService.remove(id);
  }
}
