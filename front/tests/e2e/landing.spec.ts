import { registerRealAccount } from "../helpers/real-account";
import { expect, test } from "@playwright/test";

test("landing đổi chiến dịch, nhóm sản phẩm và giữ giỏ sau refresh", async ({
  page,
}) => {
  await registerRealAccount(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "PC, linh kiện và gaming gear Rigforge",
  );
  await page.getByRole("button", { name: "Banner sau", exact: true }).click();
  await expect(page.locator("#hero-slide-pc")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await page.getByRole("button", { name: "Banner trước", exact: true }).click();
  await expect(page.locator("#hero-slide-asus")).toHaveAttribute(
    "aria-hidden",
    "false",
  );

  const collections = page.locator(".rf-reference-shelf").first();
  await collections
    .getByRole("button", { name: "PC văn phòng", exact: true })
    .click();
  await expect(collections.locator(".rf-reference-card")).toHaveCount(2);
  await expect(collections.locator(".rf-shelf-more a")).toHaveAttribute(
    "href",
    "/products?category=pc",
  );

  await page
    .locator(".rf-reference-campaign")
    .getByRole("button", { name: /^Thêm .+ vào giỏ$/ })
    .first()
    .click();
  await expect(
    page.getByRole("link", { name: "Giỏ hàng 1 sản phẩm", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Giỏ hàng 1 sản phẩm", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("menu có thể dùng bàn phím, tìm kiếm dẫn đến kết quả mẫu", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Danh mục sản phẩm", exact: true })
    .click();
  await expect(page.locator("#rf-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#rf-menu")).toHaveCount(0);
  await page.getByRole("combobox", { name: "Tìm kiếm sản phẩm" }).fill("Ryzen");
  await page
    .getByRole("combobox", { name: "Tìm kiếm sản phẩm" })
    .press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ryzen");
  await expect(page.locator(".rf-product-card").first()).toBeVisible();
  await page.goto("/products?max=invalid");
  await expect(page.locator(".rf-product-card").first()).toBeVisible();
});

test("landing đủ các khối, tab chiến dịch và rail hoạt động trên mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".rf-reference-shelf")).toHaveCount(9);
  await expect(page.locator(".rf-directory-grid>a")).toHaveCount(20);
  await expect(page.locator(".rf-showroom-grid>article")).toHaveCount(8);
  const campaign = page.locator(".rf-reference-campaign");
  await campaign.getByRole("button", { name: /MÀN HÌNH GAMING/ }).click();
  await expect(campaign.locator("h2")).toHaveText("MÀN HÌNH GAMING");
  await expect(campaign.locator(".rf-campaign-more")).toHaveAttribute(
    "href",
    "/products?category=monitor",
  );
  const viewport = campaign.locator(".rf-reference-rail-viewport");
  await campaign.getByRole("button", { name: "Sản phẩm tiếp theo" }).click();
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(50);
  await campaign.getByRole("button", { name: "Sản phẩm trước" }).click();
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollLeft))
    .toBeLessThan(5);
});

test("blog lọc theo nhóm, từ khóa và có trạng thái không tìm thấy", async ({
  page,
}) => {
  await page.goto("/");
  const blog = page.getByRole("region", { name: "Blog tin tức" });
  await expect(blog.locator(".rf-popular-posts li")).toHaveCount(8);
  await blog.getByRole("button", { name: "Hướng dẫn", exact: true }).click();
  await expect(blog.locator(".rf-popular-posts li")).toHaveCount(3);
  await blog.getByRole("button", { name: "Tất cả", exact: true }).click();
  await blog.getByRole("textbox", { name: "Tìm bài viết" }).fill("SSD");
  await expect(blog.locator(".rf-popular-posts li")).toHaveCount(1);
  await expect(blog.locator(".rf-popular-posts")).toContainText("Ổ SSD");
  await blog
    .getByRole("textbox", { name: "Tìm bài viết" })
    .fill("khongcobai123");
  await expect(blog.getByText(/Không tìm thấy bài viết phù hợp/)).toBeVisible();
});

test("landing không gọi Stripe trực tiếp và không tải renderer 3D", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  expect(
    requests.filter((url) => /api\.stripe|localhost:3001/.test(url)),
  ).toEqual([]);
  expect(
    requests.filter((url) => /pc-scene|react-three|three\.module/.test(url)),
  ).toEqual([]);
});

for (const width of [360, 390, 768, 1024, 1340, 1920]) {
  test(`landing không tràn ngang ở ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
    // Ảnh phục vụ review local; output nằm trong test-results đã được gitignore.
    if (width === 390 || width === 1340)
      await page.screenshot({
        path: testInfo.outputPath(`landing-${width}.png`),
        fullPage: true,
        // Không để Playwright sửa inline caret style trong lúc React hydrate header.
        caret: "initial",
      });
  });
}

test("CTA studio mở builder và quy tắc DDR bắt được xung đột", async ({
  page,
}) => {
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(
    page.getByRole("button", { name: "Thêm cấu hình vào giỏ" }),
  ).toBeEnabled();
  await page
    .locator(".rf-build-slot")
    .filter({ hasText: "Kingston FURY" })
    .locator(".rf-slot-select")
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .locator(".rf-picker-list>div")
    .filter({
      has: page.getByText("RAM Corsair Vengeance LPX 16GB DDR4", {
        exact: true,
      }),
    })
    .getByRole("button", { name: "Chọn" })
    .click();
  await expect(
    page.getByText("RAM và mainboard khác thế hệ DDR.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Thêm cấu hình vào giỏ" }),
  ).toBeDisabled();
});

test("mọi liên kết trên landing có trang đích, URL lạ trả 404", async ({
  page,
  request,
}) => {
  test.setTimeout(240000);
  await page.goto("/");
  const links = await page
    .locator('a[href^="/"]')
    .evaluateAll((anchors) => [
      ...new Set(anchors.map((anchor) => anchor.getAttribute("href")!)),
    ]);
  // Bound concurrency for a remote test database while still checking every link.
  for (let index = 0; index < links.length; index += 2)
    await Promise.all(
      links.slice(index, index + 2).map(async (href) => {
        const response = await request.get(href);
        expect(response.status(), href).toBe(200);
      }),
    );
  expect((await request.get("/trang-khong-ton-tai")).status()).toBe(404);
});
