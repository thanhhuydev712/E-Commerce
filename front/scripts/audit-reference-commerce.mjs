import { chromium, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const out = '.visual-review/reference-audit';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1340, height: 1000 } });
const page = await context.newPage();
const cases = [];
async function check(id, title, run) {
  try { const detail = await run(); cases.push({ id, title, result: detail?.monotonic === false ? 'OBSERVED' : 'PASS', detail }); }
  catch (error) { cases.push({ id, title, result: 'UNVERIFIED', detail: error.message.slice(0, 450) }); }
  console.log(JSON.stringify(cases.at(-1)));
}
async function visit(path) {
  await page.goto(`https://tinhocngoisao.com${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);
  for (const selector of ['.closePopup', '.closeModal']) if (await page.locator(selector).first().isVisible()) await page.locator(selector).first().click({ timeout: 2000 }).catch(() => {});
}
try {
  await visit('/collections/pc-gaming');
  await check('REF-09', 'Sắp xếp danh mục tăng giá', async () => {
    const selector = '.product-item:visible .pdPrice';
    const first = page.locator('.product-item:visible .product-link').first();
    const previous = await first.getAttribute('href');
    await page.locator('li[value="price-ascending"]').click();
    await expect.poll(() => first.getAttribute('href'), { timeout: 12000 }).not.toBe(previous);
    const prices = await page.locator(selector).allTextContents();
    await page.screenshot({ path: `${out}/catalog-sorted.png` });
    const values = prices.map(text => Number(text.split('₫')[0].replace(/\D/g, ''))).filter(Boolean);
    expect(values.length).toBeGreaterThan(1);
    const monotonic = values.every((value, index) => index === 0 || value >= values[index - 1]);
    return { url: page.url(), checkedPrices: values, monotonic, note: monotonic ? 'Giá hiển thị tăng dần trong mẫu.' : 'Giá hiển thị có cặp không tăng dần. Có thể thứ tự theo giá gốc khác giá khuyến mãi; chưa xác minh thuật toán server.' };
  });
  await check('REF-10', 'Mở và đóng cài đặt cookie', async () => {
    await page.locator('.ths-cookie-btn-settings').click();
    await expect(page.locator('.ths-settings-close')).toBeVisible();
    await page.screenshot({ path: `${out}/cookie-settings.png` });
    await page.locator('.ths-settings-close').click();
    await expect(page.locator('.ths-settings-close')).toBeHidden();
    return 'Chỉ mở và đóng cài đặt; không xác nhận cookie quảng cáo.';
  });
  const home = JSON.parse(await readFile(`${out}/home.json`, 'utf8'));
  await visit(new URL(home.links.find(link => /\/products\//.test(link.href)).href).pathname);
  const [added] = await Promise.all([
    page.waitForResponse(response => /\/cart\/add/.test(response.url()), { timeout: 10000 }),
    page.locator('.add-to-cartProduct').first().click(),
  ]);
  await added.finished();
  await page.waitForTimeout(500);
  await visit('/cart');
  await check('REF-11', 'Giới hạn số lượng sản phẩm khuyến mãi trong giỏ khách', async () => {
    const input = page.locator('.line-item-qty').first();
    await writeFile(`${out}/cart-quantity-controls.html`, await page.locator('.cart__remove').first().evaluate(el => el.closest('tr')?.outerHTML ?? el.parentElement.parentElement.outerHTML));
    await expect(input).toBeVisible();
    await input.fill('2');
    await input.press('Tab');
    await page.waitForTimeout(1400);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.line-item-qty').first()).toHaveValue('1');
    await page.screenshot({ path: `${out}/cart-quantity-two.png` });
    return 'Nhập 2 nhưng sau reload còn 1; dòng hàng có data-buyone=True, trang chi tiết ghi tối đa 1 chiếc/đơn. Chưa thử sản phẩm không có điều kiện này.';
  });
  await check('REF-12', 'Mở checkout khách, không gửi đơn', async () => {
    await page.locator('input[name="checkout"]').click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1600);
    expect(page.url()).toMatch(/checkout|checkouts/);
    const controls = await page.locator('input,select,button').evaluateAll(els => els.filter(el => el.getBoundingClientRect().width > 0).map(el => ({ tag: el.tagName, type: el.type, name: el.name, placeholder: el.getAttribute('placeholder'), text: el.tagName === 'BUTTON' ? el.textContent.trim() : '' })));
    await page.screenshot({ path: `${out}/checkout-guest.png` });
    await writeFile(`${out}/checkout-controls.json`, JSON.stringify(controls, null, 2));
    return { path: '/checkouts/[shop]/[session]', visibleControls: controls.length, note: 'Không điền thông tin và không bấm nút đặt hàng/thanh toán.' };
  });
  await visit('/cart');
  await check('REF-13', 'Xóa dòng hàng khỏi giỏ khách', async () => {
    await page.locator('.cart__remove').first().click();
    await expect(page.locator('.line-item-qty')).toHaveCount(0, { timeout: 8000 });
    await page.screenshot({ path: `${out}/cart-cleared.png` });
    return 'Không còn dòng hàng trong phiên khách khảo sát.';
  });
} finally {
  await writeFile(`${out}/commerce-interactions.json`, JSON.stringify({ date: '2026-11-06', cases }, null, 2));
  await browser.close();
}
