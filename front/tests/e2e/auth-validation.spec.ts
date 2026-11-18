import { expect, test, type Locator } from "@playwright/test";

async function invalid(field: Locator) {
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect
    .poll(() =>
      field.evaluate((element) =>
        (element.getAttribute("aria-describedby") ?? "")
          .split(" ")
          .some((id) => {
            const message = document.getElementById(id);
            return (
              message &&
              message.getBoundingClientRect().height > 0 &&
              !!message.textContent?.trim()
            );
          }),
      ),
    )
    .toBe(true);
}

test("login riêng hiện lỗi từng ô, focus lỗi đầu và không gửi form invalid", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/v1/auth/login", (route) => {
    requests++;
    return route.fulfill({
      status: 401,
      json: { error: { message: "Email hoặc mật khẩu không đúng." } },
    });
  });
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "ĐĂNG KÝ THÀNH VIÊN MỚI", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const email = page
      .locator(".rf-auth-form:visible")
      .getByLabel("Email", { exact: true }),
    password = page
      .locator(".rf-auth-form:visible")
      .getByLabel("Mật khẩu", { exact: true });
  await invalid(email);
  await invalid(password);
  await expect(email).toBeFocused();
  await email.fill("wrong-email");
  await email.press("Tab");
  await invalid(email);
  expect(requests).toBe(0);
  await email.fill("buyer@example.com");
  await password.fill("existing-pass");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.locator(".rf-auth-form:visible").getByRole("alert"),
  ).toContainText("Email hoặc mật khẩu không đúng");
  expect(requests).toBe(1);
});

test("register kiểm tên, byte mật khẩu, xác nhận và giữ dữ liệu khi API lỗi", async ({
  page,
}) => {
  const payloads: Record<string, unknown>[] = [];
  await page.route("**/api/v1/auth/register", async (route) => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({
      status: 409,
      json: { error: { message: "Email đã được sử dụng." } },
    });
  });
  await page.goto("/register");
  await expect(
    page.getByRole("heading", { name: "ĐĂNG NHẬP", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  const name = page
      .locator(".rf-auth-form:visible")
      .getByLabel("Tên hiển thị", { exact: true }),
    email = page
      .locator(".rf-auth-form:visible")
      .getByLabel("Email", { exact: true }),
    password = page
      .locator(".rf-auth-form:visible")
      .getByLabel("Mật khẩu", { exact: true }),
    confirm = page
      .locator(".rf-auth-form:visible")
      .getByLabel("Nhập lại mật khẩu", { exact: true });
  for (const field of [name, email, password, confirm]) await invalid(field);
  await name.fill("   ");
  await name.press("Tab");
  await invalid(name);
  await password.fill("😀".repeat(20));
  await password.press("Tab");
  await invalid(password);
  await name.fill("  UI Buyer  ");
  await email.fill("BUYER@example.com");
  await password.fill("FullstackPassword-2026!");
  await confirm.fill("DifferentPassword-2026!");
  await confirm.press("Tab");
  await invalid(confirm);
  expect(payloads).toHaveLength(0);
  await confirm.fill("FullstackPassword-2026!");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(
    page.locator(".rf-auth-form:visible").getByRole("alert"),
  ).toContainText("Email đã được sử dụng");
  expect(payloads).toHaveLength(1);
  expect(payloads[0]).toMatchObject({
    email: "buyer@example.com",
    firstName: "UI Buyer",
    password: "FullstackPassword-2026!",
  });
  await expect(confirm).toHaveValue("FullstackPassword-2026!");
});

test("chuyển login/register giữ next, nút mắt không submit, mobile không tràn", async ({
  page,
}, info) => {
  await page.goto("/login?next=%2Fcart");
  await page
    .getByRole("link", { name: /đăng ký/i })
    .last()
    .click();
  await expect(page).toHaveURL(/\/register\?next=%2Fcart/i);
  const password = page
    .locator(".rf-auth-form:visible")
    .getByLabel("Mật khẩu", { exact: true });
  await password.fill("FullstackPassword-2026!");
  const toggle = page.getByRole("button", {
    name: "Hiện mật khẩu",
    exact: true,
  });
  await toggle.click();
  await expect(password).toHaveAttribute("type", "text");
  await page
    .getByRole("button", { name: "Ẩn mật khẩu", exact: true })
    .press("Space");
  await expect(password).toHaveAttribute("type", "password");
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);
    await page.screenshot({ path: info.outputPath(`register-${width}.png`) });
  }
});

test("khôi phục và đặt lại mật khẩu hiện validation trước gọi API", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByRole("button", { name: "Gửi yêu cầu", exact: true }).click();
  await invalid(
    page.locator(".rf-auth-form:visible").getByLabel("Email", { exact: true }),
  );
  await page.goto("/reset-password");
  await page.getByRole("button", { name: "Gửi yêu cầu", exact: true }).click();
  await invalid(
    page
      .locator(".rf-auth-form:visible")
      .getByLabel("Mã xác minh", { exact: true }),
  );
  await invalid(
    page
      .locator(".rf-auth-form:visible")
      .getByLabel("Mật khẩu mới", { exact: true }),
  );
});
