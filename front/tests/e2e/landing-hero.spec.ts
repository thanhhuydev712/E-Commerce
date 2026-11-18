import { expect, test } from "@playwright/test";

// Hero tĩnh thay carousel: kiểm tra điều hướng và thao tác bàn phím.
for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`hero: bàn phím và liên kết catalog/Studio (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    const hero = page.getByRole("region", {
      name: "Cấu hình của bạn. Dấu ấn của bạn.",
      exact: true,
    });
    const catalog = hero.getByRole("link", {
      name: "Khám phá sản phẩm",
      exact: true,
    });
    await catalog.focus();
    await expect(catalog).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/products$/);
    await page.goBack();
    await expect(hero).toBeVisible();
    await hero
      .getByRole("link", { name: "Tự xây cấu hình", exact: true })
      .click();
    await expect(page).toHaveURL(/\/pc-builder$/);
    await page.goBack();
    await expect(page.locator("h1:visible")).toHaveCount(1);
    await expect(page.locator(".rf-showroom-shell")).toBeHidden();
  });
}
