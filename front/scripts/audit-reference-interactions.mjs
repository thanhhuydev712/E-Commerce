import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const out = '.visual-review/reference-audit';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1340, height: 1000 } });
const page = await context.newPage();
const cases = [];
const errors = [];
page.on('pageerror', e => errors.push({ url: page.url(), message: e.message }));
async function test(id, title, fn, result = 'PASS') {
  try { const detail = await fn(); cases.push({ id, title, result, detail }); }
  catch (e) { cases.push({ id, title, result: e.message.includes('toBeLessThanOrEqual') ? 'FAIL' : 'UNVERIFIED', detail: e.message.slice(0, 500) }); }
  console.log(JSON.stringify(cases.at(-1)));
}
async function visit(path, name) {
  const response = await page.goto(`https://tinhocngoisao.com${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);
  for (const selector of ['.closePopup', '.closeModal']) {
    const button = page.locator(selector).first();
    if (await button.isVisible()) await button.click({ timeout: 2000 }).catch(() => {});
  }
  await page.screenshot({ path: `${out}/${name}-top-1340.png` });
  return response;
}
try {
  await visit('/', 'home');
  await test('REF-01', 'Tìm kiếm gợi ý khi nhập từ khóa', async () => {
    await page.locator('input[name=q]').first().pressSequentially('rtx', { delay: 80 });
    await page.waitForTimeout(1800);
    await expect(page.locator('#ajaxSearchResults')).toBeVisible({ timeout: 8000 });
    const suggestions = await page.locator('#ajaxSearchResults a[href*="/products/"]').count();
    await page.screenshot({ path: `${out}/search-suggestions.png` });
    expect(suggestions).toBeGreaterThan(0);
    return { suggestionLinks: suggestions };
  });
  await test('REF-02', 'Submit tìm kiếm chuyển sang trang kết quả', async () => {
    await page.locator('input[name=q]').first().press('Enter');
    await expect(page).toHaveURL(/search/);
    return { url: page.url() };
  });
  await visit('/collections/pc-gaming', 'catalog');
  await test('REF-03', 'Bộ lọc và sắp xếp công khai', async () => {
    const controls = await page.locator('main a, main button, .collection a, .collection button').evaluateAll(els => els.map(el => ({ text: el.innerText.trim(), href: el.getAttribute('href'), class: el.className })).filter(el => /Giá|giá|mới|Mới|Bán|bán|CPU|VGA|Lọc|lọc/.test(el.text)).slice(0, 35));
    await writeFile(`${out}/catalog-filter-controls.json`, JSON.stringify(controls, null, 2));
    expect(await page.locator('.priceRange-input-min').count()).toBeGreaterThan(0);
    return { controls: controls.slice(0, 8), note: 'Xác nhận hiện diện; chưa khẳng định mọi tổ hợp lọc hoạt động.' };
  }, 'OBSERVED');
  const snapshot = JSON.parse(await readFile(`${out}/home.json`, 'utf8'));
  const productUrl = snapshot.links.find(link => /\/products\//.test(link.href)).href;
  await visit(new URL(productUrl).pathname, 'product');
  await test('REF-04', 'Nút tăng giảm số lượng sản phẩm', async () => {
    const input = page.locator('input[name=quantity]').first();
    const before = await input.inputValue();
    await page.locator('.qty-btn').nth(1).click();
    await expect(input).toHaveValue(String(Number(before) + 1));
    await page.locator('.qty-btn').first().click();
    await expect(input).toHaveValue(before);
    return { before, after: await input.inputValue() };
  });
  await test('REF-05', 'Thêm sản phẩm vào giỏ khách', async () => {
    await page.locator('.add-to-cartProduct').first().click();
    await page.waitForTimeout(1200);
    await visit('/cart', 'cart-filled');
    await expect(page.locator('body')).toContainText('Rapoo V500');
    await writeFile(`${out}/cart-filled-dom.json`, JSON.stringify(await page.locator('input,button,a').evaluateAll(els => els.map(el => ({ tag: el.tagName, text: el.innerText.trim().slice(0,100), name: el.name, class: el.className, href: el.getAttribute('href') })).filter(el => /qty|quantity|remove|delete|checkout|check-out|Thanh toán|Đặt hàng|Xóa/.test(JSON.stringify(el)))), null, 2));
    return { url: page.url(), note: 'Chỉ giỏ khách; không tạo đơn.' };
  });
  await visit('/pages/xay-dung-cau-hinh', 'builder');
  await test('REF-06', 'Builder mở bộ chọn CPU', async () => {
    await page.locator('.btn-select__build').filter({ hasText: 'Chọn CPU' }).click({ timeout: 8000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${out}/builder-picker.png` });
    const dialogs = await page.locator('[role=dialog]:visible,.modal:visible').count();
    return { dialogs, note: 'Ảnh ghi lại trạng thái bộ chọn; chưa thử chọn mọi nhóm hoặc xuất cấu hình.' };
  }, 'OBSERVED');
  await visit('/pages/he-thong-showroom-1', 'showrooms');
  await test('REF-07', 'Lọc showroom theo tỉnh và xóa lọc', async () => {
    await page.locator('select').nth(1).selectOption('daklak');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/showroom-filtered.png` });
    expect(await page.locator('select').nth(1).inputValue()).toBe('daklak');
    await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
    expect(await page.locator('select').nth(1).inputValue()).toBe('all');
    return 'Chọn tỉnh và reset hoạt động; bản đồ ngoài chưa kiểm tra chỉ đường thực tế.';
  });
  for (const width of [390, 768, 1340]) {
    await page.setViewportSize({ width, height: 900 });
    await visit('/collections/pc-gaming', `catalog-${width}`);
    await test(`REF-08-${width}`, `Chiều ngang danh mục ${width}px`, async () => {
      const size = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport);
      return size;
    });
  }
} finally {
  await writeFile(`${out}/interactions.json`, JSON.stringify({ date: '2026-11-06', cases, errors }, null, 2));
  await browser.close();
}
