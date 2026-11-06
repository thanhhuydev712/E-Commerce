import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '../../../generated/prisma-v2/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { productLock } from '../catalog/catalog-locks.js';
import type {
  WarehouseDto,
  BalanceQuery,
  AdjustStockDto,
} from './inventory.dto.js';
@Injectable()
export class InventoryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  warehouses() {
    return this.prisma.warehouse.findMany({ orderBy: { code: 'asc' } });
  }
  createWarehouse(actorId: string, dto: WarehouseDto) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.warehouse.create({
        data: {
          code: dto.code,
          name: dto.name,
          addressSnapshot: { address: dto.address },
          status: 'ACTIVE',
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'USER',
          action: 'WAREHOUSE_CREATE',
          entityType: 'WAREHOUSE',
          entityId: row.id,
        },
      });
      return row;
    });
  }
  async balances(query: BalanceQuery) {
    const where = {
      variantId: query.variantId,
      warehouseId: query.warehouseId,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryBalance.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.inventoryBalance.count({ where }),
    ]);
    return {
      items: items.map((row) => ({
        ...row,
        available: row.onHand - row.reserved - row.unavailable,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
  async movements(query: BalanceQuery) {
    const where = {
      balance: { variantId: query.variantId, warehouseId: query.warehouseId },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.findMany({
        where,
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }
  async adjust(actorId: string, key: string | undefined, dto: AdjustStockDto) {
    if (!key || !/^[a-zA-Z0-9._:-]{8,96}$/.test(key))
      throw new BadRequestException(
        'Idempotency-Key must contain 8-96 safe characters',
      );
    if (!dto.delta) throw new BadRequestException('Adjustment must be nonzero');
    const operation = 'INVENTORY_ADJUST',
      actorScope = actorId;
    const requestHash = createHash('sha256')
      .update(
        JSON.stringify({
          variantId: dto.variantId.toLowerCase(),
          warehouseId: dto.warehouseId.toLowerCase(),
          delta: dto.delta,
          version: dto.expectedVersion,
          reason: dto.reason,
        }),
      )
      .digest('hex');
    const operationKey = createHash('sha256')
      .update(`${operation}:${actorId}:${key}`)
      .digest('hex');
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${operationKey},0))`;
      const previous = await tx.idempotencyKey.findUnique({
        where: { actorScope_operation_key: { actorScope, operation, key } },
      });
      if (previous) {
        if (previous.requestHash !== requestHash)
          throw new ConflictException(
            'Idempotency key was used with another payload',
          );
        return previous.responseRedacted;
      }
      if (await tx.inventoryMovement.findUnique({ where: { operationKey } }))
        throw new ConflictException(
          'Operation already recorded; do not reuse this key',
        );
      const variant = await tx.productVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant) throw new NotFoundException('Variant not found');
      await productLock(tx, this.prisma.schema, variant.productId);
      if (variant.trackSerial)
        throw new ConflictException(
          'Serial-tracked stock requires the serial receipt workflow',
        );
      const warehouse = await tx.warehouse.findUnique({
        where: { id: dto.warehouseId },
      });
      if (!warehouse || warehouse.status !== 'ACTIVE')
        throw new NotFoundException('Active warehouse not found');
      const balance = await tx.inventoryBalance.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId: warehouse.id,
            variantId: variant.id,
          },
        },
        create: { warehouseId: warehouse.id, variantId: variant.id },
        update: {},
      });
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM ${Prisma.raw(`"${this.prisma.schema}"."inventory_balances"`)} WHERE id=${balance.id}::uuid FOR UPDATE`,
      );
      const current = await tx.inventoryBalance.findUniqueOrThrow({
        where: { id: balance.id },
      });
      if (
        current.version !== dto.expectedVersion ||
        current.version >= 2147483647
      )
        throw new ConflictException(
          'Balance version changed; reload before adjusting',
        );
      const next = current.onHand + dto.delta;
      if (
        next < current.reserved + current.unavailable ||
        next < 0 ||
        next > 2147483647
      )
        throw new ConflictException(
          'Adjustment would violate stock constraints',
        );
      const updated = await tx.inventoryBalance.update({
        where: { id: balance.id },
        data: { onHand: next, version: { increment: 1 } },
      });
      const movementId = randomUUID();
      await tx.inventoryMovement.create({
        data: {
          id: movementId,
          balanceId: balance.id,
          onHandDelta: dto.delta,
          reservedDelta: 0,
          unavailableDelta: 0,
          kind: 'ADJUST',
          operationKey,
          sourceType: 'MANUAL_ADJUSTMENT',
          sourceId: movementId,
          reason: dto.reason,
          actorId,
          occurredAt: new Date(),
        },
      });
      const result = {
        movementId,
        balanceId: balance.id,
        variantId: variant.id,
        warehouseId: warehouse.id,
        onHand: updated.onHand,
        reserved: updated.reserved,
        unavailable: updated.unavailable,
        available: next - updated.reserved - updated.unavailable,
        version: updated.version,
      };
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'USER',
          action: 'STOCK_ADJUST',
          entityType: 'INVENTORY_MOVEMENT',
          entityId: movementId,
          beforeRedacted: { onHand: current.onHand, version: current.version },
          afterRedacted: { ...result, requestHash },
          reason: dto.reason,
        },
      });
      await tx.idempotencyKey.create({
        data: {
          actorScope,
          operation,
          key,
          requestHash,
          status: 'SUCCEEDED',
          resourceType: 'INVENTORY_MOVEMENT',
          resourceId: movementId,
          responseCode: 200,
          responseRedacted: result,
          expiresAt: new Date('9999-12-31T00:00:00Z'),
        },
      });
      return result;
    });
  }
}
