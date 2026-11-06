import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Khảo sát công khai, chỉ đọc; không gửi form đăng ký, liên hệ hay đặt đơn thật.
const directory = '.visual-review/reference-audit';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1340, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const target = process.argv[2] ?? 'https://tinhocngoisao.com/';
const name = process.argv[3] ?? 'home';
try {
  const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  for (const selector of ['.closePopup', '.closeModal', '.modal .close', '.modal-header .close', '.close-popup', '.popup-close', '#popup-modal .close', '.fancybox-close-small', '.ins-close', '[aria-label="Close"]']) {
    const close = page.locator(selector).first();
    if (await close.isVisible().catch(() => false)) await close.click({ timeout: 1500 }).catch(() => {});
  }
  // Đi qua trang để tải hình lazy, giữ tốc độ thấp với website tham khảo.
  for (let y = 0; y < Math.min(await page.locator('body').evaluate(el => el.scrollHeight), 18000); y += 900) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  const snapshot = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    dimensions: { width: innerWidth, content: document.documentElement.scrollWidth, height: document.body.scrollHeight },
    headings: [...document.querySelectorAll('h1,h2,h3,h4')].map(el => ({ tag: el.tagName, text: el.textContent.trim() })).filter(el => el.text),
    links: [...document.querySelectorAll('a[href]')].map(el => ({ text: (el.innerText || el.getAttribute('aria-label') || el.title).trim(), href: el.href, class: el.className })).filter(el => el.text),
    controls: [...document.querySelectorAll('input,select,textarea,button')].map(el => ({ tag: el.tagName, type: el.type, name: el.name, text: (el.innerText || '').trim().slice(0, 180), placeholder: el.getAttribute('placeholder'), class: el.className, visible: el.getBoundingClientRect().width > 0, options: el.tagName === 'SELECT' ? [...el.options].map(o => ({ text: o.text, value: o.value })) : undefined })),
    text: document.body.innerText,
  }));
  snapshot.status = response?.status();
  snapshot.errors = errors;
  await writeFile(`${directory}/${name}.json`, JSON.stringify(snapshot, null, 2));
  await page.screenshot({ path: `${directory}/${name}-1340.png`, fullPage: true });
  await page.screenshot({ path: `${directory}/${name}-top-1340.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${directory}/${name}-390.png`, fullPage: true });
  await page.screenshot({ path: `${directory}/${name}-top-390.png` });
  console.log(JSON.stringify({ name, status: snapshot.status, title: snapshot.title, dimensions: snapshot.dimensions, errors, headings: snapshot.headings.filter(h => h.tag !== 'H3').slice(0, 15), controls: snapshot.controls.filter(el => el.visible && !/new-loop/.test(el.class)).slice(0, 20) }, null, 2));
} finally {
  await browser.close();
}
