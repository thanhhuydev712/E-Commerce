import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProductResponseDto } from './dto/product-response.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { Category, Prisma, Product } from '@prisma/client';
import { QueryProDuctDto } from './dto/query-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Create product
  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    // 1. Kiểm tra SKU đã tồn tại chưa
    const existingSku = await this.prisma.product.findUnique({
      where: {
        sku: createProductDto.sku,
      },
    });

    if (existingSku) {
      throw new ConflictException(`SKU đã tồn tại: ${existingSku.sku}`);
    }

    // 2. Kiểm tra Category có tồn tại không
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        id: createProductDto.categoryId,
      },
    });

    if (!existingCategory) {
      throw new BadRequestException(
        `Category không tồn tại: ${createProductDto.categoryId}`,
      );
    }

    // 3. Tạo sản phẩm mới
    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,

        // Chuyển giá thành Prisma Decimal
        price: new Prisma.Decimal(createProductDto.price),
      },

      // Lấy thêm dữ liệu Category
      include: {
        category: true,
      },
    });

    // 4. Format dữ liệu trả về
    return this.formatPrice(product);
  }

  // get all products
  async findAll(queryDto: QueryProDuctDto): Promise<{
    data: ProductResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { category, isActive, search, page = 1, limit = 10 } = queryDto;

    const where: Prisma.ProductWhereInput = {};

    if (category) {
      where.categoryId = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        {
          name: { contains: search, mode: 'insensitive' },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const total = await this.prisma.product.count({ where });

    const products = await this.prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    });

    return {
      data: products.map((product) => this.formatPrice(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return this.formatPrice(product);
  }

  // Update product
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phầm');
    }

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const skuTaken = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });

      if (skuTaken) {
        throw new ConflictException(
          `Đã tồn tại sản phẩm có SKU là: ${updateProductDto.sku}`,
        );
      }
    }

    const updateData: any = await { ...updateProductDto };
    if (updateProductDto.price !== undefined) {
      updateData.price = new Prisma.Decimal(updateProductDto.price);
    }

    const updateProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return this.formatPrice(updateProduct);
  }

  // Update stock
  async updateStock(id: string, quantity: number): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const newStock = product.stock + quantity;

    if (newStock < 0) {
      throw new BadRequestException('Tồn kho không được < 0 ');
    }

    const updateStock = await this.prisma.product.update({
      where: { id },
      data: {
        stock: newStock,
      },
      include: {
        category: true,
      },
    });

    return this.formatPrice(updateStock);
  }

  // Delete product
  async delete(id: string): Promise<{ message: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
        cartItems: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    if (product.orderItems.length > 0) {
      throw new BadRequestException(
        'Không thể xoá sản phẩm tồn tại trong giỏ hàng or hoá đơn',
      );
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return {
      message: 'Xoá sản phẩm thành công',
    };
  }

  private formatPrice(
    product: Product & { category: Category },
  ): ProductResponseDto {
    return {
      ...product,
      price: Number(product.price),
      category: product.category.name,
    };
  }
}
