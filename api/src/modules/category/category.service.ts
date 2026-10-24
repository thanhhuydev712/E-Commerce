import {
  BadRequestException,
  Body,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CategoryResponseDto } from './dto/category-response.dto.js';
import { Category, Prisma } from '@prisma/client';
import { QueryCategoryDto } from './dto/query-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  // Create Category
  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const { name, slug, ...rest } = createCategoryDto;

    const categorySlug =
      slug ??
      name
        .toUpperCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');

    const existingCategory = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (existingCategory) {
      throw new NotFoundException('Category đã tồn tại: ' + categorySlug);
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        ...rest,
      },
    });
    return this.formatCategory(category, 0);
  }

  // Find All Category
  async findAll(queryDto: QueryCategoryDto): Promise<{
    data: CategoryResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { isActive, search, page = 1, limit = 10 } = queryDto;
    const where: Prisma.CategoryWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const total = await this.prisma.category.count({
      where,
    });

    const categories = await this.prisma.category.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            product: true,
          },
        },
      },
    });

    return {
      data: categories.map((category) =>
        this.formatCategory(category, category._count.product),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Find One by Id
  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: {
        id: id,
      },
      include: {
        _count: {
          select: {
            product: true,
          },
        },
      },
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy category');
    }

    return this.formatCategory(category, Number(category._count.product));
  }

  // Find by Slug
  async findBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: {
        slug: slug,
      },
      include: {
        _count: {
          select: {
            product: true,
          },
        },
      },
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy category');
    }

    return this.formatCategory(category, Number(category._count.product));
  }

  // Update category
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id: id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Không tìm thấy category');
    }

    if (
      updateCategoryDto.slug &&
      updateCategoryDto.slug !== existingCategory.slug
    ) {
      const slugTaken = await this.prisma.category.findUnique({
        where: {
          slug: updateCategoryDto.slug,
        },
      });

      if (slugTaken) {
        throw new NotFoundException('category đã tồn tài');
      }
    }

    const updateCategory = await this.prisma.category.update({
      where: {
        id,
      },
      data: updateCategoryDto,
      include: {
        _count: {
          select: {
            product: true,
          },
        },
      },
    });

    return this.formatCategory(
      updateCategory,
      Number(updateCategory._count.product),
    );
  }

  // Delete category
  async remove(id: string): Promise<{
    message: string;
  }> {
    const category = await this.prisma.category.findUnique({
      where: {
        id: id,
      },
      include: {
        _count: {
          select: {
            product: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy category');
    }

    if (category._count.product > 0) {
      throw new BadRequestException(
        `Không thể xoá category với ${category._count.product} sản phẩm`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      message: 'Xoá category thành công',
    };
  }

  private formatCategory(
    category: Category,
    productCount: number,
  ): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      imgUrl: category.imageUrl,
      isActive: category.isActive,
      productCount,
      createAt: category.createdAt,
      updateAt: category.updatedAt,
    };
  }
}
