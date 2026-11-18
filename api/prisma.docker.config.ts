// Chỉ cho database Docker mới; không dùng để migrate database hiện hữu.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/docker-migrations' },
  datasource: { url: env('DATABASE_URL') },
});
