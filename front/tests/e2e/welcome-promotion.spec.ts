import { expect, test } from "@playwright/test";
import { WELCOME_PROMOTION_COOKIE } from "../../src/config/welcome-promotion";

test.use({ storageState: { cookies: [], origins: [] } });
const title = "Chào bạn đến RIGFORCE STORE";

test("popup mở lần đầu, giữ focus và không lặp khi refresh hoặc đổi trang", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const popup = page.getByRole("dialog", { name: title });
  await expect(popup).toBeVisible();
  await expect(
    popup.getByRole("button", { name: "Đóng", exact: true }),
  ).toBeFocused();
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press("Tab");
    expect(
      await popup.evaluate(
        (element) =>
          // Native dialog có thể nhường Tab cho thanh địa chỉ, nhưng không cho focus nền trang.
          element.contains(document.activeElement) ||
          document.activeElement === document.body,
      ),
    ).toBe(true);
  }
  expect(
    (await context.cookies()).find(
      (cookie) => cookie.name === WELCOME_PROMOTION_COOKIE,
    )?.expires,
  ).toBe(-1);
  expect(await page.evaluate(() => document.body.style.position)).toBe("fixed");
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.position)).not.toBe(
    "fixed",
  );
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(popup).toHaveCount(0);
  await page.goto("/products");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(popup).toHaveCount(0);
});

test("phiên mới có popup trên catalog, CTA tới ưu đãi và không mở lại", async ({
  page,
}) => {
  await page.goto("/products");
  const popup = page.getByRole("dialog", { name: title });
  await expect(popup).toBeVisible();
  await popup
    .getByRole("link", { name: "Khám phá ưu đãi", exact: true })
    .click();
  await expect(page).toHaveURL(/\/promotions$/);
  await expect(popup).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.position)).not.toBe(
    "fixed",
  );
});

test("đóng bằng nút và backdrop, phiên đã xem không hiện popup", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const popup = page.getByRole("dialog", { name: title });
  await expect(popup).toBeVisible();
  await popup.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await context.clearCookies();
  await page.reload();
  await expect(popup).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(popup).toHaveCount(0);
});

test("không mở trên đăng nhập, giỏ hoặc PC Studio; mở khi tới storefront", async ({
  page,
}) => {
  for (const route of ["/login", "/cart", "/pc-builder"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() =>
        document.cookie.includes("rigforce-welcome-v1"),
      ),
    ).toBe(false);
    await expect(page.getByRole("dialog", { name: title })).toHaveCount(0);
  }
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: title })).toBeVisible();
});

test("mobile không cắt ảnh, cuộn được tới CTA và hỗ trợ giảm chuyển động", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 650 });
  await page.goto("/");
  const popup = page.getByRole("dialog", { name: title });
  await expect(popup).toBeVisible();
  const image = popup.getByRole("img");
  await image.evaluate((element) => (element as HTMLImageElement).decode());
  expect(
    await image.evaluate((element) => getComputedStyle(element).objectFit),
  ).toBe("contain");
  const rect = (await popup.boundingBox())!;
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.y).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(390);
  expect(rect.y + rect.height).toBeLessThanOrEqual(650);
  expect(
    await popup.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  expect(
    await popup.evaluate(
      (element) => getComputedStyle(element).transitionProperty,
    ),
  ).toBe("none");
  await popup.screenshot({ path: info.outputPath("popup-mobile.png") });
  await popup
    .getByRole("link", { name: "Tự xây cấu hình", exact: true })
    .click();
  await expect(page).toHaveURL(/\/pc-builder$/);
  await expect(popup).toHaveCount(0);
});
