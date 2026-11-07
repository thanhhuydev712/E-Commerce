import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/** Provider calls always run outside database transactions. Test mode only. */
@Injectable()
export class StripeGateway {
  private client?: Stripe;
  private account?: Promise<string>;
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}
  get enabled() {
    return !!this.config.get<string>('STRIPE_SECRET_KEY')?.startsWith('sk_test_') &&
      !!this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.startsWith('whsec_');
  }
  assertAvailable() {
    if (!this.enabled) throw new ServiceUnavailableException({
      code: 'STRIPE_TEST_NOT_READY', message: 'Stripe test configuration is incomplete',
    });
  }
  private sdk() {
    this.assertAvailable();
    return this.client ??= new Stripe(this.config.getOrThrow('STRIPE_SECRET_KEY'), {
      maxNetworkRetries: 1, timeout: 15000,
    });
  }
  async accountId() {
    this.account ??= this.sdk().accounts.retrieve(null).then((account) => account.id);
    try { return await this.account; }
    catch { this.account = undefined; throw new ServiceUnavailableException('Stripe account is unavailable'); }
  }
  verify(body: Buffer, signature: string) {
    return this.sdk().webhooks.constructEvent(body, signature,
      this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'));
  }
  create(input: {
    attemptId: string; paymentId: string; orderId: string; number: string;
    amount: bigint; expiresAt: Date; origin: string; key: string;
  }) {
    const metadata = { attemptId: input.attemptId, paymentId: input.paymentId, orderId: input.orderId };
    return this.sdk().checkout.sessions.create({
      mode: 'payment', ui_mode: 'hosted_page', allowed_payment_method_types: ['card'],
      client_reference_id: input.orderId, metadata,
      payment_intent_data: { metadata },
      line_items: [{ quantity: 1, price_data: {
        currency: 'vnd', unit_amount: Number(input.amount),
        product_data: { name: `Rigforge · ${input.number}` },
      } }],
      expires_at: Math.floor(input.expiresAt.getTime() / 1000),
      success_url: `${input.origin}/checkout/result/${input.orderId}`,
      cancel_url: `${input.origin}/checkout/result/${input.orderId}`,
    }, { idempotencyKey: input.key });
  }
  retrieve(id: string) { return this.sdk().checkout.sessions.retrieve(id); }
  expire(id: string) { return this.sdk().checkout.sessions.expire(id); }
}
