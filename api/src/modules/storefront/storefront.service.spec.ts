import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { StorefrontService } from './storefront.service.js';

function fixture() {
  const variant = {
    id: 'sku-id',
    sku: 'SKU',
    label: 'Default',
    price: '100000',
    oldPrice: null,
    stock: 3,
  };
  const rows = [
    {
      id: 'product-id',
      slug: 'pc',
      name: 'PC',
      brand: null,
      category: 'computers',
      image: null,
      variants: [variant],
      attributes: {},
      reviews: [],
    },
  ];
  const raw = vi
    .fn()
    .mockImplementation(async (query: { sql: string }) =>
      query.sql.includes('p.published_at')
        ? rows
        : [{ id: 'category-id', slug: 'computers', name: 'Computers' }],
    );
  const db = {
    schema: 'test',
    $queryRaw: raw,
    storeSetting: { findUnique: vi.fn().mockResolvedValue({ value: {} }) },
    banner: { findMany: vi.fn().mockResolvedValue([]) },
    collection: { findMany: vi.fn().mockResolvedValue([]) },
    article: { findMany: vi.fn().mockResolvedValue([]) },
    contentPage: { findMany: vi.fn().mockResolvedValue([]) },
  };
  return {
    db,
    raw,
    variant,
    service: new StorefrontService(db as unknown as PrismaService),
  };
}

describe('Storefront snapshot', () => {
  it('starts independent content reads while the catalog query is still pending', async () => {
    const { db, raw, service } = fixture();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    raw.mockImplementationOnce(async () => {
      await gate;
      return [];
    });
    const pending = service.snapshot();
    try {
      expect(db.storeSetting.findUnique).toHaveBeenCalledOnce();
      expect(db.banner.findMany).toHaveBeenCalledOnce();
      expect(db.collection.findMany).toHaveBeenCalledOnce();
      expect(db.article.findMany).toHaveBeenCalledOnce();
      expect(db.contentPage.findMany).toHaveBeenCalledOnce();
      expect(raw).toHaveBeenCalledTimes(2);
    } finally {
      release();
      await pending;
    }
  });

  it('reads current prices and stock on every request and preserves the public shape', async () => {
    const { service, variant } = fixture();
    const first = await service.snapshot();
    expect(first.products[0]).toMatchObject({
      id: 'pc',
      databaseId: 'product-id',
      price: '100000',
      stock: 3,
    });
    expect(first.categories[0]).toMatchObject({
      id: 'computers',
      databaseId: 'category-id',
    });
    variant.price = '120000';
    variant.stock = 1;
    const second = await service.snapshot();
    expect(second.products[0]).toMatchObject({
      price: '120000',
      oldPrice: '120000',
      stock: 1,
    });
    expect(first.products[0].price).toBe('100000');
  });

  it('rejects incomplete snapshots when an independent read fails', async () => {
    const { db, service } = fixture();
    db.banner.findMany.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(service.snapshot()).rejects.toThrow('database unavailable');
  });
});
