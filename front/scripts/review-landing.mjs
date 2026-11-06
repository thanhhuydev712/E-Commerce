import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Chụp theo từng mốc để đối chiếu ảnh mẫu sau mỗi phần, không chỉ chụp một lần cuối.
const stage = process.argv[2] ?? "review";
await mkdir(".visual-review", { recursive: true });
const browser = await chromium.launch();
// Truyền thêm kích thước để review riêng tablet mà không phải chụp lại mọi thiết bị.
const widths = process.argv
  .slice(3)
  .map(Number)
  .filter((width) => Number.isInteger(width) && width >= 320 && width <= 2560);
for (const width of widths.length ? widths : [1340, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator(".rf-reference-hero-image img")
    .first()
    .evaluate(async (image) => {
      await image.decode();
    });
  if (stage !== "top") {
    // Lazy image chỉ tải khi vào viewport; đi qua từng section trước khi chụp full-page.
    for (const section of await page.locator("main section").all()) {
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
    }
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.screenshot({
    path: `.visual-review/${stage}-${width}.png`,
    fullPage: stage !== "top",
    caret: "initial",
  });
  console.log(
    JSON.stringify({
      stage,
      width,
      errors,
      height: await page.locator("body").evaluate((el) => el.scrollHeight),
      overflow: await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    }),
  );
  await page.close();
}
await browser.close();
