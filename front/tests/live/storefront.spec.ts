import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { registerRealAccount } from "../helpers/real-account";
test("real API: catalog, register, persistent cart, address, saved PC, COD order and cancel", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const email = `buyer-${randomUUID()}@fullstack.test`,
    password = "FullstackPassword-2026!";
  const catalog = await request.get("/api/v1/storefront");
  expect(catalog.status()).toBe(200);
  const snapshot = (await catalog.json()).data;
  const product = snapshot.products.find(
    (p: { id: string }) => p.id === "ryzen-7600",
  );
  await page.goto("/products/" + product.slug);
  await expect(
    page.getByRole("heading", { name: product.name, exact: true, level: 1 }),
  ).toBeVisible();
  await page.goto("/register");
  const registration = page
    .getByRole("heading", { name: "ĐĂNG KÝ THÀNH VIÊN MỚI" })
    .locator("..");
  await registration
    .getByLabel("Tên hiển thị", { exact: true })
    .fill("Live Buyer");
  await registration.getByLabel("Email", { exact: true }).fill(email);
  await registration.getByLabel("Mật khẩu", { exact: true }).fill(password);
  const registerResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/auth/register") &&
      r.request().method() === "POST",
    { timeout: 60000 },
  );
  await registration
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  const auth = await registerResponse;
  expect(auth.status()).toBe(201);
  const token = (await auth.json()).data.accessToken;
  await expect(page).toHaveURL(/\/account$/);
  await expect(
    page.getByRole("heading", { name: "Xin chào, Live Buyer" }),
  ).toBeVisible();
  await page.goto("/products/" + product.slug);
  const added = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/me/cart/items") &&
      r.request().method() === "POST",
    { timeout: 60000 },
  );
  await page
    .getByRole("button", { name: /Thêm vào giỏ/i })
    .first()
    .click();
  expect((await added).status()).toBe(201);
  await page.evaluate(() => localStorage.clear());
  await page.goto("/cart");
  await expect(
    page.getByText(product.name, { exact: true }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(product.name, { exact: true }).first(),
  ).toBeVisible();
  await page.goto("/account/addresses");
  await page.getByLabel("Người nhận", { exact: true }).fill("Live Recipient");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0900000000");
  await page
    .getByLabel("Địa chỉ", { exact: true })
    .fill("123 Integration Street");
  const savedAddress = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/me/addresses") &&
      r.request().method() === "POST",
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "Lưu địa chỉ", exact: true }).click();
  expect((await savedAddress).status()).toBe(201);
  await page.reload();
  await expect(page.getByText("Live Recipient", { exact: true })).toBeVisible();
  await page.goto("/pc-builder");
  await page
    .getByRole("button", { name: "Dùng cấu hình đề xuất", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Lưu cấu hình", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Tên cấu hình", { exact: true })
    .fill("Live Saved PC");
  const savedBuild = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/me/builds") && r.request().method() === "POST",
    { timeout: 60000 },
  );
  await dialog
    .getByRole("button", { name: "Lưu cấu hình", exact: true })
    .click();
  expect((await savedBuild).status()).toBe(201);
  await page.goto("/pc-builder/saved");
  await expect(page.getByText("Live Saved PC", { exact: true })).toBeVisible();
  await page.goto("/checkout");
  await page.getByLabel("Họ và tên", { exact: true }).fill("Live Buyer");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0900000000");
  await page
    .getByLabel("Địa chỉ", { exact: true })
    .fill("123 Integration Street");
  await expect(
    page.getByText("Mô phỏng thành công", { exact: false }),
  ).toHaveCount(0);
  await page.getByRole("radio", { name: /Giao nhanh/ }).check();
  const coupon = page.getByLabel("Mã khuyến mãi", { exact: true });
  await coupon.fill("INVALID-CODE");
  const rejected = page.waitForResponse(
    (r) =>
      r.url().endsWith("/me/checkout/quote") &&
      r.request().postDataJSON()?.couponCode === "INVALID-CODE",
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  expect((await rejected).status()).toBe(409);
  await coupon.fill("RIGFORGE5");
  const accepted = page.waitForResponse(
    (r) =>
      r.url().endsWith("/me/checkout/quote") &&
      r.request().postDataJSON()?.couponCode === "RIGFORGE5",
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  expect((await accepted).status()).toBe(201);
  await expect(page.locator(".rf-checkout-coupon [role=status]")).toHaveText(
    "Server đã xác nhận mã ưu đãi.",
  );
  await expect(page.locator(".rf-summary-total")).toContainText("4.410.500₫");
  const placed = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/me/orders") && r.request().method() === "POST",
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: /Tạo đơn hàng/ }).click();
  const response = await placed;
  expect(response.status()).toBe(201);
  const order = (await response.json()).data;
  expect(order.payment).toBe("pending");
  expect(order.total).toBe("4410500");
  expect(order.discount).toBe("229500");
  expect(order.shipping).toBe("50000");
  await expect(page).toHaveURL(new RegExp("/checkout/result/" + order.id));
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Đơn đã tạo, đang chờ xác nhận thanh toán.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("COD chưa ghi nhận thu tiền; thanh toán khi nhận hàng.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/account/orders/" + order.id);
  await expect(
    page.getByText(order.number, { exact: false }).first(),
  ).toBeVisible();
  const cancelled = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/api/v1/me/orders/${order.id}/cancel`) &&
      r.request().method() === "POST",
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "Hủy đơn hàng", exact: true }).click();
  expect((await cancelled).status()).toBe(200);
  await expect(
    page.getByText("Trạng thái: CANCELLED", { exact: true }),
  ).toBeVisible();
  const persisted = await request.get("/api/v1/me/orders/" + order.id, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(persisted.status()).toBe(200);
  expect((await persisted.json()).data.backendStatus).toBe("CANCELLED");
  await page.goto("/admin");
  await expect(
    page.getByText("Bạn không có quyền quản trị", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("forged browser demo state cannot authenticate, and API errors never create fake orders", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "rigforge-demo-v1",
      JSON.stringify({
        user: { name: "Forged Admin", email: "admin@example.test" },
        orders: [{ id: "fake-order" }],
        cart: [],
      }),
    ),
  );
  await page.goto("/account");
  await expect(
    page.getByText("Vui lòng đăng nhập", { exact: true }),
  ).toBeVisible();
  const protectedResponse = await request.get("/api/v1/me/orders");
  expect(protectedResponse.status()).toBe(401);
  await page.goto("/products/not-a-real-product");
  await expect(
    page.getByRole("heading", {
      name: "Trang bạn tìm chưa có ở đây.",
      exact: true,
    }),
  ).toBeVisible();
});

test("account forms persist profile, support and preferences; unknown serial never creates warranty data", async ({
  page,
}) => {
  const { email } = await registerRealAccount(page);
  await page.goto("/account/profile");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email);
  await page
    .getByLabel("Tên hiển thị", { exact: true })
    .fill("Persisted Buyer");
  const changed = page.waitForResponse(
    (r) => r.url().endsWith("/api/v1/me") && r.request().method() === "PATCH",
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  expect((await changed).status()).toBe(200);
  await page.reload();
  await expect(page.getByLabel("Tên hiển thị", { exact: true })).toHaveValue(
    "Persisted Buyer",
  );
  await page.goto("/account/support");
  await page
    .getByLabel("Tiêu đề", { exact: true })
    .fill("Live support question");
  await page
    .getByLabel("Nội dung", { exact: true })
    .fill("Please check my development request.");
  const ticket = page.waitForResponse(
    (r) => r.url().endsWith("/me/support") && r.request().method() === "POST",
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "Gửi yêu cầu", exact: true }).click();
  expect((await ticket).status()).toBe(201);
  await page.reload();
  await expect(
    page.getByRole("link", { name: /Live support question/ }),
  ).toBeVisible();
  await page.goto("/account/notifications");
  const preference = page.getByRole("checkbox", { name: /Nhận email ưu đãi/ });
  const updated = page.waitForResponse(
    (r) =>
      r.url().endsWith("/me/preferences") && r.request().method() === "PUT",
    { timeout: 60000 },
  );
  await preference.check();
  expect((await updated).status()).toBe(200);
  await page.reload();
  await expect(preference).toBeChecked();
  await page.goto("/warranty");
  await page.getByLabel("Serial sản phẩm", { exact: true }).fill("RF-DEMO-001");
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(
    page.getByText("Không tìm thấy serial thuộc đơn hàng của bạn.", {
      exact: true,
    }),
  ).toBeVisible();
});
