import type { Prisma } from '../../../generated/prisma-v2/index.js';
import type { DbTransaction } from '../../common/database.js';
import { visibleCategoryIds } from './catalog.rules.js';
export async function publicCatalogScope(
  tx: DbTransaction,
): Promise<{ where: Prisma.ProductWhereInput; visibleIds: Set<string> }> {
  // A transaction uses one pg client: do not execute parallel queries on it.
  const nodes = await tx.category.findMany({
    select: { id: true, parentId: true, status: true },
  });
  const currency = await tx.currency.findUnique({ where: { code: 'VND' } });
  const ids = visibleCategoryIds(nodes),
    visibleIds = new Set(ids);
  if (!currency?.isActive || currency.minorUnit !== 0)
    return { where: { id: { in: [] } }, visibleIds };
  return {
    visibleIds,
    where: {
      status: 'ACTIVE',
      publishedAt: { not: null, lte: new Date() },
      productCategories: { some: { isPrimary: true, categoryId: { in: ids } } },
      OR: [{ brandId: null }, { brand: { status: 'ACTIVE' } }],
      productVariants: {
        some: {
          status: 'ACTIVE',
          variantPrices: { some: { currencyCode: 'VND' } },
        },
      },
    },
  };
}
export const productInclude = {
  brand: { select: { id: true, name: true, slug: true } },
  productCategories: {
    include: {
      category: { select: { id: true, name: true, slug: true, status: true } },
    },
  },
  productOptions: {
    orderBy: { sortOrder: 'asc' },
    include: { productOptionValues: { orderBy: { sortOrder: 'asc' } } },
  },
  productAttributeValues: { include: { attribute: true } },
  productMedia: {
    where: {
      asset: { status: 'READY' },
      OR: [{ variantId: null }, { variant: { status: 'ACTIVE' } }],
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      asset: {
        select: { id: true, mimeType: true, width: true, height: true },
      },
    },
  },
  productVariants: {
    where: {
      status: 'ACTIVE',
      variantPrices: { some: { currencyCode: 'VND' } },
    },
    orderBy: { sku: 'asc' },
    include: {
      variantPrices: { where: { currencyCode: 'VND' } },
      inventoryBalances: {
        where: { warehouse: { status: 'ACTIVE' } },
        select: { onHand: true, reserved: true, unavailable: true },
      },
      variantOptionValues: {
        include: { value: { select: { id: true, code: true, label: true } } },
      },
      variantAttributeValues: { include: { attribute: true } },
    },
  },
} satisfies Prisma.ProductInclude;
type ProductRecord = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;
export function productView(row: ProductRecord, visibleIds?: Set<string>) {
  const attribute = (
    item: ProductRecord['productAttributeValues'][number],
  ) => ({
    attributeId: item.attributeId,
    code: item.attribute.code,
    name: item.attribute.name,
    unit: item.attribute.unit,
    dataType: item.attribute.dataType,
    value: item.textValue ?? item.numberValue?.toString() ?? item.booleanValue,
  });
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    brand: row.brand,
    categories: row.productCategories
      .filter(
        (item) =>
          item.category.status === 'ACTIVE' &&
          (!visibleIds || visibleIds.has(item.categoryId)),
      )
      .map((item) => ({
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
        isPrimary: item.isPrimary,
      })),
    options: row.productOptions.map((option) => ({
      id: option.id,
      code: option.code,
      name: option.name,
      values: option.productOptionValues.map((value) => ({
        id: value.id,
        code: value.code,
        label: value.label,
      })),
    })),
    attributes: row.productAttributeValues.map(attribute),
    media: row.productMedia.map((item) => ({
      id: item.id,
      assetId: item.assetId,
      variantId: item.variantId,
      url: `/api/v1/media/${item.assetId}`,
      altText: item.altText,
      isPrimary: item.isPrimary,
      width: item.asset.width,
      height: item.asset.height,
    })),
    variants: row.productVariants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      weightGrams: variant.weightGrams,
      price: {
        amount: variant.variantPrices[0].amount.toString(),
        currency: 'VND',
        compareAtAmount:
          variant.variantPrices[0].compareAtAmount?.toString() ?? null,
      },
      available: variant.inventoryBalances.reduce(
        (sum, balance) =>
          sum + balance.onHand - balance.reserved - balance.unavailable,
        0,
      ),
      optionValues: variant.variantOptionValues.map((item) => item.value),
      attributes: variant.variantAttributeValues.map((item) => ({
        attributeId: item.attributeId,
        code: item.attribute.code,
        name: item.attribute.name,
        unit: item.attribute.unit,
        dataType: item.attribute.dataType,
        value:
          item.textValue ?? item.numberValue?.toString() ?? item.booleanValue,
      })),
    })),
    publishedAt: row.publishedAt,
  };
}
