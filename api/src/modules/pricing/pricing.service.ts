import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma-v2/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { productLock, structureLock } from '../catalog/catalog-locks.js';
import { vnd } from '../catalog/catalog.rules.js';
import type { SetPriceDto, TaxClassDto, TaxRateDto } from './pricing.dto.js';
@Injectable()
export class PricingService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  currencies() {
    return this.prisma.currency.findMany({
      where: { isActive: true, code: 'VND' },
      select: { code: true, name: true, minorUnit: true },
    });
  }
  async setPrice(actorId: string, id: string, dto: SetPriceDto) {
    const amount = vnd(dto.amount),
      compareAtAmount =
        dto.compareAtAmount == null ? null : vnd(dto.compareAtAmount);
    if (compareAtAmount !== null && compareAtAmount < amount)
      throw new BadRequestException(
        'Compare-at price cannot be below selling price',
      );
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({ where: { id } });
      if (!variant) throw new NotFoundException('Variant not found');
      const product = await productLock(
        tx,
        this.prisma.schema,
        variant.productId,
      );
      const currentVariant = await tx.productVariant.findUniqueOrThrow({
        where: { id },
      });
      if (product.status === 'ARCHIVED' || currentVariant.status !== 'ACTIVE')
        throw new ConflictException('Archived catalog cannot be repriced');
      const currency = await tx.currency.findUnique({ where: { code: 'VND' } });
      if (!currency?.isActive || currency.minorUnit !== 0)
        throw new ServiceUnavailableException('VND is not configured');
      const previous = await tx.variantPrice.findUnique({
        where: {
          variantId_currencyCode: { variantId: id, currencyCode: 'VND' },
        },
      });
      const row = await tx.variantPrice.upsert({
        where: {
          variantId_currencyCode: { variantId: id, currencyCode: 'VND' },
        },
        create: { variantId: id, currencyCode: 'VND', amount, compareAtAmount },
        update: { amount, compareAtAmount },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'USER',
          action: 'VARIANT_PRICE_SET',
          entityType: 'VARIANT',
          entityId: id,
          beforeRedacted: previous
            ? {
                amount: previous.amount.toString(),
                compareAtAmount: previous.compareAtAmount?.toString() ?? null,
              }
            : Prisma.JsonNull,
          afterRedacted: {
            amount: amount.toString(),
            compareAtAmount: compareAtAmount?.toString() ?? null,
            currency: 'VND',
          },
        },
      });
      return row;
    });
  }
  taxClasses() {
    return this.prisma.taxClass.findMany({ orderBy: { code: 'asc' } });
  }
  createTaxClass(actorId: string, dto: TaxClassDto) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.taxClass.create({
        data: { code: dto.code, name: dto.name, description: dto.description },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'USER',
          action: 'TAX_CLASS_CREATE',
          entityType: 'TAX_CLASS',
          entityId: row.id,
        },
      });
      return row;
    });
  }
  async rates(id: string) {
    const rows = await this.prisma.taxRate.findMany({
      where: { taxClassId: id },
      orderBy: { effectiveFrom: 'desc' },
    });
    return rows.map((row) => ({ ...row, rate: row.rate.toString() }));
  }
  async createRate(actorId: string, id: string, dto: TaxRateDto) {
    const effectiveFrom = new Date(dto.effectiveFrom),
      effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    if (effectiveTo && effectiveTo <= effectiveFrom)
      throw new BadRequestException(
        'Tax interval must have a positive duration',
      );
    return this.prisma.$transaction(async (tx) => {
      await structureLock(tx);
      if (!(await tx.taxClass.findUnique({ where: { id } })))
        throw new NotFoundException('Tax class not found');
      const overlap = await tx.taxRate.findFirst({
        where: {
          taxClassId: id,
          code: dto.code,
          countryCode: dto.countryCode.toUpperCase(),
          regionCode: dto.regionCode ?? null,
          ...(effectiveTo ? { effectiveFrom: { lt: effectiveTo } } : {}),
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: effectiveFrom } }],
        },
      });
      if (overlap)
        throw new ConflictException('Tax interval overlaps an existing rule');
      const row = await tx.taxRate.create({
        data: {
          taxClassId: id,
          code: dto.code,
          countryCode: dto.countryCode.toUpperCase(),
          regionCode: dto.regionCode,
          rate: new Prisma.Decimal(dto.rate),
          effectiveFrom,
          effectiveTo,
          priority: dto.priority,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'USER',
          action: 'TAX_RATE_CREATE',
          entityType: 'TAX_RATE',
          entityId: row.id,
        },
      });
      return { ...row, rate: row.rate.toString() };
    });
  }
}
