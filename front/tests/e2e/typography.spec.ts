import { expect, test } from "@playwright/test";

for (const width of [320, 768, 1366, 1920]) {
  test(`readable product text and controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/products");
    const cards = page.locator(".rf-reference-card-catalog");
    await expect(cards.first()).toBeVisible();
    const metrics = await page.evaluate(() => {
      const minimum = (selector: string) =>
        Math.min(
          ...Array.from(document.querySelectorAll(selector))
            .filter((element) => element.checkVisibility())
            .map((element) => parseFloat(getComputedStyle(element).fontSize)),
        );
      const titles = Array.from(
        document.querySelectorAll(".rf-reference-card-name"),
      );
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        names: minimum(".rf-reference-card-name"),
        specs: minimum(".rf-reference-card-specs > span"),
        prices: minimum(".rf-reference-card-price strong"),
        search: minimum(".rf-search input"),
        clipped: titles.some(
          (element) =>
            element.getBoundingClientRect().height + 1 <
            parseFloat(getComputedStyle(element).lineHeight) * 3,
        ),
      };
    });
    expect(metrics.overflow).toBe(false);
    expect(metrics.names).toBeGreaterThanOrEqual(15);
    expect(metrics.specs).toBeGreaterThanOrEqual(14);
    expect(metrics.prices).toBeGreaterThanOrEqual(20);
    expect(metrics.search).toBeGreaterThanOrEqual(16);
    expect(metrics.clipped).toBe(false);
  });
}
