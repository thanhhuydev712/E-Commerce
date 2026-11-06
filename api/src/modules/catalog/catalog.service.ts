import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma-v2/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { DbTransaction } from '../../common/database.js';
import { productLock, structureLock } from './catalog-locks.js';
import { optionSignature, visibleCategoryIds, vnd } from './catalog.rules.js';
import {
  publicCatalogScope,
  productInclude,
  productView,
} from './catalog-read.js';
import type {
  ProductQuery,
  CreateBrandDto,
  UpdateBrandDto,
  CategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  AssignCategoriesDto,
  CreateOptionDto,
  CreateVariantDto,
  UpdateVariantDto,
  AttributeDefinitionDto,
  CategoryAttributesDto,
  AttributeValuesDto,
  AttributeValueDto,
  LinkMediaDto,
} from './catalog.dto.js';

const adminInclude = {
  ...productInclude,
  productMedia: {
    include: {
      asset: {
        select: {
          id: true,
          status: true,
          mimeType: true,
          width: true,
          height: true,
        },
      },
    },
  },
  productVariants: { ...productInclude.productVariants, where: undefined },
} satisfies Prisma.ProductInclude;
@Injectable()
export class CatalogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  private audit(
    tx: DbTransaction,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
  ) {
    return tx.auditLog.create({
      data: { actorId, actorType: 'USER', action, entityType, entityId },
    });
  }
  private async readyAsset(tx: DbTransaction, id: string | null | undefined) {
    if (
      id &&
      !(await tx.mediaAsset.findFirst({ where: { id, status: 'READY' } }))
    )
      throw new BadRequestException('Media must be READY');
  }
  private async productReferences(tx: DbTransaction, dto: UpdateProductDto) {
    if (
      dto.brandId &&
      !(await tx.brand.findUnique({ where: { id: dto.brandId } }))
    )
      throw new BadRequestException('Unknown brand');
    if (
      dto.taxClassId &&
      !(await tx.taxClass.findUnique({ where: { id: dto.taxClassId } }))
    )
      throw new BadRequestException('Unknown tax class');
  }
  async brands(admin = false) {
    const rows = await this.prisma.brand.findMany({
      where: admin ? {} : { status: 'ACTIVE' },
      include: { logoAsset: { select: { id: true, status: true } } },
      orderBy: { name: 'asc' },
    });
    return rows.map(({ logoAsset, ...row }) => ({
      ...row,
      logoUrl:
        logoAsset?.status === 'READY' ? `/api/v1/media/${logoAsset.id}` : null,
    }));
  }
  async categories(admin = false) {
    return this.prisma.$transaction(
      async (tx) => {
        const rows = await tx.category.findMany({
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: { imageAsset: { select: { id: true, status: true } } },
          }),
          ids = new Set(visibleCategoryIds(rows));
        return rows
          .filter((row) => admin || ids.has(row.id))
          .map(({ imageAsset, ...row }) => ({
            ...row,
            imageUrl:
              imageAsset?.status === 'READY'
                ? `/api/v1/media/${imageAsset.id}`
                : null,
          }));
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }
  async products(query: ProductQuery, admin = false) {
    const min = query.minPrice === undefined ? undefined : vnd(query.minPrice),
      max = query.maxPrice === undefined ? undefined : vnd(query.maxPrice);
    if (min !== undefined && max !== undefined && min > max)
      throw new BadRequestException('Price range is reversed');
    return this.prisma.$transaction(
      async (tx) => {
        const scope = await publicCatalogScope(tx),
          base = admin ? {} : scope.where;
        const where: Prisma.ProductWhereInput = {
          AND: [
            base,
            ...(query.q
              ? [
                  {
                    OR: [
                      {
                        name: {
                          contains: query.q,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        productVariants: {
                          some: {
                            ...(admin ? {} : { status: 'ACTIVE' }),
                            sku: {
                              contains: query.q,
                              mode: 'insensitive' as const,
                            },
                          },
                        },
                      },
                    ],
                  },
                ]
              : []),
            ...(query.brandId ? [{ brandId: query.brandId }] : []),
            ...(query.categoryId
              ? [
                  {
                    productCategories: {
                      some: { categoryId: query.categoryId },
                    },
                  },
                ]
              : []),
            ...(min !== undefined || max !== undefined
              ? [
                  {
                    productVariants: {
                      some: {
                        status: 'ACTIVE',
                        variantPrices: {
                          some: {
                            currencyCode: 'VND',
                            amount: { gte: min, lte: max },
                          },
                        },
                      },
                    },
                  },
                ]
              : []),
          ],
        };
        const rows = await tx.product.findMany({
          where,
          include: productInclude,
          orderBy:
            query.sort === 'name'
              ? [{ name: 'asc' }, { id: 'asc' }]
              : [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        });
        const total = await tx.product.count({ where });
        return {
          items: rows.map((row) => ({
            ...productView(row, admin ? undefined : scope.visibleIds),
            ...(admin ? { status: row.status } : {}),
          })),
          total,
          page: query.page,
          limit: query.limit,
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }
  async product(slug: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const scope = await publicCatalogScope(tx),
          row = await tx.product.findFirst({
            where: { AND: [scope.where, { slug }] },
            include: productInclude,
          });
        if (!row) throw new NotFoundException('Published product not found');
        return productView(row, scope.visibleIds);
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }
  async adminProduct(id: string) {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: adminInclude,
    });
    if (!row) throw new NotFoundException('Product not found');
    return {
      ...row,
      productAttributeValues: row.productAttributeValues.map((item) => ({
        ...item,
        numberValue: item.numberValue?.toString() ?? null,
      })),
      productVariants: row.productVariants.map((variant) => ({
        ...variant,
        variantAttributeValues: variant.variantAttributeValues.map((item) => ({
          ...item,
          numberValue: item.numberValue?.toString() ?? null,
        })),
      })),
    };
  }
  async saveBrand(
    actor: string,
    dto: CreateBrandDto | UpdateBrandDto,
    id?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      await this.readyAsset(tx, dto.logoAssetId);
      const data = {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        logoAssetId: dto.logoAssetId,
      };
      const row = id
        ? await tx.brand.update({ where: { id }, data })
        : await tx.brand.create({
            data: {
              ...data,
              name: (dto as CreateBrandDto).name,
              slug: (dto as CreateBrandDto).slug,
              status: 'ACTIVE',
            },
          });
      await this.audit(tx, actor, 'BRAND_SAVE', 'BRAND', row.id);
      return row;
    });
  }
  async brandStatus(actor: string, id: string, status: string) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      const row = await tx.brand.update({ where: { id }, data: { status } });
      await this.audit(tx, actor, 'BRAND_STATUS', 'BRAND', id);
      return row;
    });
  }
  async saveCategory(
    actor: string,
    dto: CategoryDto | UpdateCategoryDto,
    id?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      await this.readyAsset(tx, dto.imageAssetId);
      if (id && dto.parentId?.toLowerCase() === id)
        throw new BadRequestException('Category cannot be its own parent');
      if (
        dto.parentId &&
        !(await tx.category.findUnique({ where: { id: dto.parentId } }))
      )
        throw new BadRequestException('Unknown parent');
      const data = {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        parentId: dto.parentId,
        imageAssetId: dto.imageAssetId,
        sortOrder: dto.sortOrder,
      };
      const row = id
        ? await tx.category.update({ where: { id }, data })
        : await tx.category.create({
            data: {
              ...data,
              name: (dto as CategoryDto).name,
              slug: (dto as CategoryDto).slug,
              sortOrder: dto.sortOrder ?? 0,
              status: 'ACTIVE',
            },
          });
      visibleCategoryIds(
        await tx.category.findMany({
          select: { id: true, parentId: true, status: true },
        }),
        true,
      );
      await this.audit(tx, actor, 'CATEGORY_SAVE', 'CATEGORY', row.id);
      return row;
    });
  }
  async categoryStatus(actor: string, id: string, status: string) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      const row = await tx.category.update({ where: { id }, data: { status } });
      await this.audit(tx, actor, 'CATEGORY_STATUS', 'CATEGORY', id);
      return row;
    });
  }
  async saveProduct(
    actor: string,
    dto: CreateProductDto | UpdateProductDto,
    id?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      if (id) await productLock(tx, this.prisma.schema, id);
      await this.productReferences(tx, dto);
      const data = {
        name: dto.name,
        slug: dto.slug,
        summary: dto.summary,
        description: dto.description,
        brandId: dto.brandId,
        taxClassId: dto.taxClassId,
      };
      const row = id
        ? await tx.product.update({ where: { id }, data })
        : await tx.product.create({
            data: {
              ...data,
              name: (dto as CreateProductDto).name,
              slug: (dto as CreateProductDto).slug,
              status: 'DRAFT',
            },
          });
      if (row.status === 'ACTIVE') await this.assertPublishable(tx, row.id);
      await this.audit(tx, actor, 'PRODUCT_SAVE', 'PRODUCT', row.id);
      return row;
    });
  }
  async transition(
    actor: string,
    id: string,
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
  ) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      await productLock(tx, this.prisma.schema, id);
      if (status === 'ACTIVE') await this.assertPublishable(tx, id);
      if (
        status === 'ARCHIVED' &&
        (await tx.inventoryBalance.findFirst({
          where: { variant: { productId: id }, reserved: { gt: 0 } },
        }))
      )
        throw new ConflictException('Product has reserved stock');
      const row = await tx.product.update({
        where: { id },
        data: {
          status,
          publishedAt: status === 'ACTIVE' ? new Date() : undefined,
          archivedAt: status === 'ARCHIVED' ? new Date() : null,
        },
      });
      await this.audit(tx, actor, `PRODUCT_${status}`, 'PRODUCT', id);
      return row;
    });
  }
  async assignCategories(actor: string, id: string, dto: AssignCategoriesDto) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      const product = await productLock(tx, this.prisma.schema, id);
      const ids = dto.categoryIds.map((value) => value.toLowerCase()),
        primary = dto.primaryCategoryId.toLowerCase();
      if (
        new Set(ids).size !== ids.length ||
        !ids.includes(primary) ||
        (await tx.category.count({ where: { id: { in: ids } } })) !== ids.length
      )
        throw new BadRequestException(
          'Categories or primary category are invalid',
        );
      await tx.productCategory.deleteMany({ where: { productId: id } });
      await tx.productCategory.createMany({
        data: ids.map((categoryId) => ({
          productId: id,
          categoryId,
          isPrimary: categoryId === primary,
        })),
      });
      if (product.status === 'ACTIVE') await this.assertPublishable(tx, id);
      await this.audit(tx, actor, 'PRODUCT_CATEGORIES_SET', 'PRODUCT', id);
      return { productId: id, categoryIds: ids, primaryCategoryId: primary };
    });
  }
  async createOption(actor: string, id: string, dto: CreateOptionDto) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      const product = await productLock(tx, this.prisma.schema, id);
      if (product.status !== 'DRAFT')
        throw new ConflictException(
          'Options can only change on draft products',
        );
      if ((await tx.productOption.count({ where: { productId: id } })) >= 10)
        throw new BadRequestException('At most 10 options per product');
      if (
        new Set(dto.values.map((value) => value.code)).size !==
        dto.values.length
      )
        throw new BadRequestException('Duplicate option codes');
      const row = await tx.productOption.create({
        data: {
          productId: id,
          code: dto.code,
          name: dto.name,
          sortOrder: await tx.productOption.count({ where: { productId: id } }),
          productOptionValues: {
            create: dto.values.map((value, index) => ({
              code: value.code,
              label: value.label,
              sortOrder: index,
            })),
          },
        },
        include: { productOptionValues: true },
      });
      await this.audit(tx, actor, 'OPTION_CREATE', 'PRODUCT', id);
      return row;
    });
  }
  private async selections(
    tx: DbTransaction,
    productId: string,
    ids: string[],
  ) {
    const options = await tx.productOption.findMany({ where: { productId } }),
      values = await tx.productOptionValue.findMany({
        where: { id: { in: ids }, option: { productId } },
      });
    if (
      values.length !== ids.length ||
      new Set(ids.map((id) => id.toLowerCase())).size !== ids.length ||
      values.length !== options.length ||
      new Set(values.map((value) => value.optionId)).size !== options.length
    )
      throw new BadRequestException(
        'Select exactly one value from every option belonging to this product',
      );
    return values;
  }
  async createVariant(actor: string, id: string, dto: CreateVariantDto) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      const product = await productLock(tx, this.prisma.schema, id);
      if (product.status !== 'DRAFT')
        throw new ConflictException('Create variants while product is draft');
      if ((await tx.productVariant.count({ where: { productId: id } })) >= 100)
        throw new BadRequestException('At most 100 variants per product');
      const values = await this.selections(tx, id, dto.optionValueIds ?? []);
      const row = await tx.productVariant.create({
        data: {
          productId: id,
          sku: dto.sku,
          name: dto.name,
          barcode: dto.barcode,
          weightGrams: dto.weightGrams,
          optionSignature: optionSignature(values.map((value) => value.id)),
          status: 'ACTIVE',
          variantOptionValues: {
            create: values.map((value) => ({
              optionId: value.optionId,
              valueId: value.id,
            })),
          },
        },
      });
      await this.audit(tx, actor, 'VARIANT_CREATE', 'VARIANT', row.id);
      return row;
    });
  }
  async updateVariant(actor: string, id: string, dto: UpdateVariantDto) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      const variant = await tx.productVariant.findUnique({ where: { id } });
      if (!variant) throw new NotFoundException('Variant not found');
      const product = await productLock(
        tx,
        this.prisma.schema,
        variant.productId,
      );
      const values =
        dto.optionValueIds === undefined
          ? undefined
          : await this.selections(tx, variant.productId, dto.optionValueIds);
      if (values && product.status !== 'DRAFT')
        throw new ConflictException(
          'Option selections can only change on draft products',
        );
      if (values)
        await tx.variantOptionValue.deleteMany({ where: { variantId: id } });
      const row = await tx.productVariant.update({
        where: { id },
        data: {
          name: dto.name,
          barcode: dto.barcode,
          weightGrams: dto.weightGrams,
          optionSignature: values
            ? optionSignature(values.map((value) => value.id))
            : undefined,
          ...(values
            ? {
                variantOptionValues: {
                  create: values.map((value) => ({
                    optionId: value.optionId,
                    valueId: value.id,
                  })),
                },
              }
            : {}),
        },
      });
      if (product.status === 'ACTIVE')
        await this.assertPublishable(tx, product.id);
      await this.audit(tx, actor, 'VARIANT_UPDATE', 'VARIANT', id);
      return row;
    });
  }
  async variantStatus(actor: string, id: string, status: string) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      const variant = await tx.productVariant.findUnique({ where: { id } });
      if (!variant) throw new NotFoundException('Variant not found');
      const product = await productLock(
        tx,
        this.prisma.schema,
        variant.productId,
      );
      if (
        status === 'ARCHIVED' &&
        (await tx.inventoryBalance.findFirst({
          where: { variantId: id, reserved: { gt: 0 } },
        }))
      )
        throw new ConflictException('Variant has reserved stock');
      const row = await tx.productVariant.update({
        where: { id },
        data: { status, archivedAt: status === 'ARCHIVED' ? new Date() : null },
      });
      if (product.status === 'ACTIVE')
        await this.assertPublishable(tx, product.id);
      await this.audit(tx, actor, 'VARIANT_STATUS', 'VARIANT', id);
      return row;
    });
  }
  definitions() {
    return this.prisma.attributeDefinition.findMany({
      orderBy: { code: 'asc' },
    });
  }
  createDefinition(actor: string, dto: AttributeDefinitionDto) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.attributeDefinition.create({
        data: {
          code: dto.code,
          name: dto.name,
          dataType: dto.dataType,
          unit: dto.unit,
          isFilterable: dto.isFilterable,
        },
      });
      await this.audit(tx, actor, 'ATTRIBUTE_DEFINE', 'ATTRIBUTE', row.id);
      return row;
    });
  }
  async categoryAttributes(
    actor: string,
    id: string,
    dto: CategoryAttributesDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      if (!(await tx.category.findUnique({ where: { id } })))
        throw new NotFoundException('Category not found');
      if (
        await tx.productCategory.findFirst({
          where: { categoryId: id, product: { status: 'ACTIVE' } },
        })
      )
        throw new ConflictException(
          'Unpublish affected products before changing required attributes',
        );
      const ids = dto.attributes.map((item) => item.attributeId.toLowerCase());
      if (
        new Set(ids).size !== ids.length ||
        (await tx.attributeDefinition.count({ where: { id: { in: ids } } })) !==
          ids.length
      )
        throw new BadRequestException('Unknown or duplicate attributes');
      await tx.categoryAttribute.deleteMany({ where: { categoryId: id } });
      if (ids.length)
        await tx.categoryAttribute.createMany({
          data: dto.attributes.map((item, index) => ({
            categoryId: id,
            attributeId: item.attributeId,
            isRequired: item.isRequired,
            sortOrder: index,
          })),
        });
      await this.audit(tx, actor, 'CATEGORY_ATTRIBUTES_SET', 'CATEGORY', id);
      return { categoryId: id, attributes: dto.attributes };
    });
  }
  private async typedAttributes(tx: DbTransaction, items: AttributeValueDto[]) {
    const definitions = await tx.attributeDefinition.findMany({
      where: { id: { in: items.map((item) => item.attributeId) } },
    });
    if (definitions.length !== items.length)
      throw new BadRequestException('Unknown or duplicate attribute');
    return items.map((item) => {
      const definition = definitions.find(
        (value) => value.id === item.attributeId.toLowerCase(),
      )!;
      const count = [
        item.textValue,
        item.numberValue,
        item.booleanValue,
      ].filter((value) => value !== undefined && value !== null).length;
      if (
        count !== 1 ||
        (definition.dataType === 'TEXT' &&
          typeof item.textValue !== 'string') ||
        (definition.dataType === 'NUMBER' &&
          typeof item.numberValue !== 'string') ||
        (definition.dataType === 'BOOLEAN' &&
          typeof item.booleanValue !== 'boolean')
      )
        throw new BadRequestException(
          'Attribute value must match its declared type',
        );
      return {
        attributeId: definition.id,
        textValue: item.textValue ?? null,
        numberValue:
          item.numberValue == null
            ? null
            : new Prisma.Decimal(item.numberValue),
        booleanValue: item.booleanValue ?? null,
      };
    });
  }
  async setAttributes(
    actor: string,
    id: string,
    dto: AttributeValuesDto,
    variant = false,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      const owner = variant
        ? await tx.productVariant.findUnique({ where: { id } })
        : null;
      if (variant && !owner) throw new NotFoundException('Variant not found');
      const product = await productLock(
        tx,
        this.prisma.schema,
        owner?.productId ?? id,
      );
      const values = await this.typedAttributes(tx, dto.attributes);
      if (variant) {
        await tx.variantAttributeValue.deleteMany({ where: { variantId: id } });
        if (values.length)
          await tx.variantAttributeValue.createMany({
            data: values.map((value) => ({ ...value, variantId: id })),
          });
      } else {
        await tx.productAttributeValue.deleteMany({ where: { productId: id } });
        if (values.length)
          await tx.productAttributeValue.createMany({
            data: values.map((value) => ({ ...value, productId: id })),
          });
      }
      if (product.status === 'ACTIVE')
        await this.assertPublishable(tx, product.id);
      await this.audit(
        tx,
        actor,
        'ATTRIBUTE_VALUES_SET',
        variant ? 'VARIANT' : 'PRODUCT',
        id,
      );
      return { id, updated: values.length };
    });
  }
  async linkMedia(actor: string, id: string, dto: LinkMediaDto) {
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      await productLock(tx, this.prisma.schema, id);
      await this.readyAsset(tx, dto.assetId);
      if (
        dto.variantId &&
        !(await tx.productVariant.findFirst({
          where: { id: dto.variantId, productId: id },
        }))
      )
        throw new BadRequestException('Variant does not belong to product');
      const variantId = dto.variantId ?? null;
      if (dto.isPrimary)
        await tx.productMedia.updateMany({
          where: { productId: id, variantId, isPrimary: true },
          data: { isPrimary: false },
        });
      const row = await tx.productMedia.upsert({
        where: { productId_assetId: { productId: id, assetId: dto.assetId } },
        create: {
          productId: id,
          assetId: dto.assetId,
          variantId,
          altText: dto.altText,
          isPrimary: dto.isPrimary,
          sortOrder: dto.sortOrder,
        },
        update: {
          variantId,
          altText: dto.altText,
          isPrimary: dto.isPrimary,
          sortOrder: dto.sortOrder,
        },
      });
      await this.audit(tx, actor, 'PRODUCT_MEDIA_LINK', 'PRODUCT', id);
      return row;
    });
  }
  private async assertPublishable(tx: DbTransaction, id: string) {
    const row = await tx.product.findUniqueOrThrow({
      where: { id },
      include: {
        brand: true,
        productCategories: {
          include: { category: { include: { categoryAttributes: true } } },
        },
        productVariants: {
          where: { status: 'ACTIVE' },
          include: {
            variantPrices: { where: { currencyCode: 'VND' } },
            variantOptionValues: true,
            variantAttributeValues: true,
          },
        },
        productAttributeValues: true,
        productOptions: true,
      },
    });
    const currency = await tx.currency.findUnique({ where: { code: 'VND' } }),
      visible = new Set(
        visibleCategoryIds(
          await tx.category.findMany({
            select: { id: true, parentId: true, status: true },
          }),
        ),
      );
    if (
      !currency?.isActive ||
      currency.minorUnit !== 0 ||
      !row.productVariants.length ||
      row.brand?.status === 'ARCHIVED' ||
      row.productCategories.filter(
        (item) => item.isPrimary && visible.has(item.categoryId),
      ).length !== 1
    )
      throw new ConflictException(
        'Publish requires active currency, brand/category path and at least one variant',
      );
    const required = new Set(
      row.productCategories.flatMap((item) =>
        item.category.categoryAttributes
          .filter((attribute) => attribute.isRequired)
          .map((attribute) => attribute.attributeId),
      ),
    );
    for (const variant of row.productVariants) {
      if (!variant.variantPrices.length)
        throw new ConflictException(
          'Every active variant requires a VND price',
        );
      const selected = variant.variantOptionValues,
        options = new Set(row.productOptions.map((option) => option.id));
      if (
        selected.length !== options.size ||
        selected.some((item) => !options.has(item.optionId)) ||
        new Set(selected.map((item) => item.optionId)).size !== options.size ||
        variant.optionSignature !==
          optionSignature(selected.map((item) => item.valueId))
      )
        throw new ConflictException(
          'Variant option selections are incomplete or inconsistent',
        );
      const actual = new Set(
        [...row.productAttributeValues, ...variant.variantAttributeValues].map(
          (item) => item.attributeId,
        ),
      );
      if ([...required].some((attribute) => !actual.has(attribute)))
        throw new ConflictException(
          'Required product/variant attributes are missing',
        );
    }
  }
}
