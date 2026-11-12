// Explicit sandbox capability audit: one test-token payment and a full refund.
// No database access, real card, customer/receipt email, secrets or payment URLs.
import 'dotenv/config';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
if (process.env.RUN_STRIPE_REFUND_SMOKE !== '1' || process.env.NODE_ENV === 'production' ||
  !process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'))
  throw new Error('Explicit Stripe sandbox opt-in is required');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 15000, maxNetworkRetries: 1 });
const runId = randomUUID();
const refundKey = `audit-refund:${runId}`;
let payment, refund;
const refundPayment = () => stripe.refunds.create({
  payment_intent: payment.id, amount: 1000000, metadata: { auditRunId: runId },
}, { idempotencyKey: refundKey });
try {
  payment = await stripe.paymentIntents.create({
    amount: 1000000, currency: 'vnd', allowed_payment_method_types: ['card'],
    payment_method: 'pm_card_visa', confirm: true,
    description: 'Rigforge SDK sandbox refund audit', metadata: { auditRunId: runId },
  }, { idempotencyKey: `audit-capture:${runId}` });
  if (payment.livemode || payment.status !== 'succeeded' || payment.amount_received !== 1000000)
    throw new Error('Unexpected test capture result');
  refund = await refundPayment();
  const repeated = await refundPayment();
  const retrieved = await stripe.refunds.retrieve(refund.id);
  if (refund.id !== repeated.id || retrieved.amount !== 1000000 || retrieved.currency !== 'vnd' || retrieved.status !== 'succeeded')
    throw new Error('Unexpected refund linkage/amount');
  console.log(JSON.stringify({ mode: 'TEST', testTokenCapture: payment.status,
    currency: 'VND', amount: '1000000', refundStatus: retrieved.status,
    sameKeySameRefund: true, refundRetrieved: true, databaseAccess: false }));
} catch (cause) {
  console.error(JSON.stringify({ sandboxRefundAudit: 'failed', code: typeof cause?.code === 'string' ? cause.code : 'PROVIDER_ERROR',
    type: cause?.type ?? cause?.name, status: cause?.statusCode, parameter: cause?.param }));
  process.exitCode = 1;
} finally {
  if (payment?.status === 'succeeded' && !payment.livemode && !refund) {
    try {
      const cleanup = await refundPayment();
      console.log(JSON.stringify({ cleanupRefundStatus: cleanup.status }));
    } catch {
      console.error('Review Rigforge SDK sandbox refund audit in Stripe Dashboard for test-payment cleanup');
      process.exitCode = 1;
    }
  }
}
