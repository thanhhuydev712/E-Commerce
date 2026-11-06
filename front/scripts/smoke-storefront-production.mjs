import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Chạy sau npm run build và next start ở terminal khác; chỉ kiểm artifact local.
const origin = new URL(process.argv[2] ?? 'http://localhost:3100');
if (!['localhost', '127.0.0.1'].includes(origin.hostname)) throw new Error('Smoke này chỉ dùng server local.');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1340, height: 1000 } });
const result = { pages: [], navigation: [], errors: [], apiRequests: [] };
page.on('pageerror', error => result.errors.push(error.message));
page.on('request', request => { if (/\/api\/|api\.stripe/.test(request.url())) result.apiRequests.push(request.url()); });
await mkdir('.visual-review', { recursive: true });
try {
  for (const route of ['/', '/products?category=pc', '/showrooms', '/promotions', '/articles', '/warranty', '/login', '/pc-builder']) {
    const response = await page.goto(new URL(route, origin).href);
    expect(response.status(), route).toBe(200);
    await expect(page.locator('main h1:visible').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, route).toBe(false);
    result.pages.push({ route, status: response.status(), overflow });
  }
  await page.goto(new URL('/promotions', origin).href);
  await page.locator('#promotion-monitor .rf-promotion-group-more').click();
  await expect(page.locator('.rf-catalog-reference:visible h1')).toBeVisible();
  await expect(page.locator('.rf-reference-header')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('navigation', { name: 'Điều hướng chiến dịch' })).toBeVisible();
  result.navigation.push('campaign → catalog → Back: header đúng');
  await page.goto(new URL('/products/ssd-kingston', origin).href);
  await page.getByRole('button', { name: 'Thêm vào giỏ', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByRole('heading', { name: 'Tài khoản Rigforge', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: '.visual-review/local-auth-390.png', fullPage: true, caret: 'initial' });
  result.navigation.push('Khách thêm sản phẩm được chuyển tới đăng nhập; luồng có tài khoản được kiểm riêng bằng fullstack schema test.');
  expect(result.errors).toEqual([]);
  expect(result.apiRequests.filter(url => /api\.stripe/.test(url))).toEqual([]);
  result.passed = true;
} catch (error) {
  result.passed = false;
  result.failure = error.message;
  process.exitCode = 1;
} finally {
  await writeFile('.visual-review/production-smoke.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  await browser.close();
}
