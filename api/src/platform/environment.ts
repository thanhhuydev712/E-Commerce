export function validateEnvironment(input: Record<string, unknown>) {
  const result = { ...input };
  result.NODE_ENV = input.NODE_ENV ?? 'development';
  for (const name of [
    'PREVIEW_READ_ONLY',
    'INTERACTIVE_DEMO',
    'DATABASE_TLS_REQUIRED',
  ]) {
    const value = input[name] ?? 'false';
    if (!['true', 'false', true, false].includes(value as string | boolean))
      throw new Error(`${name} must be true or false`);
    result[name] = value === true || value === 'true';
  }
  if (result.INTERACTIVE_DEMO && !result.PREVIEW_READ_ONLY)
    throw new Error('INTERACTIVE_DEMO requires PREVIEW_READ_ONLY');
  // Chỉ hỗ trợ trực tiếp hoặc đúng một reverse proxy đã biết; không trust tùy ý.
  const proxyHops = Number(input.TRUST_PROXY_HOPS ?? 0);
  if (![0, 1].includes(proxyHops))
    throw new Error('TRUST_PROXY_HOPS must be 0 or 1');
  result.TRUST_PROXY_HOPS = proxyHops;
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
  if (
    result.DATABASE_TLS_REQUIRED &&
    (db.searchParams.get('sslmode') !== 'verify-full' ||
      !db.searchParams.get('sslrootcert'))
  )
    throw new Error('Verified database TLS and a root CA are required');
  if (
    result.PREVIEW_READ_ONLY &&
    (input.STRIPE_SECRET_KEY || input.STRIPE_WEBHOOK_SECRET)
  )
    throw new Error('Stripe credentials must be absent in read-only preview');
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
    ['STRIPE_SECRET_KEY', 'sk_test_'],
    ['STRIPE_WEBHOOK_SECRET', 'whsec_'],
  ]) {
    if (
      input[name] &&
      (typeof input[name] !== 'string' ||
        !String(input[name]).startsWith(prefix))
    )
      throw new Error(`Invalid ${name}; only Stripe test mode is supported`);
  }
  if (
    input.STOREFRONT_URL !== undefined &&
    typeof input.STOREFRONT_URL !== 'string'
  )
    throw new Error('Invalid STOREFRONT_URL');
  const storefront = (input.STOREFRONT_URL as string | undefined) || origins[0];
  if (!origins.includes(storefront))
    throw new Error('STOREFRONT_URL must be an allowed origin');
  result.STOREFRONT_URL = storefront;
  const delivery =
    input.CHALLENGE_DELIVERY ||
    (result.NODE_ENV === 'production' ? 'disabled' : 'memory');
  if (
    typeof delivery !== 'string' ||
    !['disabled', 'memory', 'smtp'].includes(delivery)
  )
    throw new Error('Invalid CHALLENGE_DELIVERY');
  if (delivery === 'memory' && result.NODE_ENV === 'production')
    throw new Error('Memory email delivery is not allowed in production');
  if (delivery === 'smtp' && result.PREVIEW_READ_ONLY)
    throw new Error('SMTP must be disabled in read-only preview');
  result.CHALLENGE_DELIVERY = delivery;
  if (delivery === 'smtp') {
    for (const name of [
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASSWORD',
      'SMTP_FROM',
    ]) {
      if (typeof input[name] !== 'string' || !String(input[name]).trim())
        throw new Error(`Missing environment variable: ${name}`);
    }
    if (!/^[a-z0-9.-]+$/i.test(String(input.SMTP_HOST)))
      throw new Error('SMTP_HOST must be a hostname');
    if (!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(String(input.SMTP_FROM)))
      throw new Error('SMTP_FROM must be a single email address');
    const port = Number(input.SMTP_PORT || 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error('Invalid SMTP_PORT');
    result.SMTP_PORT = port;
    const secure = input.SMTP_SECURE ?? port === 465;
    if (!['true', 'false', true, false].includes(secure as string | boolean))
      throw new Error('SMTP_SECURE must be true or false');
    result.SMTP_SECURE = secure === true || secure === 'true';
  }
  return result;
}
