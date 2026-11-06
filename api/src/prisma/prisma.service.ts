import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma-v2/index.js';
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  readonly schema: string;
  constructor(@Inject(ConfigService) config: ConfigService) {
    super({
      transactionOptions: { maxWait: 10000, timeout: 15000 },
      adapter: new PrismaPg(
        {
          connectionString: config.getOrThrow<string>('DATABASE_URL'),
          connectionTimeoutMillis: 15000,
          statement_timeout: 15000,
        },
        { schema: config.getOrThrow<string>('DATABASE_SCHEMA') },
      ),
    });
    this.schema = config.getOrThrow<string>('DATABASE_SCHEMA');
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
