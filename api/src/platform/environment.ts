export function validateEnvironment(input: Record<string, unknown>) {
  const result = { ...input };
  result.NODE_ENV = input.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(String(result.NODE_ENV)))
    throw new Error('Invalid NODE_ENV');
  for (const name of ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'])
    if (typeof result[name] !== 'string' || !result[name])
      throw new Error(`Missing environment variable: ${name}`);
  for (const name of ['JWT_SECRET', 'JWT_REFRESH_SECRET'])
    if (String(result[name]).length < 32)
      throw new Error(`${name} must contain at least 32 characters`);
  if (result.JWT_SECRET === result.JWT_REFRESH_SECRET)
    throw new Error('Access and refresh secrets must be different');
  const db = new URL(String(result.DATABASE_URL));
  if (!['postgres:', 'postgresql:'].includes(db.protocol))
    throw new Error('DATABASE_URL must use PostgreSQL');
  result.DATABASE_SCHEMA =
    input.DATABASE_SCHEMA ?? db.searchParams.get('schema') ?? 'public';
  if (
    !/^[a-z][a-z0-9_]*$/.test(String(result.DATABASE_SCHEMA)) ||
    result.DATABASE_SCHEMA === 'legacy_v1'
  )
    throw new Error('Invalid operational database schema');
  for (const [name, fallback, max] of [
    ['PORT', 3001, 65535],
    ['JWT_EXPIRES_IN', 900, 3600],
    ['REFRESH_TTL_SECONDS', 604800, 2592000],
  ] as const) {
    const value = Number(input[name] ?? fallback);
    if (!Number.isInteger(value) || value < 1 || value > max)
      throw new Error(`Invalid ${name}`);
    result[name] = value;
  }
  if (
    input.ALLOWED_ORIGINS !== undefined &&
    typeof input.ALLOWED_ORIGINS !== 'string'
  )
    throw new Error('Invalid ALLOWED_ORIGINS');
  const origins = (
    (input.ALLOWED_ORIGINS as string | undefined) ?? 'http://localhost:3000'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    !origins.length ||
    origins.some(
      (origin) => new URL(origin).origin !== origin || !/^https?:/.test(origin),
    )
  )
    throw new Error('ALLOWED_ORIGINS must contain exact HTTP origins');
  if (
    input.NODE_ENV === 'production' &&
    origins.some((origin) => !origin.startsWith('https://'))
  )
    throw new Error('Production origins must use HTTPS');
  result.ALLOWED_ORIGINS = origins.join(',');
  for (const [name, prefix] of [
    ['STRIPE_SECRET_KEY', 'sk_test_'], ['STRIPE_WEBHOOK_SECRET', 'whsec_'],
  ]) {
    if (input[name] && (typeof input[name] !== 'string' || !String(input[name]).startsWith(prefix)))
      throw new Error(`Invalid ${name}; only Stripe test mode is supported`);
  }
  const storefront = String(input.STOREFRONT_URL || origins[0]);
  if (!origins.includes(storefront))
    throw new Error('STOREFRONT_URL must be an allowed origin');
  result.STOREFRONT_URL = storefront;
  return result;
}
