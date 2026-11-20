import { describe, expect, it, vi } from 'vitest';
import { productLock } from './catalog-locks.js';
import type { DbTransaction } from '../../common/database.js';

function fixture(exists = true) {
  const product = { id: '00000000-0000-0000-0000-000000000001' };
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(1),
    product: { findUnique: vi.fn().mockResolvedValue(exists ? product : null) },
  };
  return { tx, product, db: tx as unknown as DbTransaction };
}

describe('Catalog locking for interactive preview', () => {
  it('keeps the normal commerce row lock unless explicitly opted in', async () => {
    const { tx, product, db } = fixture();
    await expect(productLock(db, 'public', product.id)).resolves.toEqual(
      product,
    );
    expect(tx.$queryRaw.mock.calls[0][0].sql).toContain('FOR UPDATE');
    expect(tx.$queryRaw.mock.calls[0][0].sql).not.toContain('advisory');
    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });
  it('serializes immutable demo products with a transaction advisory lock without UPDATE privileges', async () => {
    const { tx, product, db } = fixture();
    await productLock(db, 'public', product.id, true);
    const statement = tx.$executeRaw.mock.calls[0][0];
    expect(statement.sql).toContain('pg_advisory_xact_lock');
    expect(statement.sql).not.toContain('FOR UPDATE');
    expect(statement.values).toEqual([`public:demo-product:${product.id}`]);
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.product.findUnique).toHaveBeenCalledWith({
      where: { id: product.id },
    });
  });
  it('still rejects missing products in either locking mode', async () => {
    for (const interactive of [false, true]) {
      const { product, db } = fixture(false);
      await expect(
        productLock(db, 'public', product.id, interactive),
      ).rejects.toThrow('Product not found');
    }
  });
});
