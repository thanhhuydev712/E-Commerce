import { expect, test } from "@playwright/test";

test.skip(
  process.env.LIVE_INTERACTIVE_DEMO_TEST !== "1",
  "Requires the isolated runner with both preview and interactive demo enabled",
);

test("controlled demo exposes login, keeps registration/recovery and checkout closed", async ({
  page,
  request,
}) => {
  let quoteCalls = 0;
  page.on("request", (r) => {
    if (r.url().includes("/checkout/quote")) quoteCalls++;
  });
  await page.goto("/login");
  await expect(page.locator('input[type="password"]')).toHaveCount(1);
  for (const route of ["/register", "/forgot-password", "/reset-password"]) {
    await page.goto(route);
    await expect(
      page.locator('input[type="password"],input[type="email"]'),
    ).toHaveCount(0);
    await expect(page.getByText(/tài khoản thử được cấp riêng/i)).toBeVisible();
  }
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Demo giỏ hàng và cấu hình PC" }),
  ).toBeVisible();
  expect(quoteCalls).toBe(0);
  for (const route of [
    "/me/orders",
    "/me/checkout/quote",
    "/auth/register",
    "/auth/forgot-password",
  ]) {
    const response = await request.post("/api/v1" + route, { data: {} });
    expect(response.status(), route).toBe(503);
  }
});

test("demo session loads only account, cart and saved builds", async ({
  page,
}) => {
  const privateRequests: string[] = [];
  await page.route("**/api/v1/auth/session", (route) =>
    route.fulfill({
      json: {
        data: { requiresRefresh: false, accessToken: "isolated-ui-token" },
      },
    }),
  );
  await page.route(/\/api\/v1\/me(?:\/|$)/, (route) => {
    const path = new URL(route.request().url()).pathname;
    privateRequests.push(path);
    const data = path.endsWith("/cart")
      ? { lines: [] }
      : path.endsWith("/builds")
        ? []
        : {
            id: "test-user",
            email: "test@isolated.test",
            firstName: "Demo",
            lastName: null,
            phone: null,
            roleCodes: ["CUSTOMER"],
            permissions: [],
          };
    return route.fulfill({ json: { data } });
  });
  await page.goto("/cart");
  await expect
    .poll(() => [...new Set(privateRequests)].sort())
    .toEqual(["/api/v1/me", "/api/v1/me/builds", "/api/v1/me/cart"]);
  expect(privateRequests.some((p) => /orders|wishlist/.test(p))).toBe(false);
});
