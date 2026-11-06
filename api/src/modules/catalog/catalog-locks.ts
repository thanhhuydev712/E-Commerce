import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma-v2/index.js';
import type { DbTransaction } from '../../common/database.js';
export async function structureLock(tx: DbTransaction) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(20261106,2)`;
}
export async function catalogReadLock(tx: DbTransaction) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(20261106,2)`;
}
export async function productLock(
  tx: DbTransaction,
  schema: string,
  id: string,
) {
  await tx.$queryRaw(
    Prisma.sql`SELECT id FROM ${Prisma.raw(`"${schema}"."products"`)} WHERE id=${id}::uuid FOR UPDATE`,
  );
  const product = await tx.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundException('Product not found');
  return product;
}
