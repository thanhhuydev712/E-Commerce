import { expect, test, type Page } from "@playwright/test";
import { registerRealAccount } from "../helpers/real-account";

test("phiên hết hạn xóa dữ liệu riêng và yêu cầu đăng nhập lại", async ({
  page,
}) => {
  await registerRealAccount(page);
  await addSsd(page);
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "Xin chào, UI Buyer" }),
  ).toBeVisible();
  await page.route("**/api/v1/me/addresses", (route) =>
    route.fulfill({
      status: 401,
      json: { error: { message: "Session expired" } },
    }),
  );
  await page.route("**/api/v1/auth/session", (route) =>
    route.fulfill({
      status: 401,
      json: { error: { message: "Session expired" } },
    }),
  );
  await page.getByRole("link", { name: "Sổ địa chỉ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vui lòng đăng nhập", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Giỏ hàng 0 sản phẩm", exact: true }),
  ).toBeVisible();
});

async function addSsd(page: Page) {
  await page.goto("/products/ssd-kingston");
  const added = page.waitForResponse(
    (response) =>
      response.url().endsWith("/me/cart/items") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Thêm vào giỏ", exact: true }).click();
  expect((await added).ok()).toBe(true);
}

test("đổi mật khẩu xóa phiên trên giao diện trước khi quay lại đăng nhập", async ({
  page,
}) => {
  await registerRealAccount(page);
  await page.goto("/account/security");
  await page
    .getByLabel("Mật khẩu hiện tại", { exact: true })
    .fill("FullstackPassword-2026!");
  await page
    .getByLabel("Mật khẩu mới", { exact: true })
    .fill("UpdatedFullstackPassword-2026!");
  await page
    .getByRole("button", {
      name: "Đổi mật khẩu và đăng xuất các phiên",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator(".rf-header-action")).toContainText(
    "Đăng nhập/Đăng ký",
  );
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "Vui lòng đăng nhập", exact: true }),
  ).toBeVisible();
});

test("lỗi proxy HTML được trình bày thành thông báo dễ hiểu", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/login", (route) =>
    route.fulfill({
      status: 503,
      contentType: "text/html",
      body: "<h1>Service unavailable</h1>",
    }),
  );
  await page.goto("/login");
  const form = page
    .getByRole("heading", { name: "ĐĂNG NHẬP", exact: true })
    .locator("..");
  await form
    .getByLabel("Email", { exact: true })
    .fill("offline@fullstack.test");
  await form
    .getByLabel("Mật khẩu", { exact: true })
    .fill("NotASharedPassword-2026!");
  await form.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("Vui lòng thử lại");
  await expect(form.getByRole("alert")).not.toContainText(
    /JSON|Unexpected|SyntaxError/,
  );
});

test("Mua ngay khi chưa đăng nhập giữ đúng trang đăng nhập và đích quay lại", async ({
  page,
}) => {
  for (const path of ["/products/ssd-kingston", "/products?category=ssd"]) {
    await page.goto(path);
    await page
      .getByRole("button", { name: /mua\s+ngay/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/login\?next=/);
    const next = new URL(page.url()).searchParams.get("next");
    expect(next).toBe(path);
  }
});

test("lưu cấu hình thất bại giữ dialog và linh kiện để thử lại", async ({
  page,
}) => {
  await registerRealAccount(page);
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await page.route("**/api/v1/me/builds", async (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 503,
          json: { error: { message: "Không lưu được cấu hình" } },
        })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Lưu cấu hình", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tên cấu hình").fill("Cấu hình giữ sau lỗi");
  await dialog
    .getByRole("button", { name: "Lưu cấu hình", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Chưa lưu được cấu hình",
  );
  await expect(dialog.getByLabel("Tên cấu hình")).toHaveValue(
    "Cấu hình giữ sau lỗi",
  );
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
  await page.unroute("**/api/v1/me/builds");
  await dialog
    .getByRole("button", { name: "Lưu cấu hình", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page.goto("/pc-builder/saved");
  await expect(
    page.getByRole("heading", { name: "Cấu hình giữ sau lỗi" }),
  ).toBeVisible();
});

test("cấu hình cũ không vẽ linh kiện đã mất hoặc đếm là đã chọn", async ({
  page,
}) => {
  await registerRealAccount(page);
  const id = "00000000-0000-4000-8000-000000000002";
  await page.route("**/api/v1/me/builds", (route) =>
    route.fulfill({
      json: {
        data: [
          {
            id,
            name: "Cấu hình cũ",
            build: { cpu: "removed-cpu", case: "removed-case" },
          },
        ],
      },
    }),
  );
  await page.goto(`/pc-builder/saved/${id}`);
  await expect(page.locator(".rf-build-slots h2")).toContainText("0/8");
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(0);
  await expect(page.locator(".rf-photo-stage [data-slot]")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Bật thử", exact: true }),
  ).toBeDisabled();
});

test("đặt hàng hiển thị đang gửi, chặn bấm lặp và phục hồi khi API lỗi", async ({
  page,
}) => {
  await registerRealAccount(page);
  await addSsd(page);
  await page.goto("/checkout");
  await page.getByLabel("Họ và tên", { exact: true }).fill("Audit Buyer");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0900000000");
  await page.getByLabel("Địa chỉ", { exact: true }).fill("123 Audit Street");
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let submissions = 0;
  await page.route("**/api/v1/me/orders", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    submissions += 1;
    await gate;
    await route.fulfill({
      status: 503,
      json: { error: { message: "Chưa tạo được đơn; vui lòng thử lại" } },
    });
  });
  await page
    .getByRole("button", { name: "Tạo đơn hàng COD", exact: true })
    .click();
  const busy = page.getByRole("button", {
    name: "Đang tạo đơn hàng…",
    exact: true,
  });
  await expect(busy).toBeDisabled();
  await expect.poll(() => submissions).toBe(1);
  release();
  await expect(
    page.getByRole("button", { name: "Tạo đơn hàng COD", exact: true }),
  ).toBeEnabled();
  await expect(page).toHaveURL(/\/checkout$/);
  expect(submissions).toBe(1);
  await expect(page.locator(".rf-checkout-cart-line")).toHaveCount(1);
});

test("SKU đã ẩn không làm sập giỏ hoặc checkout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await registerRealAccount(page);
  await page.route("**/api/v1/me/cart", async (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          json: {
            data: {
              lines: [
                {
                  variantId: "00000000-0000-4000-8000-000000000001",
                  quantity: 1,
                },
              ],
            },
          },
        })
      : route.continue(),
  );
  await page.goto("/cart");
  await expect(page.getByRole("alert").first()).toContainText(
    "không còn khả dụng",
  );
  await expect(
    page.getByRole("button", { name: "Xóa sản phẩm không còn khả dụng" }),
  ).toBeVisible();
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Kiểm tra lại giỏ hàng" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tạo đơn hàng COD" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("mất WebGL quay về ảnh ghép và giữ nguyên cấu hình", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(
    page.getByRole("button", { name: "Góc nhìn", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "3D", exact: true }).click();
  const canvas = page.locator(".rf-viewport canvas");
  await expect(canvas).toBeVisible();
  await canvas.evaluate((el) =>
    el.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
  );
  await expect(page.locator(".rf-photo-assembly")).toBeVisible();
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
  await expect(
    page.getByRole("button", { name: "Ảnh ghép", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("renderer 3D nghỉ khi cảnh đứng yên và vẫn bật đèn khi giảm chuyển động", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const metrics = window as unknown as { pcDraws: number };
    metrics.pcDraws = 0;
    for (const prototype of [
      WebGLRenderingContext.prototype,
      WebGL2RenderingContext.prototype,
    ]) {
      const draw = prototype.drawElements;
      prototype.drawElements = function (mode, count, type, offset) {
        if (
          this.canvas instanceof HTMLCanvasElement &&
          this.canvas.closest(".rf-viewport")
        )
          metrics.pcDraws += 1;
        return draw.call(this, mode, count, type, offset);
      };
    }
  });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await page.getByRole("button", { name: "3D", exact: true }).click();
  const draws = () =>
    page.evaluate(() => (window as unknown as { pcDraws: number }).pcDraws);
  await expect.poll(draws).toBeGreaterThan(0);
  const idle = () =>
    page.evaluate(async () => {
      const metrics = window as unknown as { pcDraws: number };
      const before = metrics.pcDraws;
      await new Promise((resolve) => setTimeout(resolve, 400));
      return metrics.pcDraws - before;
    });
  await expect.poll(idle).toBe(0);
  await page.getByRole("button", { name: "Trực diện", exact: true }).click();
  await page.getByRole("button", { name: "Ánh sáng Tím", exact: true }).click();
  await expect.poll(idle).toBe(0);
  await page.getByRole("checkbox", { name: "Giảm chuyển động" }).uncheck();
  const before = await draws();
  await page.getByRole("button", { name: "Bật thử", exact: true }).click();
  await expect.poll(draws).toBeGreaterThan(before + 100);
  await page.getByRole("checkbox", { name: "Giảm chuyển động" }).check();
  await expect.poll(idle).toBe(0);
  await expect(
    page.getByRole("button", { name: "Tắt máy", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

for (const width of [360, 390, 768, 1024, 1440, 1920]) {
  test(`toàn bộ mẫu trang có nội dung và không tràn ngang ở ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    const report: unknown[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/products",
      "/search?q=ssd",
      "/products/ssd-kingston",
      "/compare",
      "/cart",
      "/checkout",
      "/pc-builder",
      "/pc-builder/saved",
      "/login",
      "/forgot-password",
      "/account",
      "/admin",
      "/promotions",
      "/showrooms",
      "/articles",
      "/articles/chon-pc",
      "/pages/shipping",
      "/support",
      "/warranty",
    ]) {
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), route).toBe(200);
      await expect(
        page.locator("#main-content :is(h1,h2):visible").first(),
        route,
      ).toBeVisible();
      await expect(page.locator("main:visible"), route).toHaveCount(1);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(overflow, `${route} at ${width}`).toBe(false);
      const details = await page.locator("#main-content").evaluate((el) => ({
        headings: Array.from(el.querySelectorAll("h1"))
          .filter((node) => node.getBoundingClientRect().height > 0)
          .map((node) => node.textContent),
        brokenImages: Array.from(el.querySelectorAll("img"))
          .filter((img) => img.complete && !img.naturalWidth)
          .map((img) => img.getAttribute("src")),
      }));
      report.push({ route, width, ...details });
      if (
        [390, 1440].includes(width) &&
        [
          "/",
          "/products",
          "/pc-builder",
          "/login",
          "/showrooms",
          "/account",
        ].includes(route)
      )
        await page.screenshot({
          path: testInfo.outputPath(
            `${route.replaceAll("/", "_") || "home"}-${width}.png`,
          ),
        });
    }
    await testInfo.attach("readiness-routes", {
      body: JSON.stringify(report, null, 2),
      contentType: "application/json",
    });
    expect(errors).toEqual([]);
  });
}
