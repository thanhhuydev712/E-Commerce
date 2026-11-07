import {
  BadRequestException, ConflictException, Inject, Injectable, NotFoundException,
  OnModuleDestroy, OnModuleInit, ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { Prisma } from '../../../generated/prisma-v2/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { lockUser } from '../../common/database.js';
import { CommerceService } from './commerce.service.js';
import { OrderService } from './order.service.js';
import { StripeGateway } from './stripe.gateway.js';

const supported = new Set(['checkout.session.completed', 'checkout.session.expired']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Attempt = Prisma.PaymentAttemptGetPayload<{ include: { payment: { include: { order: true } } } }>;
type CheckoutRecord = { origin: string; sessionId?: string };

@Injectable()
export class StripePaymentService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CommerceService) private readonly commerce: CommerceService,
    @Inject(OrderService) private readonly orders: OrderService,
    @Inject(StripeGateway) private readonly stripe: StripeGateway,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    if (this.stripe.enabled && this.config.get('NODE_ENV') !== 'test') {
      this.timer = setInterval(() => { void this.reconcilePending(); }, 60000);
      this.timer.unref();
    }
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  async checkout(userId: string, orderId: string) {
    this.stripe.assertAvailable();
    const account = await this.stripe.accountId();
    const attempt = await this.prisma.$transaction(async (tx) => {
      await this.commerce.userLock(tx, userId);
      const order = await tx.order.findFirst({ where: { id: orderId, userId }, include: { payment: true } });
      if (!order) throw new NotFoundException('Order not found');
      if ((order.pricingSnapshot as { method?: string }).method !== 'STRIPE' ||
          order.status !== 'PENDING_PAYMENT' || !order.payment || order.payment.capturedAmount > 0n)
        throw new ConflictException('Order is not awaiting Stripe payment');
      const existing = await tx.paymentAttempt.findFirst({ where: { paymentId: order.payment.id } });
      if (existing) {
        if (existing.providerAccount !== account || existing.mode !== 'TEST')
          throw new ConflictException('Stripe account changed for this order');
        if (['FAILED', 'CANCELLED', 'SUCCEEDED'].includes(existing.status))
          throw new ConflictException('Payment attempt is closed; refresh the order');
        return existing.id;
      }
      // Stripe requires at least 30 minutes for a newly created hosted Session.
      if (!order.paymentDeadline || order.paymentDeadline.getTime() - Date.now() < 31 * 60 * 1000)
        throw new ConflictException('Payment window is too short; cancel and place a new order');
      const id = randomUUID();
      await tx.paymentAttempt.create({ data: {
        id, paymentId: order.payment.id, provider: 'STRIPE', providerAccount: account,
        mode: 'TEST', method: 'CARD', requestedAmount: order.grandTotal,
        status: 'CREATED', idempotencyKey: `stripe-checkout:${id}`, expiresAt: order.paymentDeadline,
      } });
      await tx.idempotencyKey.create({ data: {
        actorScope: userId, operation: 'STRIPE_CHECKOUT', key: orderId,
        requestHash: createHash('sha256').update(orderId).digest('hex'),
        status: 'PROCESSING', resourceType: 'PAYMENT_ATTEMPT', resourceId: id,
        responseRedacted: { origin: this.config.getOrThrow<string>('STOREFRONT_URL') },
        expiresAt: new Date('9999-12-31T00:00:00Z'),
      } });
      await tx.payment.update({ where: { id: order.payment.id }, data: { status: 'PENDING', version: { increment: 1 } } });
      return id;
    }, { timeout: 45000 });
    const session = await this.loadSession(attempt);
    if (session.status !== 'open') {
      await this.applySession(session, account);
      return { url: null, orderId };
    }
    if (!session.url || new URL(session.url).origin !== 'https://checkout.stripe.com')
      throw new ServiceUnavailableException('Stripe checkout URL is unavailable');
    return { url: session.url, orderId };
  }

  private async loadSession(attemptId: string): Promise<Stripe.Checkout.Session> {
    const attempt = await this.prisma.paymentAttempt.findUniqueOrThrow({
      where: { id: attemptId }, include: { payment: { include: { order: true } } },
    });
    const order = attempt.payment.order;
    const record = await this.prisma.idempotencyKey.findUniqueOrThrow({ where: {
      actorScope_operation_key: { actorScope: order.userId, operation: 'STRIPE_CHECKOUT', key: order.id },
    } });
    const saved = record.responseRedacted as CheckoutRecord;
    let session: Stripe.Checkout.Session;
    try {
      if (saved.sessionId) session = await this.stripe.retrieve(saved.sessionId);
      else {
        // Never reuse a potentially evicted provider idempotency key for a new charge.
        if (Date.now() - attempt.createdAt.getTime() > 23 * 60 * 60 * 1000)
          throw new Error('PAYMENT_RECONCILIATION_REQUIRED');
        session = await this.stripe.create({
          attemptId: attempt.id, paymentId: attempt.paymentId, orderId: order.id,
          number: order.number, amount: attempt.requestedAmount, origin: saved.origin,
          expiresAt: attempt.expiresAt!, key: attempt.idempotencyKey,
        });
      }
    } catch (cause) {
      const rejected = cause instanceof Stripe.errors.StripeInvalidRequestError;
      // A timeout is ambiguous. Keep the same attempt and provider key on retry.
      await this.prisma.paymentAttempt.updateMany({ where: {
        id: attempt.id, status: { in: ['CREATED', 'PENDING', 'UNKNOWN'] },
      }, data: { status: rejected && !saved.sessionId ? 'FAILED' : 'UNKNOWN',
        failureCode: rejected ? 'PROVIDER_REJECTED' : 'PROVIDER_UNAVAILABLE' } });
      throw new ServiceUnavailableException({ code: 'STRIPE_CHECKOUT_UNAVAILABLE',
        message: 'Chưa mở được Stripe. Thử lại trên cùng đơn; không tạo đơn thanh toán khác.' });
    }
    if (!this.matches(session, attempt))
      throw new ConflictException('Stripe session does not match the order');
    await this.prisma.$transaction(async (tx) => {
      await lockUser(tx, this.prisma.schema, order.userId);
      const current = await tx.idempotencyKey.findUniqueOrThrow({ where: { id: record.id } });
      const currentData = current.responseRedacted as CheckoutRecord;
      if (currentData.sessionId && currentData.sessionId !== session.id)
        throw new ConflictException('Stripe session changed');
      await tx.idempotencyKey.update({ where: { id: record.id }, data: {
        status: 'SUCCEEDED', responseRedacted: { origin: saved.origin, sessionId: session.id },
      } });
      await tx.paymentAttempt.updateMany({ where: {
        id: attempt.id, status: { in: ['CREATED', 'UNKNOWN'] },
      }, data: { status: 'PENDING', failureCode: null } });
    });
    return session;
  }

  private matches(session: Stripe.Checkout.Session, attempt: Attempt) {
    return !session.livemode && session.mode === 'payment' && session.currency === 'vnd' &&
      Number.isSafeInteger(session.amount_total) && BigInt(session.amount_total!) === attempt.requestedAmount &&
      attempt.payment.amountDue === attempt.requestedAmount &&
      attempt.payment.order.grandTotal === attempt.requestedAmount &&
      attempt.payment.currencyCode === 'VND' && attempt.payment.order.currencyCode === 'VND' &&
      session.metadata?.attemptId === attempt.id && session.metadata.paymentId === attempt.paymentId &&
      session.metadata.orderId === attempt.payment.orderId && session.client_reference_id === attempt.payment.orderId;
  }

  async webhook(body: Buffer | undefined, signature: string | undefined) {
    this.stripe.assertAvailable();
    if (!body || !signature) throw new BadRequestException('Missing Stripe signature or raw body');
    let event: Stripe.Event;
    try { event = this.stripe.verify(body, signature); }
    catch { throw new BadRequestException('Invalid Stripe webhook signature'); }
    if (event.livemode || !supported.has(event.type)) return { received: true };
    const account = await this.stripe.accountId();
    if (event.account && event.account !== account)
      throw new BadRequestException('Stripe account mismatch');
    await this.applySession(event.data.object as Stripe.Checkout.Session, account, event);
    return { received: true };
  }

  /** Called only with a signature-verified webhook or a Session retrieved from Stripe. */
  private async applySession(session: Stripe.Checkout.Session, account: string, event?: Stripe.Event) {
    const attemptId = session.metadata?.attemptId;
    if (!attemptId || !uuid.test(attemptId)) return;
    const found = await this.prisma.paymentAttempt.findUnique({ where: { id: attemptId }, include: { payment: { include: { order: true } } } });
    if (!found) return; // A shared sandbox may contain objects created by other applications.
    await this.prisma.$transaction(async (tx) => {
      // Event lock precedes user lock everywhere; financial mutations share the user lock.
      let inboxId: string | undefined;
      if (event) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`stripe-event:${account}:${event.id}`}, 0))`;
        const previous = await tx.providerEvent.findUnique({ where: {
          provider_providerAccount_mode_externalEventId: { provider: 'STRIPE', providerAccount: account, mode: 'TEST', externalEventId: event.id },
        } });
        if (previous) return;
        const inbox = await tx.providerEvent.create({ data: {
          provider: 'STRIPE', providerAccount: account, mode: 'TEST', externalEventId: event.id,
          eventType: event.type, objectId: session.id,
          // Never persist the raw Session (contains email/address and payment URL).
          payloadRedacted: { sessionId: session.id, attemptId, paymentStatus: session.payment_status, status: session.status },
          payloadHash: createHash('sha256').update(JSON.stringify(event)).digest('hex'),
          receivedAt: new Date(), status: 'RECEIVED',
        } });
        inboxId = inbox.id;
      }
      await lockUser(tx, this.prisma.schema, found.payment.order.userId);
      const attempt = await tx.paymentAttempt.findUniqueOrThrow({ where: { id: attemptId }, include: { payment: { include: { order: true } } } });
      const order = attempt.payment.order;
      const record = await tx.idempotencyKey.findUnique({ where: {
        actorScope_operation_key: { actorScope: order.userId, operation: 'STRIPE_CHECKOUT', key: order.id },
      } });
      const saved = record?.responseRedacted as CheckoutRecord | undefined;
      if (!this.matches(session, attempt) || attempt.provider !== 'STRIPE' || attempt.providerAccount !== account ||
          attempt.mode !== 'TEST' || (saved?.sessionId && saved.sessionId !== session.id)) {
        if (inboxId) await tx.providerEvent.update({ where: { id: inboxId }, data: { status: 'DEAD', lastErrorCode: 'SESSION_MISMATCH' } });
        return;
      }
      if (session.status === 'complete' && session.payment_status === 'paid') {
        const intentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
        if (!intentId?.startsWith('pi_') || (attempt.providerIntentId && attempt.providerIntentId !== intentId))
          throw new ConflictException('Invalid Stripe payment linkage');
        const capture = await tx.paymentTransaction.findUnique({ where: {
          provider_providerAccount_mode_externalId_kind: { provider: 'STRIPE', providerAccount: account, mode: 'TEST', externalId: intentId, kind: 'CAPTURE' },
        } });
        if (!capture) {
          await tx.paymentTransaction.create({ data: {
            attemptId, provider: 'STRIPE', providerAccount: account, mode: 'TEST', externalId: intentId,
            kind: 'CAPTURE', amount: attempt.requestedAmount, currencyCode: 'VND', status: 'SUCCEEDED',
            occurredAt: new Date((event?.created ?? Math.floor(Date.now() / 1000)) * 1000), sourceEventId: inboxId,
          } });
          await tx.payment.update({ where: { id: attempt.paymentId }, data: {
            capturedAmount: { increment: attempt.requestedAmount }, status: 'PAID', version: { increment: 1 },
          } });
          if (order.status === 'PENDING_PAYMENT') {
            await tx.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED', version: { increment: 1 } } });
            await tx.stockReservation.updateMany({ where: { orderItem: { orderId: order.id }, status: 'ACTIVE' }, data: { status: 'COMMITTED', expiresAt: null } });
            await tx.promotionRedemption.updateMany({ where: { orderId: order.id, status: 'RESERVED' }, data: { status: 'APPLIED', reservedUntil: null } });
            await tx.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: 'PENDING_PAYMENT', toStatus: 'CONFIRMED', reason: 'Stripe test payment verified', operationKey: `paid:${order.id}` } });
          } else if (['CANCELLED', 'EXPIRED'].includes(order.status)) {
            // Keep the financial truth without reacquiring inventory already released.
            await tx.refund.create({ data: {
              paymentId: attempt.paymentId, amount: attempt.requestedAmount, currencyCode: 'VND',
              status: 'REQUESTED', reason: 'Payment arrived after order closed; requires financial review',
              idempotencyKey: `late-payment:${attempt.id}`,
              refundAllocations: { create: { target: 'GOODWILL', amount: attempt.requestedAmount, taxAmount: 0n } },
            } });
          }
          await tx.notification.create({ data: {
            userId: order.userId, type: 'ORDER', title: 'Đã nhận thanh toán Stripe test',
            body: ['CANCELLED', 'EXPIRED'].includes(order.status) ? `Đơn ${order.number} đã đóng. Yêu cầu kiểm tra hoàn tiền đã được tạo.` : `Đơn ${order.number} đã được xác nhận thanh toán.`,
            resourceType: 'ORDER', resourceId: order.id, dedupeKey: `stripe-paid:${order.id}`,
          } });
          await tx.auditLog.create({ data: { actorType: 'SYSTEM', action: 'STRIPE_CAPTURE', entityType: 'PAYMENT', entityId: attempt.paymentId, afterRedacted: { orderId: order.id, amount: attempt.requestedAmount.toString(), currency: 'VND' } } });
        }
        await tx.paymentAttempt.update({ where: { id: attemptId }, data: { status: 'SUCCEEDED', providerIntentId: intentId, settledAt: new Date(), failureCode: null } });
      } else if (session.status === 'expired' && attempt.status !== 'SUCCEEDED' && attempt.payment.capturedAmount === 0n) {
        await this.orders.closeUnpaid(tx, order.userId, order.id, 'EXPIRED', true);
      }
      if (inboxId) await tx.providerEvent.update({ where: { id: inboxId }, data: { status: 'PROCESSED', processedAt: new Date(), attempts: 1 } });
    }, { timeout: 45000 });
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId }, include: { payment: { include: { paymentAttempts: true } } } });
    if (!order) throw new NotFoundException('Order not found');
    if (['CANCELLED', 'EXPIRED'].includes(order.status)) return this.orders.detail(userId, orderId);
    const attempt = order.payment?.paymentAttempts[0];
    if (!attempt || attempt.status === 'FAILED') return this.orders.cancel(userId, orderId);
    if (attempt.status === 'SUCCEEDED' || order.payment!.capturedAmount > 0n)
      throw new ConflictException('Paid orders require a refund request');
    const account = await this.stripe.accountId();
    if (attempt.providerAccount !== account) throw new ConflictException('Stripe account mismatch');
    let session = await this.loadSession(attempt.id);
    if (session.status === 'open') {
      try { session = await this.stripe.expire(session.id); }
      catch { session = await this.stripe.retrieve(session.id); }
    }
    if (session.status !== 'expired') {
      await this.applySession(session, account);
      throw new ConflictException('Stripe payment is completing; refresh the order');
    }
    return this.orders.cancel(userId, orderId, true);
  }

  /** Bounded polling also repairs missed webhooks; no broker or new dependency. */
  async reconcilePending() {
    if (this.running || !this.stripe.enabled) return;
    this.running = true;
    try {
      const account = await this.stripe.accountId();
      const pending = await this.prisma.order.findMany({ where: {
        status: 'PENDING_PAYMENT', placedAt: { lt: new Date(Date.now() - 60000) },
      }, include: { payment: { include: { paymentAttempts: true } } }, orderBy: { placedAt: 'asc' }, take: 20 });
      for (const order of pending) {
        try {
          const attempt = order.payment?.paymentAttempts[0];
          if (attempt && !['FAILED', 'CANCELLED'].includes(attempt.status)) {
            if (attempt.providerAccount !== account) continue;
            const session = await this.loadSession(attempt.id);
            await this.applySession(session, account);
          } else if (order.paymentDeadline && order.paymentDeadline <= new Date()) {
            await this.prisma.$transaction(async (tx) => {
              await lockUser(tx, this.prisma.schema, order.userId);
              await this.orders.closeUnpaid(tx, order.userId, order.id, 'EXPIRED');
            }, { timeout: 45000 });
          }
        } catch { /* Retain pending/UNKNOWN for the next pass; never release ambiguous funds. */ }
      }
    } catch { /* Provider/DB outage: retry on the next tick, without exposing credentials. */ }
    finally { this.running = false; }
  }
}
