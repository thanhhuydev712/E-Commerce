import { registerRealAccount } from "../helpers/real-account";
import { expect, test } from "@playwright/test";

test("gợi ý tìm kiếm không dấu dùng được bằng bàn phím và đóng bằng Escape", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Tìm kiếm sản phẩm" });
  await input.fill("man hinh");
  await expect(input).toHaveAttribute("aria-expanded", "true");
  const options = page.getByRole("option");
  await expect(options.first()).toContainText(/màn hình/i);
  const target = await options.first().getByRole("link").getAttribute("href");
  await input.press("Escape");
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page).toHaveURL(target!);
});

test("menu chia nhóm linh kiện và link con áp bộ lọc đúng", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Danh mục sản phẩm", exact: true })
    .click();
  const menu = page.locator("#rf-menu");
  await expect(menu.locator("nav > a")).toHaveCount(11);
  await menu.getByRole("link", { name: "Linh kiện", exact: true }).focus();
  await expect(
    menu.getByRole("heading", { name: "Linh kiện", exact: true }),
  ).toBeVisible();
  await menu.getByRole("link", { name: "RAM DDR5", exact: true }).click();
  await expect(page).toHaveURL(/category=ram&q=DDR5/);
  await expect(page.locator(".rf-product-card").first()).toBeVisible();
  await expect(page.locator(".rf-reference-card-name").first()).toContainText(
    /DDR5/i,
  );
});

test("sắp xếp giữ danh mục từ route và tiền tăng dần, refresh giữ trạng thái", async ({
  page,
}) => {
  await page.goto("/categories/pc");
  await page.getByRole("button", { name: "Giá tăng dần", exact: true }).click();
  await expect(page).toHaveURL(/category=pc.*sort=low/);
  const prices = await page
    .locator(".rf-catalog-grid:visible .rf-reference-card-price strong")
    .allTextContents();
  const values = prices.map((value) => Number(value.replace(/\D/g, "")));
  expect(values.length).toBeGreaterThan(1);
  expect(values).toEqual([...values].sort((a, b) => a - b));
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Giá tăng dần", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("h1")).toContainText("PC Gaming");
});

test("khoảng min/max và bỏ chip lọc cho kết quả đúng, không mất thương hiệu từ route", async ({
  page,
}) => {
  await page.goto("/brands/ASUS");
  await page.locator("#catalog-filters summary").click();
  await page.getByLabel("Giá từ (₫)", { exact: true }).fill("5000000");
  await page.getByLabel("Giá đến (₫)", { exact: true }).fill("30000000");
  await page.getByRole("button", { name: "Áp dụng giá" }).click();
  await expect(page).toHaveURL(/brand=ASUS/);
  await expect(page.locator(".rf-product-card").first()).toBeVisible();
  const prices = await page
    .locator(".rf-catalog-grid .rf-reference-card-price strong")
    .allTextContents();
  expect(
    prices.every((value) => {
      const amount = Number(value.replace(/\D/g, ""));
      return amount >= 5000000 && amount <= 30000000;
    }),
  ).toBe(true);
  await page.getByRole("button", { name: "Bỏ lọc ASUS", exact: true }).click();
  await expect(page).not.toHaveURL(/brand=/);
  await expect(page).toHaveURL(/min=5000000/);
});

test("facet RAM kết hợp query và trạng thái không có kết quả", async ({
  page,
}) => {
  await page.goto("/products?category=ram");
  await page
    .getByRole("combobox", { name: "Lọc RAM", exact: true })
    .selectOption("DDR5");
  await expect(page.locator(".rf-reference-card-name").first()).toContainText(
    "DDR5",
  );
  await page.goto("/products?q=khong-co-san-pham-123");
  await expect(
    page.getByRole("heading", { name: "Chưa tìm thấy sản phẩm phù hợp" }),
  ).toBeVisible();
  await page.goto("/products?min=invalid&max=NaN&page=1.5");
  await expect(page.locator(".rf-product-card")).toHaveCount(20);
  await expect(
    page.getByRole("button", { name: "1", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("mobile bật bộ lọc, chọn thương hiệu và xóa chip", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products");
  const toggle = page.getByRole("button", {
    name: "Bộ lọc sản phẩm",
    exact: true,
  });
  await expect(page.locator("#catalog-filters")).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("combobox", { name: "Lọc thương hiệu" })
    .selectOption("ASUS");
  await expect(page).toHaveURL(/brand=ASUS/);
  await page.getByRole("button", { name: "Bỏ lọc ASUS", exact: true }).click();
  await expect(page).not.toHaveURL(/brand=ASUS/);
});

test("ảnh sản phẩm phóng to và đóng trả focus, neo thông số đổi nội dung", async ({
  page,
}) => {
  await page.goto("/products/ssd-kingston");
  const trigger = page.getByRole("button", { name: "Phóng to ảnh sản phẩm" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page
    .getByRole("link", { name: "Thông số kỹ thuật", exact: true })
    .click();
  await expect(
    page.locator(".rf-detail-content .rf-tabs button").first(),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator(".rf-detail-content section .rf-spec-table"),
  ).toContainText("Kingston");
});

test("showroom lọc liên hoàn, chọn điểm và reset", async ({ page }) => {
  await page.goto("/showrooms");
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chiến dịch" }),
  ).toBeVisible();
  await expect(page.locator(".rf-showroom-list > button")).toHaveCount(8);
  await page.getByLabel("Khu vực", { exact: true }).selectOption("highlands");
  await expect(page.locator(".rf-showroom-list > button")).toHaveCount(1);
  await expect(page.locator(".rf-showroom-location h2")).toHaveText(
    "Showroom Đắk Lắk",
  );
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.locator(".rf-showroom-list > button")).toHaveCount(8);
  await page.locator(".rf-showroom-list > button").nth(1).click();
  await expect(page.locator(".rf-showroom-location h2")).toHaveText(
    "Showroom Thủ Đức",
  );
  await expect(page.locator(".rf-map-placeholder")).toContainText(
    "Khu vực Thủ Đức",
  );
});

test("trang khuyến mãi neo đúng nhóm, sản phẩm đi được tới giỏ", async ({
  page,
}) => {
  await registerRealAccount(page);
  await page.goto("/promotions");
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chiến dịch" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Nhóm khuyến mãi" })
    .getByRole("link", { name: "MÀN HÌNH", exact: true })
    .click();
  await expect(page).toHaveURL(/#promotion-monitor/);
  const added = page.waitForResponse(
    (r) =>
      r.url().endsWith("/me/cart/items") && r.request().method() === "POST",
    { timeout: 60000 },
  );
  await page
    .locator("#promotion-monitor")
    .getByRole("button", { name: /^Thêm .+ vào giỏ$/ })
    .first()
    .click();
  expect((await added).status()).toBe(201);
  await page.goto("/cart");
  await expect(
    page.getByRole("link", { name: "Giỏ hàng 1 sản phẩm", exact: true }),
  ).toBeVisible();
});

test("trang tin có tìm kiếm, danh sách và bài viết liên quan", async ({
  page,
}) => {
  await page.goto("/articles");
  await page.getByRole("textbox", { name: "Tìm bài viết" }).fill("SSD");
  await expect(page.locator(".rf-journal-list > article")).toHaveCount(1);
  await page.locator(".rf-journal-list h2 a").click();
  await expect(page.locator(".rf-news-article-layout h1")).toContainText("SSD");
  await expect(page.locator(".rf-related-articles li")).toHaveCount(7);
});

const routes = [
  "/products?category=pc",
  "/products/ssd-kingston",
  "/showrooms",
  "/promotions",
  "/articles",
  "/login",
  "/cart",
  "/warranty",
  "/pc-builder",
];

test("header theo URL khi đi từ campaign tới catalog và quay lại từ checkout", async ({
  page,
}) => {
  await registerRealAccount(page);
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text()))
      hydrationErrors.push(message.text());
  });
  await page.goto("/promotions");
  await page.locator("#promotion-monitor .rf-promotion-group-more").click();
  await expect(page.locator(".rf-catalog-reference:visible h1")).toBeVisible();
  await expect(page.locator(".rf-reference-header")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chiến dịch" }),
  ).toBeHidden();
  await page.goBack();
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chiến dịch" }),
  ).toBeVisible();
  await page.goto("/products/ssd-kingston");
  const added = page.waitForResponse(
    (r) =>
      r.url().endsWith("/me/cart/items") && r.request().method() === "POST",
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "Thêm vào giỏ", exact: true }).click();
  expect((await added).status()).toBe(201);
  await page
    .getByRole("link", { name: "Giỏ hàng 1 sản phẩm", exact: true })
    .click();
  await page.getByRole("link", { name: "Tiến hành đặt hàng" }).click();
  await expect(page.getByLabel("Địa chỉ", { exact: true })).toBeVisible();
  await expect(
    page.locator(".rf-reference-header-main .rf-menu-button"),
  ).toBeHidden();
  await page.getByRole("link", { name: /Quay lại giỏ hàng/ }).click();
  await expect(
    page.getByRole("button", { name: "Danh mục sản phẩm", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Giỏ hàng 1 sản phẩm", exact: true }),
  ).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});

test("so sánh giữ hai sản phẩm và có thể bỏ từng sản phẩm", async ({
  page,
}) => {
  for (const slug of ["ssd-kingston", "ryzen-7600"]) {
    await page.goto(`/products/${slug}`);
    await page
      .getByRole("button", { name: "Thêm so sánh", exact: true })
      .click();
  }
  await page.goto("/compare");
  await expect(page.locator(".rf-compare-table thead th")).toHaveCount(3);
  await page.reload();
  await expect(page.locator(".rf-compare-table thead th")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Bỏ khỏi so sánh", exact: true })
    .first()
    .click();
  await expect(page.locator(".rf-compare-table thead th")).toHaveCount(2);
});

for (const width of [390, 768, 1340]) {
  test(`các template storefront không tràn ngang hoặc lỗi JS ở ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main h1").first()).toBeVisible();
      const size = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(size.content, route).toBeLessThanOrEqual(size.viewport);
      if (width !== 768)
        await page.screenshot({
          path: testInfo.outputPath(
            `${route.split("?")[0].replaceAll("/", "-")}-${width}.png`,
          ),
          caret: "initial",
        });
    }
    expect(errors).toEqual([]);
  });
}
