import 'dotenv/config';
import { PrismaClient } from '../../../generated/prisma-v2/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedAccess } from './access.seed.js';
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const schema =
    process.env.DATABASE_SCHEMA ??
    new URL(process.env.DATABASE_URL).searchParams.get('schema') ??
    'public';
  if (!/^[a-z][a-z0-9_]*$/.test(schema) || schema === 'legacy_v1')
    throw new Error('Invalid schema');
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: process.env.DATABASE_URL },
      { schema },
    ),
  });
  try {
    console.log(JSON.stringify(await seedAccess(prisma)));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error: unknown) => {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : 'UNKNOWN';
  console.error(JSON.stringify({ event: 'access_seed_failed', code }));
  process.exitCode = 1;
});
