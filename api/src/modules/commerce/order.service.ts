import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '../../../generated/prisma-v2/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { DbTransaction } from '../../common/database.js';
import { CommerceService } from './commerce.service.js';
import { publicCatalogScope } from '../catalog/catalog-read.js';
import { productLock, catalogReadLock } from '../catalog/catalog-locks.js';
import type { PlaceOrderDto, QuoteDto } from './commerce.dto.js';
import { StripeGateway } from './stripe.gateway.js';
type Quote = {
  cartId: string;
  cartVersion: number;
  lines: {
    variantId: string;
    productId: string;
    name: string;
    label: string | null;
    sku: string;
    price: string;
    quantity: number;
  }[];
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  customer: string;
  address: string;
  phone: string;
  express: boolean;
  couponId: string | null;
  promotionId: string | null;
};
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
@Injectable()
export class OrderService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CommerceService) private readonly commerce: CommerceService,
    @Inject(StripeGateway) private readonly stripe: StripeGateway,
  ) {}
  async price(
    tx: DbTransaction,
    userId: string,
    dto: QuoteDto,
  ): Promise<Quote> {
    const cart = await this.commerce.activeCart(tx, userId);
    const items = await tx.cartItem.findMany({
      where: { cartId: cart.id },
      orderBy: { variantId: 'asc' },
    });
    if (!items.length) throw new ConflictException('Cart is empty');
    const scope = await publicCatalogScope(tx);
    const variants = await tx.productVariant.findMany({
      where: {
        id: { in: items.map((i) => i.variantId) },
        status: 'ACTIVE',
        product: scope.where,
      },
      include: {
        variantPrices: { where: { currencyCode: 'VND' } },
        product: { select: { id: true, name: true } },
        inventoryBalances: { where: { warehouse: { status: 'ACTIVE' } } },
      },
    });
    const lines = items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant?.variantPrices[0] || variant.trackSerial)
        throw new ConflictException('Product is unavailable for checkout');
      if (
        item.quantity >
        variant.inventoryBalances.reduce(
          (sum, b) => sum + b.onHand - b.reserved - b.unavailable,
          0,
        )
      )
        throw new ConflictException('Insufficient available stock');
      return {
        variantId: variant.id,
        productId: variant.productId,
        name: variant.product.name,
        label: variant.name,
        sku: variant.sku,
        price: variant.variantPrices[0].amount.toString(),
        quantity: item.quantity,
      };
    });
    const subtotal = lines.reduce(
      (sum, l) => sum + BigInt(l.price) * BigInt(l.quantity),
      0n,
    );
    let discount = 0n,
      couponId: string | null = null,
      promotionId: string | null = null;
    if (dto.couponCode) {
      const coupon = await tx.coupon.findUnique({
        where: { code: dto.couponCode.toUpperCase() },
        include: { promotion: true },
      });
      const now = new Date(),
        promo = coupon?.promotion;
      if (
        !coupon ||
        coupon.status !== 'ACTIVE' ||
        (coupon.expiresAt && coupon.expiresAt <= now) ||
        !promo ||
        promo.status !== 'ACTIVE' ||
        promo.startsAt > now ||
        promo.endsAt <= now ||
        subtotal < (promo.minSubtotal ?? 0n)
      )
        throw new ConflictException('Coupon is not available');
      // Giới hạn lượt dùng được bảo vệ thêm bởi khóa promotion lúc đặt đơn.
      const used = await tx.promotionRedemption.count({
        where: {
          promotionId: promo.id,
          status: { in: ['RESERVED', 'APPLIED'] },
        },
      });
      const userUsed = await tx.promotionRedemption.count({
        where: {
          promotionId: promo.id,
          userId,
          status: { in: ['RESERVED', 'APPLIED'] },
        },
      });
      if (
        (promo.globalLimit !== null && used >= promo.globalLimit) ||
        (promo.perUserLimit !== null && userUsed >= promo.perUserLimit)
      )
        throw new ConflictException('Coupon usage limit reached');
      if (promo.type === 'PERCENT')
        discount = (subtotal * BigInt(promo.percentBps ?? 0)) / 10000n;
      else if (promo.type === 'FIXED' && promo.currencyCode === 'VND')
        discount = promo.fixedAmount ?? 0n;
      else throw new ConflictException('Coupon type is not supported');
      if (promo.maxDiscount !== null && discount > promo.maxDiscount)
        discount = promo.maxDiscount;
      if (discount > subtotal) discount = subtotal;
      couponId = coupon.id;
      promotionId = promo.id;
    }
    const settings = await tx.storeSetting.findUnique({
      where: { key: 'storefront.presentation' },
    });
    const shippingConfig = (
      settings?.value as
        | {
            shipping?: { standard: string; express: string; freeAbove: string };
          }
        | undefined
    )?.shipping;
    if (!shippingConfig)
      throw new ServiceUnavailableException('Shipping is not configured');
    const baseShipping =
      subtotal >= BigInt(shippingConfig.freeAbove)
        ? 0n
        : BigInt(shippingConfig.standard);
    const shipping =
      baseShipping +
      (dto.express
        ? BigInt(shippingConfig.express) - BigInt(shippingConfig.standard)
        : 0n);
    const total = subtotal - discount + shipping;
    if (total > 9223372036854775807n)
      throw new ConflictException('Order amount exceeds supported range');
    return {
      cartId: cart.id,
      cartVersion: cart.version,
      lines,
      subtotal: String(subtotal),
      discount: String(discount),
      shipping: String(shipping),
      total: String(total),
      customer: dto.customer,
      address: dto.address,
      phone: dto.phone,
      express: !!dto.express,
      couponId,
      promotionId,
    };
  }
  async quote(userId: string, dto: QuoteDto) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.commerce.userLock(tx, userId);
        const snapshot = await this.price(tx, userId, dto);
        const quote = await tx.checkoutSession.create({
          data: {
            cartId: snapshot.cartId,
            userId,
            cartVersion: snapshot.cartVersion,
            currencyCode: 'VND',
            quoteSnapshot: snapshot,
            quoteHash: hash(snapshot),
            status: 'OPEN',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        });
        return {
          id: quote.id,
          expiresAt: quote.expiresAt,
          ...snapshot,
          methods: this.stripe.enabled ? ['COD', 'STRIPE'] : ['COD'],
          taxIncluded: true,
        };
      },
      { timeout: 45000 },
    );
  }
  async place(userId: string, key: string | undefined, dto: PlaceOrderDto) {
    if (!key || !/^[a-zA-Z0-9._:-]{8,96}$/.test(key))
      throw new BadRequestException('Idempotency-Key is required');
    if (dto.method === 'STRIPE') this.stripe.assertAvailable();
    const requestHash = hash(dto);
    const id = await this.prisma.$transaction(
      async (tx) => {
        const user = await this.commerce.userLock(tx, userId);
        const previous = await tx.idempotencyKey.findUnique({
          where: {
            actorScope_operation_key: {
              actorScope: userId,
              operation: 'PLACE_ORDER',
              key,
            },
          },
        });
        if (previous) {
          if (previous.requestHash !== requestHash)
            throw new ConflictException('Key was used with another request');
          return previous.resourceId!;
        }
        await catalogReadLock(tx);
        const quote = await tx.checkoutSession.findFirst({
          where: { id: dto.quoteId, userId, status: 'OPEN' },
        });
        if (!quote || quote.expiresAt <= new Date())
          throw new ConflictException('Quote expired or was already used');
        const saved = quote.quoteSnapshot as Quote;
        if (saved.promotionId)
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${saved.promotionId}, 0))`;
        for (const productId of [
          ...new Set(saved.lines.map((l) => l.productId)),
        ].sort())
          await productLock(tx, this.prisma.schema, productId);
        const snapshot = await this.price(tx, userId, {
          customer: saved.customer,
          address: saved.address,
          phone: saved.phone,
          express: saved.express,
          couponCode: saved.couponId
            ? (
                await tx.coupon.findUniqueOrThrow({
                  where: { id: saved.couponId },
                })
              ).code
            : undefined,
        });
        if (hash(snapshot) !== quote.quoteHash)
          throw new ConflictException(
            'Cart, stock or prices changed; request a new quote',
          );
        const orderId = randomUUID(),
          number = `RF-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
        if (dto.method === 'STRIPE' &&
          (BigInt(snapshot.total) <= 0n || BigInt(snapshot.total) > BigInt(Number.MAX_SAFE_INTEGER)))
          throw new ConflictException('Order amount is unsupported for Stripe');
        const paymentDeadline = dto.method === 'STRIPE' ? new Date(Date.now() + 60 * 60 * 1000) : null;
        const initialStatus = dto.method === 'STRIPE' ? 'PENDING_PAYMENT' : 'CONFIRMED';
        await tx.order.create({
          data: {
            id: orderId,
            number,
            userId,
            checkoutSessionId: quote.id,
            source: 'WEB',
            status: initialStatus,
            currencyCode: 'VND',
            subtotal: BigInt(snapshot.subtotal),
            discountTotal: BigInt(snapshot.discount),
            shippingTotal: BigInt(snapshot.shipping),
            taxTotal: 0n,
            grandTotal: BigInt(snapshot.total),
            customerEmailSnapshot: user.email,
            pricingSnapshot: { ...snapshot, method: dto.method, taxIncluded: true },
            placedAt: new Date(),
            paymentDeadline,
          },
        });
        await tx.orderAddress.create({
          data: {
            orderId,
            kind: 'SHIPPING',
            recipientName: snapshot.customer,
            phone: snapshot.phone,
            email: user.email,
            countryCode: 'VN',
            line1: snapshot.address,
            completeness: 'COMPLETE',
          },
        });
        let remainingDiscount = BigInt(snapshot.discount);
        for (const [index, line] of snapshot.lines.entries()) {
          const lineSubtotal = BigInt(line.price) * BigInt(line.quantity);
          const discount =
            index === snapshot.lines.length - 1
              ? remainingDiscount
              : (BigInt(snapshot.discount) * lineSubtotal) /
                BigInt(snapshot.subtotal);
          remainingDiscount -= discount;
          const item = await tx.orderItem.create({
            data: {
              orderId,
              variantId: line.variantId,
              lineNumber: index + 1,
              productNameSnapshot: line.name,
              variantNameSnapshot: line.label,
              skuSnapshot: line.sku,
              optionSnapshot: {},
              quantity: line.quantity,
              unitPrice: BigInt(line.price),
              lineSubtotal,
              discountAmount: discount,
              taxAmount: 0n,
              lineTotal: lineSubtotal - discount,
            },
          });
          if (snapshot.promotionId && discount > 0n)
            await tx.orderDiscount.create({
              data: {
                orderId,
                orderItemId: item.id,
                promotionId: snapshot.promotionId,
                couponId: snapshot.couponId,
                target: 'ITEM',
                codeSnapshot: 'COUPON',
                ruleSnapshot: { quoteId: quote.id },
                amount: discount,
              },
            });
          const balances = await tx.inventoryBalance.findMany({
            where: {
              variantId: line.variantId,
              warehouse: { status: 'ACTIVE' },
            },
            orderBy: { id: 'asc' },
          });
          let remaining = line.quantity;
          for (const balance of balances) {
            if (!remaining) break;
            const quantity = Math.min(
              remaining,
              balance.onHand - balance.reserved - balance.unavailable,
            );
            if (!quantity) continue;
            const changed = await tx.inventoryBalance.updateMany({
              where: {
                id: balance.id,
                version: balance.version,
                onHand: {
                  gte: balance.reserved + balance.unavailable + quantity,
                },
              },
              data: {
                reserved: { increment: quantity },
                version: { increment: 1 },
              },
            });
            if (changed.count !== 1)
              throw new ConflictException('Stock changed during checkout');
            await tx.stockReservation.create({
              data: {
                balanceId: balance.id,
                orderItemId: item.id,
                quantity,
                status: dto.method === 'STRIPE' ? 'ACTIVE' : 'COMMITTED',
                expiresAt: paymentDeadline,
                operationKey: `order:${orderId}:${item.id}:${balance.id}`,
              },
            });
            await tx.inventoryMovement.create({
              data: {
                balanceId: balance.id,
                onHandDelta: 0,
                reservedDelta: quantity,
                unavailableDelta: 0,
                kind: 'RESERVE',
                operationKey: `reserve:${orderId}:${item.id}:${balance.id}`,
                sourceType: 'ORDER',
                sourceId: orderId,
                actorId: userId,
                occurredAt: new Date(),
              },
            });
            remaining -= quantity;
          }
          if (remaining) throw new ConflictException('Insufficient stock');
        }
        if (snapshot.promotionId) {
          await tx.promotionRedemption.create({
            data: {
              promotionId: snapshot.promotionId,
              couponId: snapshot.couponId,
              userId,
              orderId,
              status: dto.method === 'STRIPE' ? 'RESERVED' : 'APPLIED',
              reservedUntil: paymentDeadline,
              operationKey: `coupon:${orderId}`,
            },
          });
        }
        await tx.payment.create({
          data: {
            orderId,
            currencyCode: 'VND',
            amountDue: BigInt(snapshot.total),
            status: 'UNPAID',
          },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            toStatus: initialStatus,
            actorId: userId,
            reason: dto.method === 'STRIPE' ? 'Chờ thanh toán Stripe test' : 'Đặt hàng COD',
            operationKey: `placed:${orderId}`,
          },
        });
        await tx.checkoutSession.update({
          where: { id: quote.id },
          data: { status: 'CONVERTED', convertedAt: new Date() },
        });
        await tx.cart.update({
          where: { id: quote.cartId },
          data: { status: 'CONVERTED', version: { increment: 1 } },
        });
        await tx.notification.create({
          data: {
            userId,
            type: 'ORDER',
            title: 'Đặt hàng thành công',
            body: dto.method === 'STRIPE' ? `Đơn ${number} đang chờ thanh toán Stripe test.` : `Đơn ${number} đang được xử lý, thanh toán khi nhận hàng.`,
            resourceType: 'ORDER',
            resourceId: orderId,
            dedupeKey: `placed:${orderId}`,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: userId,
            actorType: 'USER',
            action: 'ORDER_PLACE',
            entityType: 'ORDER',
            entityId: orderId,
            afterRedacted: { number, method: dto.method, amount: snapshot.total },
          },
        });
        await tx.idempotencyKey.create({
          data: {
            actorScope: userId,
            operation: 'PLACE_ORDER',
            key,
            requestHash,
            status: 'SUCCEEDED',
            resourceType: 'ORDER',
            resourceId: orderId,
            responseCode: 201,
            expiresAt: new Date('9999-12-31T00:00:00Z'),
          },
        });
        return orderId;
      },
      { timeout: 60000 },
    );
    return this.detail(userId, id);
  }
  async list(userId: string) {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      include: { orderItems: true, orderAddresses: true, payment: true },
      orderBy: { placedAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.view(row));
  }
  async detail(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { orderItems: true, orderAddresses: true, payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    const history = await this.prisma.orderStatusHistory.findMany({
      where: { orderId: id },
      select: { id: true, toStatus: true, reason: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const documents = await this.prisma.invoice.findMany({
      where: { orderId: id },
      select: {
        id: true,
        number: true,
        status: true,
        totalAmount: true,
        issuedAt: true,
      },
    });
    return { ...this.view(order), history, documents };
  }
  private view(
    row: Prisma.OrderGetPayload<{
      include: { orderItems: true; orderAddresses: true; payment: true };
    }>,
  ) {
    return {
      id: row.id,
      number: row.number,
      createdAt: row.placedAt,
      status: ['CANCELLED', 'EXPIRED'].includes(row.status) ? 'cancelled' : 'processing',
      backendStatus: row.status,
      payment: row.payment?.status === 'PAID' ? 'paid' : 'pending',
      paymentMethod: (row.pricingSnapshot as { method?: string }).method ?? 'COD',
      paymentStatus: row.payment?.status ?? 'UNPAID',
      paymentDeadline: row.paymentDeadline,
      canPay: row.status === 'PENDING_PAYMENT' && row.payment?.capturedAmount === 0n &&
        !!row.paymentDeadline && row.paymentDeadline > new Date(),
      lines: row.orderItems.map((l) => ({
        id: l.id,
        name: `${l.productNameSnapshot}${l.variantNameSnapshot ? ' · ' + l.variantNameSnapshot : ''}`,
        variantId: l.variantId,
        price: l.unitPrice.toString(),
        quantity: l.quantity,
      })),
      subtotal: row.subtotal.toString(),
      discount: row.discountTotal.toString(),
      shipping: row.shippingTotal.toString(),
      total: row.grandTotal.toString(),
      customer: row.orderAddresses[0]?.recipientName ?? '',
      address: row.orderAddresses[0]?.line1 ?? '',
      canCancel:
        ['CONFIRMED', 'PENDING_PAYMENT'].includes(row.status) &&
        row.payment?.capturedAmount === 0n,
    };
  }
  async cancel(userId: string, id: string, stripeExpired = false) {
    await this.prisma.$transaction(
      async (tx) => {
        await this.commerce.userLock(tx, userId);
        await this.closeUnpaid(tx, userId, id, 'CANCELLED', stripeExpired);
      },
      { timeout: 45000 },
    );
    return this.detail(userId, id);
  }
  /** Caller holds the same user row lock as place/cancel/payment processing. */
  async closeUnpaid(tx: DbTransaction, userId: string, id: string,
    status: 'CANCELLED' | 'EXPIRED', stripeExpired = false) {
        const order = await tx.order.findFirst({
          where: { id, userId },
          include: { payment: true, orderItems: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (['CANCELLED', 'EXPIRED'].includes(order.status)) return;
        if (
          !['CONFIRMED', 'PENDING_PAYMENT'].includes(order.status) ||
          order.payment?.capturedAmount !== 0n
        )
          throw new ConflictException(
            'Order cannot be cancelled; contact support',
          );
        if (!stripeExpired && await tx.paymentAttempt.count({ where: {
          paymentId: order.payment!.id, status: { in: ['CREATED', 'PENDING', 'UNKNOWN'] },
        } })) throw new ConflictException('Stripe session must be expired before releasing stock');
        for (const productId of [
          ...new Set(
            (
              await tx.productVariant.findMany({
                where: { id: { in: order.orderItems.map((l) => l.variantId) } },
                select: { productId: true },
              })
            ).map((v) => v.productId),
          ),
        ].sort())
          await productLock(tx, this.prisma.schema, productId);
        const reservations = await tx.stockReservation.findMany({
          where: {
            orderItem: { orderId: id },
            status: { in: ['ACTIVE', 'COMMITTED'] },
          },
          orderBy: { balanceId: 'asc' },
        });
        for (const reservation of reservations) {
          await tx.inventoryBalance.update({
            where: { id: reservation.balanceId },
            data: {
              reserved: { decrement: reservation.quantity },
              version: { increment: 1 },
            },
          });
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: { status: status === 'EXPIRED' ? 'EXPIRED' : 'RELEASED' },
          });
          await tx.inventoryMovement.create({
            data: {
              balanceId: reservation.balanceId,
              onHandDelta: 0,
              reservedDelta: -reservation.quantity,
              unavailableDelta: 0,
              kind: 'RELEASE',
              operationKey: `cancel:${reservation.id}`,
              sourceType: 'ORDER',
              sourceId: id,
              actorId: userId,
              occurredAt: new Date(),
            },
          });
        }
        await tx.order.update({
          where: { id },
          data: {
            status,
            cancelledAt: new Date(),
            cancellationReason: status === 'EXPIRED' ? 'Payment session expired' : 'Customer cancellation',
            version: { increment: 1 },
          },
        });
        await tx.promotionRedemption.updateMany({
          where: { orderId: id },
          data: { status: 'RELEASED' },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: order.status,
            toStatus: status,
            actorId: userId,
            operationKey: `cancelled:${id}`,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: userId,
            actorType: 'USER',
            action: status === 'EXPIRED' ? 'ORDER_EXPIRE' : 'ORDER_CANCEL',
            entityType: 'ORDER',
            entityId: id,
          },
        });
        await tx.paymentAttempt.updateMany({
          where: { paymentId: order.payment!.id, status: { in: ['CREATED', 'PENDING', 'UNKNOWN'] } },
          data: { status: 'CANCELLED', settledAt: new Date() },
        });
        await tx.payment.updateMany({
          where: { id: order.payment!.id, capturedAmount: 0n },
          data: { status: 'UNPAID', version: { increment: 1 } },
        });
  }
}
