import { expect, test } from "@playwright/test";

test("auth text stays readable and actions remain reachable on every viewport", async ({
  page,
}, testInfo) => {
  for (const size of [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
    { width: 360, height: 740 },
    { width: 360, height: 667 },
    { width: 320, height: 667 },
  ]) {
    await page.setViewportSize(size);
    for (const route of ["login", "register"]) {
      await page.goto(`/${route}`);
      await expect(page.locator(".rf-route-auth")).toHaveCount(1);
      const form = page.locator(".rf-auth-form:visible");
      const submit = form.locator('button[type="submit"]');
      await expect(submit).toBeVisible();
      const fontSizes = await form
        .locator("input")
        .evaluateAll((inputs) =>
          inputs
            .filter(
              (input) =>
                !["checkbox", "radio"].includes(
                  input.getAttribute("type") ?? "text",
                ),
            )
            .map((input) => parseFloat(getComputedStyle(input).fontSize)),
        );
      expect(Math.min(...fontSizes)).toBeGreaterThanOrEqual(16);
      // Readable text may require vertical scrolling on a short screen.
      // Every action must remain reachable without horizontal scrolling.
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeInViewport();
      const switchLink = form.locator(
        'a[href^="/login"], a[href^="/register"]',
      );
      await switchLink.scrollIntoViewIfNeeded();
      await expect(switchLink).toBeInViewport();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        ),
      ).toBe(false);
      await expect(page.locator(".rf-header")).toBeHidden();
      await expect(page.locator(".rf-mobile-nav")).toBeHidden();
      await page.screenshot({
        path: testInfo.outputPath(`${route}-${size.width}x${size.height}.png`),
        fullPage: true,
      });
    }
  }
});

test("password recovery uses the auth shell without horizontal overflow", async ({
  page,
}) => {
  for (const size of [
    { width: 1920, height: 1000 },
    { width: 1024, height: 768 },
    { width: 360, height: 667 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/forgot-password");
    await expect(page.locator(".rf-route-auth")).toHaveCount(1);
    await expect(page.locator(".rf-auth-shell:visible")).toHaveCount(1);
    await expect(page.locator(".rf-header")).toBeHidden();
    await expect(page.locator(".rf-mobile-nav")).toBeHidden();
    const form = page.locator(".rf-auth-form:visible");
    const email = form.getByLabel("Email", { exact: true });
    const submit = form.getByRole("button", {
      name: "Gửi yêu cầu",
      exact: true,
    });
    await email.scrollIntoViewIfNeeded();
    await expect(email).toBeInViewport();
    await expect(email).toBeEditable();
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
    await expect(submit).toBeEnabled();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);
  }
});

test("auth shell follows client navigation and history", async ({ page }) => {
  await page.goto("/login");
  await page.locator('.rf-auth-form:visible a[href^="/register"]').click();
  await expect(page).toHaveURL(/\/register/);
  await expect(page.locator(".rf-route-auth")).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/\/login/);
  await page.locator('.rf-auth-shell:visible a[href="/"]').first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".rf-route-home")).toHaveCount(1);
  await expect(page.locator(".rf-header")).toBeVisible();
});

test("long validation remains reachable on a short mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 667 });
  await page.goto("/register");
  const form = page.locator(".rf-auth-form:visible");
  const submit = form.locator('button[type="submit"]');
  await submit.click();
  await expect(form.locator('input[aria-invalid="true"]')).toHaveCount(4);
  await expect(form.locator('input[name="name"]')).toBeFocused();
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeInViewport();
  const switchLink = form.locator('a[href^="/login"]');
  await switchLink.scrollIntoViewIfNeeded();
  await expect(switchLink).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
