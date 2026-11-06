import { Prisma } from '../../generated/prisma-v2/index.js';
export type DbTransaction = Prisma.TransactionClient;
export async function lockUser(tx: DbTransaction, schema: string, id: string) {
  // schema comes only from validated environment; never from a request.
  const table = Prisma.raw(`"${schema}"."users"`);
  return tx.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT id FROM ${table} WHERE id=${id}::uuid FOR UPDATE`,
  );
}
