import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Cho phép NestJS quản lý Service
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Tạo adapter giúp Prisma giao tiếp với PostgreSQL.
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  // Kết nối Database
  async onModuleInit() {
    await this.$connect();
    console.log('database connect successfully');
  }

  // Ngắt kết nối
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('database disconnected');
  }

  // Xóa dữ liệu trong database
  async cleanDatabase() {
    // Ngăn việc xóa database trên môi trường production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Lấy danh sách các thuộc tính của PrismaService
    const models = Reflect.ownKeys(this);

    // Duyệt qua danh sách thuộc tính
    return Promise.all(
      models.map(async (modelKey) => {
        // Chỉ xử lý các key có kiểu string
        if (typeof modelKey !== 'string') return;

        // Ép kiểu để TypeScript cho phép truy cập thuộc tính động
        const model = (this as unknown as Record<string, unknown>)[modelKey];

        // Kiểm tra đây có phải đối tượng hỗ trợ deleteMany không
        if (
          model !== null &&
          typeof model === 'object' &&
          'deleteMany' in model &&
          typeof model.deleteMany === 'function'
        ) {
          // Xóa tất cả bản ghi của model
          await model.deleteMany();
        }
      }),
    );
  }
}
