// Explicit opt-in provider check. Creates then expires a sandbox Checkout Session.
// Does not access the database, enter a card, confirm a charge or print secrets/URLs.
import 'reflect-metadata';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { builtFile } = createRequire(import.meta.url)('../scripts/build-path.cjs');
const { StripeGateway } = await import(pathToFileURL(builtFile('modules', 'commerce', 'stripe.gateway.js')).href);

if (process.env.RUN_STRIPE_SANDBOX_SMOKE !== '1')
  throw new Error(
    'Set RUN_STRIPE_SANDBOX_SMOKE=1 to create and expire a test Session',
  );
if (process.env.NODE_ENV === 'production')
  throw new Error('Refusing a production environment');
const gateway = new StripeGateway(new ConfigService(process.env));
gateway.assertAvailable();
const id = randomUUID();
let session;
try {
  await gateway.accountId();
  const input = {
    attemptId: id,
    paymentId: randomUUID(),
    orderId: randomUUID(),
    number: 'SDK-SANDBOX-SMOKE',
    amount: 1000000n,
    expiresAt: new Date(Date.now() + 61 * 60 * 1000),
    origin: 'http://localhost:3000',
    key: `sandbox-smoke:${id}`,
  };
  session = await gateway.create(input);
  const repeated = await gateway.create(input);
  const read = await gateway.retrieve(session.id);
  if (
    session.livemode ||
    repeated.id !== session.id ||
    read.currency !== 'vnd' ||
    read.amount_total !== 1000000 ||
    read.adaptive_pricing?.enabled !== false
  )
    throw new Error('Unexpected Stripe sandbox Session result');
  console.log(
    JSON.stringify({
      account: 'verified',
      mode: 'TEST',
      currency: 'VND',
      amount: '1000000',
      checkoutCreated: true,
      sameKeySameSession: true,
      retrieved: true,
      adaptivePricing: false,
    }),
  );
} catch (cause) {
  // Stripe error objects may contain request details; report only a controlled code.
  console.error(
    JSON.stringify({
      stripeSandboxSmoke: 'failed',
      code: typeof cause?.code === 'string' ? cause.code : 'PROVIDER_ERROR',
    }),
  );
  process.exitCode = 1;
} finally {
  if (session?.status === 'open' && !session.livemode) {
    try {
      const expired = await gateway.expire(session.id);
      console.log(
        JSON.stringify({ checkoutExpired: expired.status === 'expired' }),
      );
    } catch {
      console.error(
        'Sandbox cleanup requires expiring the SDK-SANDBOX-SMOKE Session in Stripe Dashboard',
      );
      process.exitCode = 1;
    }
  }
}
