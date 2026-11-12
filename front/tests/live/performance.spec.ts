import { expect, test } from "@playwright/test";
import { registerRealAccount } from "../helpers/real-account";

test("COD result and cancellation survive a slow or failed catalog refresh", async ({
  page,
}) => {
  await registerRealAccount(page);
  const response = await page.request.get("/api/v1/storefront");
  expect(response.ok()).toBe(true);
  const snapshot = (await response.json()).data;
  const product = snapshot.products.find(
    (p: { id: string }) => p.id === "ryzen-7600",
  );
  await page.goto("/products/" + product.slug);
  const added = page.waitForResponse(
    (r) =>
      r.url().endsWith("/me/cart/items") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: /Thêm vào giỏ/i })
    .first()
    .click();
  expect((await added).status()).toBe(201);
  await page.goto("/checkout");
  await page.getByLabel("Họ và tên", { exact: true }).fill("Performance Buyer");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0900000000");
  await page
    .getByLabel("Địa chỉ", { exact: true })
    .fill("123 Integration Street");

  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  let refreshStarted = false;
  let refreshReleased = false;
  await page.route("**/api/v1/storefront", async (route) => {
    refreshStarted = true;
    await blocked;
    refreshReleased = true;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Catalog temporarily unavailable" }),
    });
  });
  try {
    const placed = page.waitForResponse(
      (r) => r.url().endsWith("/me/orders") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /Tạo đơn hàng/ }).click();
    const created = await placed;
    expect(created.status()).toBe(201);
    const order = (await created.json()).data;
    await expect.poll(() => refreshStarted).toBe(true);
    await expect(page).toHaveURL(new RegExp("/checkout/result/" + order.id));
    await expect(
      page.getByRole("heading", {
        name: "Đơn đã tạo, đang chờ xác nhận thanh toán.",
        exact: true,
      }),
    ).toBeVisible();
    expect(refreshReleased).toBe(false);
    const failedRefresh = page.waitForResponse((r) =>
      r.url().endsWith("/api/v1/storefront"),
    );
    release();
    expect((await failedRefresh).status()).toBe(503);
    await expect(page.locator(".rf-toast")).toHaveText(
      "Đơn đã tạo; chưa cập nhật được giá và tồn kho hiển thị.",
    );
    await expect(
      page.getByRole("heading", {
        name: "Đơn đã tạo, đang chờ xác nhận thanh toán.",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto("/account/orders/" + order.id);
    const cancelled = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/me/orders/${order.id}/cancel`) &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Hủy đơn hàng", exact: true })
      .click();
    expect((await cancelled).status()).toBe(200);
    await expect(
      page.getByText("Trạng thái: CANCELLED", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".rf-toast")).toHaveText(
      "Đơn đã hủy; chưa cập nhật được giá và tồn kho hiển thị.",
    );
  } finally {
    release();
  }
});
