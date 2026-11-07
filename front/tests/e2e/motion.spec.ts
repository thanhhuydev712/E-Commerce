import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`hover và đóng dialog giữ đúng tương tác với motion ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    const card = page.locator(".rf-reference-card").first();
    await card.scrollIntoViewIfNeeded();
    const before = (await card.boundingBox())!;
    await card.hover();
    const photo = card.locator(".rf-product-photo-img");
    await expect
      .poll(() => photo.evaluate((el) => getComputedStyle(el).scale))
      .toBe(reducedMotion === "reduce" ? "none" : "1.04");
    const after = (await card.boundingBox())!;
    // Chromium có thể làm tròn khác nhau ~0.00005 px giữa hai frame GPU.
    expect(after.width).toBeCloseTo(before.width, 2);
    expect(after.height).toBeCloseTo(before.height, 2);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);

    await page.goto("/products/ssd-kingston");
    const trigger = page.getByRole("button", { name: "Phóng to ảnh sản phẩm" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect
      .poll(() => dialog.evaluate((el) => getComputedStyle(el).opacity))
      .toBe("1");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
