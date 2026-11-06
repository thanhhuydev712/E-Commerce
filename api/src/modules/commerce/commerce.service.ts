import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { lockUser, type DbTransaction } from '../../common/database.js';
import { productLock, catalogReadLock } from '../catalog/catalog-locks.js';
import { publicCatalogScope } from '../catalog/catalog-read.js';
import type {
  CartLineDto,
  SavedBuildDto,
  SupportDto,
  ReviewDto,
} from './commerce.dto.js';
@Injectable()
export class CommerceService {
  constructor(@Inject(PrismaService) readonly prisma: PrismaService) {}
  async userLock(tx: DbTransaction, userId: string) {
    await lockUser(tx, this.prisma.schema, userId);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.status !== 'ACTIVE')
      throw new ForbiddenException('Account is not active');
    return user;
  }
  async activeCart(tx: DbTransaction, userId: string) {
    return (
      (await tx.cart.findFirst({ where: { userId, status: 'ACTIVE' } })) ??
      tx.cart.create({
        data: { userId, status: 'ACTIVE', currencyCode: 'VND' },
      })
    );
  }
  async cart(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.userLock(tx, userId);
      const cart = await this.activeCart(tx, userId);
      const lines = await tx.cartItem.findMany({
        where: { cartId: cart.id },
        select: { variantId: true, quantity: true },
      });
      return { id: cart.id, version: cart.version, lines };
    });
  }
  async setCart(userId: string, lines: CartLineDto[], add = false) {
    if (
      new Set(lines.map((l) => l.variantId.toLowerCase())).size !== lines.length
    )
      throw new BadRequestException('Duplicate variants');
    return this.prisma.$transaction(
      async (tx) => {
        await this.userLock(tx, userId);
        const cart = await this.activeCart(tx, userId);
        const existing = await tx.cartItem.findMany({
          where: { cartId: cart.id },
        });
        const requested = lines.map((line) => ({
          variantId: line.variantId,
          quantity:
            line.quantity +
            (add
              ? (existing.find(
                  (e) => e.variantId === line.variantId.toLowerCase(),
                )?.quantity ?? 0)
              : 0),
        }));
        await catalogReadLock(tx);
        const selected = await tx.productVariant.findMany({
          where: {
            id: {
              in: requested
                .filter((line) => line.quantity > 0)
                .map((line) => line.variantId),
            },
          },
          select: { productId: true },
        });
        for (const productId of [
          ...new Set(selected.map((v) => v.productId)),
        ].sort())
          await productLock(tx, this.prisma.schema, productId);
        const scope = await publicCatalogScope(tx);
        for (const line of requested.sort((a, b) =>
          a.variantId.localeCompare(b.variantId),
        )) {
          if (line.quantity === 0) {
            await tx.cartItem.deleteMany({
              where: { cartId: cart.id, variantId: line.variantId },
            });
            continue;
          }
          if (line.quantity > 99)
            throw new ConflictException('At most 99 units per variant');
          const variant = await tx.productVariant.findFirst({
            where: { id: line.variantId, product: scope.where },
            include: { variantPrices: { where: { currencyCode: 'VND' } } },
          });
          if (
            !variant ||
            variant.status !== 'ACTIVE' ||
            !variant.variantPrices.length
          )
            throw new ConflictException('Variant is unavailable');
          const balances = await tx.inventoryBalance.findMany({
            where: {
              variantId: line.variantId,
              warehouse: { status: 'ACTIVE' },
            },
          });
          const available = balances.reduce(
            (sum, b) => sum + b.onHand - b.reserved - b.unavailable,
            0,
          );
          if (line.quantity > available)
            throw new ConflictException('Insufficient available stock');
          await tx.cartItem.upsert({
            where: {
              cartId_variantId: { cartId: cart.id, variantId: line.variantId },
            },
            create: {
              cartId: cart.id,
              variantId: line.variantId,
              quantity: line.quantity,
            },
            update: { quantity: line.quantity },
          });
        }
        if (
          existing.length +
            requested.filter(
              (l) =>
                l.quantity &&
                !existing.some(
                  (e) => e.variantId === l.variantId.toLowerCase(),
                ),
            ).length >
          100
        )
          throw new ConflictException('Cart limit exceeded');
        const updated = await tx.cart.update({
          where: { id: cart.id },
          data: { version: { increment: 1 } },
        });
        await tx.auditLog.create({
          data: {
            actorId: userId,
            actorType: 'USER',
            action: 'CART_UPDATE',
            entityType: 'CART',
            entityId: cart.id,
          },
        });
        return {
          id: cart.id,
          version: updated.version,
          lines: await tx.cartItem.findMany({
            where: { cartId: cart.id },
            select: { variantId: true, quantity: true },
          }),
        };
      },
      { timeout: 45000 },
    );
  }
  async wishlist(userId: string) {
    const lists = await this.prisma.wishlist.findMany({
      where: { userId, isDefault: true },
      include: {
        wishlistItems: {
          include: {
            variant: { select: { product: { select: { slug: true } } } },
          },
        },
      },
    });
    return lists.flatMap((list) =>
      list.wishlistItems.map((item) => item.variant.product.slug),
    );
  }
  async toggleWishlist(userId: string, productId: string) {
    await this.prisma.$transaction(async (tx) => {
      await this.userLock(tx, userId);
      const product = await tx.product.findFirst({
        where: { id: productId, status: 'ACTIVE' },
        include: { productVariants: { where: { status: 'ACTIVE' }, take: 1 } },
      });
      if (!product?.productVariants[0])
        throw new NotFoundException('Product not found');
      const list =
        (await tx.wishlist.findFirst({ where: { userId, isDefault: true } })) ??
        (await tx.wishlist.create({
          data: {
            userId,
            name: 'Yêu thích',
            isDefault: true,
            visibility: 'PRIVATE',
          },
        }));
      const variantId = product.productVariants[0].id;
      const existing = await tx.wishlistItem.findUnique({
        where: { wishlistId_variantId: { wishlistId: list.id, variantId } },
      });
      if (existing)
        await tx.wishlistItem.delete({
          where: { wishlistId_variantId: { wishlistId: list.id, variantId } },
        });
      else
        await tx.wishlistItem.create({
          data: { wishlistId: list.id, variantId },
        });
    });
    return this.wishlist(userId);
  }
  async builds(userId: string) {
    const rows = await this.prisma.savedPcBuild.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        components: { include: { product: { select: { slug: true } } } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      build: Object.fromEntries(
        row.components.map((component) => [
          component.slot,
          component.product.slug,
        ]),
      ),
    }));
  }
  async saveBuild(userId: string, dto: SavedBuildDto) {
    const slots = [
      'cpu',
      'mainboard',
      'ram',
      'gpu',
      'ssd',
      'psu',
      'case',
      'cooler',
    ];
    const entries = Object.entries(dto.components);
    if (
      !entries.length ||
      entries.length > 8 ||
      entries.some(
        ([key, id]) =>
          !slots.includes(key) ||
          typeof id !== 'string' ||
          !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id),
      )
    )
      throw new BadRequestException('Invalid build components');
    await this.prisma.$transaction(async (tx) => {
      await this.userLock(tx, userId);
      if ((await tx.savedPcBuild.count({ where: { userId } })) >= 50)
        throw new ConflictException('At most 50 saved builds');
      const products = await tx.product.findMany({
        where: { id: { in: entries.map(([, id]) => id) }, status: 'ACTIVE' },
        include: {
          productCategories: {
            where: { isPrimary: true },
            include: { category: true },
          },
        },
      });
      if (
        entries.some(
          ([key, id]) =>
            !products.some(
              (p) =>
                p.id === id.toLowerCase() &&
                p.productCategories[0]?.category.slug === key,
            ),
        )
      )
        throw new BadRequestException('Component must belong to its slot');
      await tx.savedPcBuild.create({
        data: {
          userId,
          name: dto.name,
          components: {
            create: entries.map(([slot, productId]) => ({ slot, productId })),
          },
        },
      });
    });
    return this.builds(userId);
  }
  async deleteBuild(userId: string, id: string) {
    await this.prisma.savedPcBuild.deleteMany({ where: { id, userId } });
    return this.builds(userId);
  }
  tickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      include: {
        supportMessages: {
          where: { visibility: 'CUSTOMER' },
          orderBy: { createdAt: 'asc' },
          select: { id: true, body: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
  async support(userId: string, dto: SupportDto) {
    if (
      dto.orderId &&
      !(await this.prisma.order.findFirst({
        where: { id: dto.orderId, userId },
      }))
    )
      throw new NotFoundException('Order not found');
    return this.prisma.supportTicket.create({
      data: {
        userId,
        number: `RF-T-${randomUUID().slice(0, 12)}`,
        subject: dto.subject,
        status: 'OPEN',
        priority: 'NORMAL',
        orderId: dto.orderId,
        supportMessages: {
          create: { authorId: userId, visibility: 'CUSTOMER', body: dto.body },
        },
      },
    });
  }
  notifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
  readNotifications(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
  preference(userId: string) {
    return this.prisma.notificationPreference.findUnique({
      where: {
        userId_topic_channel: { userId, topic: 'MARKETING', channel: 'EMAIL' },
      },
    });
  }
  setPreference(userId: string, enabled: boolean) {
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_topic_channel: { userId, topic: 'MARKETING', channel: 'EMAIL' },
      },
      create: { userId, topic: 'MARKETING', channel: 'EMAIL', enabled },
      update: { enabled },
    });
  }
  reviews(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: { product: { select: { name: true, slug: true } } },
      take: 100,
    });
  }
  async review(userId: string, dto: ReviewDto) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: dto.orderItemId, order: { userId, status: 'COMPLETED' } },
      include: { variant: true },
    });
    if (!item)
      throw new ForbiddenException('Only completed purchases can be reviewed');
    return this.prisma.review.create({
      data: {
        userId,
        orderItemId: item.id,
        productId: item.variant.productId,
        rating: dto.rating,
        body: dto.body,
        status: 'PENDING',
      },
    });
  }
  lookupSerial(userId: string, serial: string) {
    return this.prisma.serialUnit.findMany({
      where: { serialNumber: serial, currentOrderItem: { order: { userId } } },
      select: {
        serialNumber: true,
        warrantyStart: true,
        warrantyEnd: true,
        status: true,
        variant: {
          select: {
            sku: true,
            name: true,
            product: { select: { name: true } },
          },
        },
      },
      take: 10,
    });
  }
}
