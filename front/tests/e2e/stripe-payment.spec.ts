import { expect, test } from "@playwright/test";
import { registerRealAccount } from "../helpers/real-account";

test.afterEach(async ({ page }) => {
  // A quote can still be in flight after navigation; finish intercepted requests
  // before Playwright closes the page so errors cannot leak into the next test.
  await page.unrouteAll({ behavior: "wait" });
});

// UI contract checks only: Stripe responses are intercepted. Financial behavior is
// checked by api/test/stripe.e2e-spec.ts using isolated PostgreSQL and signatures.
const id = "10000000-0000-4000-8000-000000000001";
const pending = {
  id,
  number: "RF-STRIPE-UI",
  createdAt: "2026-11-08T00:00:00Z",
  status: "processing",
  backendStatus: "PENDING_PAYMENT",
  payment: "pending",
  paymentMethod: "STRIPE",
  paymentStatus: "PENDING",
  canPay: true,
  canCancel: true,
  paymentDeadline: "2099-01-01T00:00:00Z",
  lines: [],
  subtotal: "1000000",
  discount: "0",
  shipping: "0",
  total: "1000000",
  customer: "UI Buyer",
  address: "Test address",
  history: [],
  documents: [],
};

test("checkout sends the selected Stripe method and leaves card entry to Stripe", async ({
  page,
}) => {
  await registerRealAccount(page);
  await page.route("**/api/v1/me/checkout/quote", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    if (response.ok()) body.data.methods = ["COD", "STRIPE"];
    await route.fulfill({ response, json: body });
  });
  await page.route("**/api/v1/me/orders", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 201, json: { data: pending } })
      : route.continue(),
  );
  await page.route(`**/api/v1/me/orders/${id}`, (route) =>
    route.fulfill({ json: { data: pending } }),
  );
  await page.goto("/products/ssd-kingston");
  const added = page.waitForResponse(
    (response) =>
      response.url().endsWith("/me/cart/items") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Thêm vào giỏ", exact: true }).click();
  expect((await added).ok()).toBe(true);
  await page.goto("/checkout");
  await page.getByLabel("Họ và tên", { exact: true }).fill("UI Buyer");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0900000000");
  await page
    .getByLabel("Địa chỉ", { exact: true })
    .fill("123 Stripe UI Street");
  await page.getByRole("radio", { name: /Thanh toán thẻ qua Stripe/ }).check();
  const placed = page.waitForRequest(
    (request) =>
      request.url().endsWith("/me/orders") && request.method() === "POST",
  );
  await page
    .getByRole("button", {
      name: "Tạo đơn và tiếp tục thanh toán",
      exact: true,
    })
    .click();
  expect((await placed).postDataJSON()).toMatchObject({ method: "STRIPE" });
  expect((await placed).postDataJSON()).not.toHaveProperty("amount");
  await expect(page).toHaveURL(new RegExp(`/checkout/result/${id}$`));
  await expect(
    page.getByRole("button", {
      name: "Tiếp tục thanh toán Stripe test",
      exact: true,
    }),
  ).toBeVisible();
});

test("Stripe return URL does not mark an unpaid order paid; provider errors allow retry", async ({
  page,
}) => {
  await registerRealAccount(page);
  await page.route(`**/api/v1/me/orders/${id}`, (route) =>
    route.fulfill({ json: { data: pending } }),
  );
  let calls = 0;
  await page.route(
    `**/api/v1/me/orders/${id}/stripe-checkout`,
    async (route) => {
      calls++;
      await route.fulfill({
        status: 503,
        json: { error: { message: "Stripe tạm thời không phản hồi" } },
      });
    },
  );
  await page.goto(`/checkout/result/${id}?success=true&payment=paid`);
  await expect(
    page.getByRole("heading", {
      name: "Đơn đã tạo, đang chờ xác nhận thanh toán.",
    }),
  ).toBeVisible();
  const button = page.getByRole("button", {
    name: "Tiếp tục thanh toán Stripe test",
    exact: true,
  });
  await button.click();
  await expect(page.locator("p[role=alert]")).toContainText(
    "Stripe tạm thời không phản hồi",
  );
  await button.click();
  await expect.poll(() => calls).toBe(2);
  // Polling must not unmount the payment button and erase its error/retry state.
  await page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/v1/me/orders/${id}`) &&
      response.request().method() === "GET",
  );
  await expect(page.locator("p[role=alert]")).toContainText(
    "Stripe tạm thời không phản hồi",
  );
  await expect(
    page.getByRole("button", { name: "Cập nhật trạng thái" }),
  ).toBeVisible();
});

test("Stripe navigation uses provider URL; a verified payment removes the payment button", async ({
  page,
}) => {
  await registerRealAccount(page);
  let settled = false;
  await page.route(`**/api/v1/me/orders/${id}`, (route) =>
    route.fulfill({
      json: {
        data: settled
          ? {
              ...pending,
              backendStatus: "CONFIRMED",
              payment: "paid",
              paymentStatus: "PAID",
              canPay: false,
              canCancel: false,
            }
          : pending,
      },
    }),
  );
  await page.route(`**/api/v1/me/orders/${id}/stripe-checkout`, (route) =>
    route.fulfill({
      json: {
        data: {
          orderId: id,
          url: "https://checkout.stripe.com/c/pay/ui-contract-fixture",
        },
      },
    }),
  );
  // No request reaches Stripe. This only verifies browser navigation.
  await page.route("https://checkout.stripe.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Checkout UI fixture</h1>",
    }),
  );
  await page.goto(`/checkout/result/${id}`);
  await page
    .getByRole("button", {
      name: "Tiếp tục thanh toán Stripe test",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(
    "https://checkout.stripe.com/c/pay/ui-contract-fixture",
  );
  settled = true;
  await page.goto(`/checkout/result/${id}`);
  await expect(
    page.getByRole("heading", { name: "Cấu hình mới đã có điểm bắt đầu!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Tiếp tục thanh toán Stripe test",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.goto(`/account/orders/${id}/payment`);
  await expect(
    page.getByRole("heading", { name: "Thanh toán Stripe test" }),
  ).toBeVisible();
  await expect(page.getByText("Đã thanh toán", { exact: true })).toBeVisible();
});
