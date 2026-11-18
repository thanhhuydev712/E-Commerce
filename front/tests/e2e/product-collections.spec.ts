import { expect, test } from "@playwright/test";
import type { StorefrontSnapshot } from "../../src/catalog/model";

const groups = [
  { category: "pc", title: "PC & máy bộ" },
  { category: "laptop", title: "Laptop" },
  { category: "gear", title: "Gaming Gear" },
] as const;

test("ba nhóm landing hiển thị đúng sản phẩm, giá và liên kết danh mục từ API", async ({
  page,
}) => {
  const response = await page.request.get("/api/v1/storefront");
  expect(response.ok()).toBe(true);
  const data = (await response.json()).data as StorefrontSnapshot;
  await page.goto("/");
  await expect(page.locator(".rf-landing-collection")).toHaveCount(3);
  for (const { category, title } of groups) {
    const section = page.getByRole("region", { name: title, exact: true });
    await section.scrollIntoViewIfNeeded();
    const expected = data.products
      .filter((product) => product.category === category)
      .slice(0, 8);
    expect(expected.length).toBeGreaterThan(0);
    await expect(section.locator(".rf-reference-card-name")).toHaveCount(
      expected.length,
    );
    for (const product of expected) {
      const card = section.locator("article").filter({
        has: page.getByRole("link", { name: product.name, exact: true }),
      });
      await expect(card.locator(".rf-reference-card-name")).toHaveAttribute(
        "href",
        `/products/${product.slug}`,
      );
      await expect(card.locator(".rf-reference-card-price strong")).toHaveText(
        `${BigInt(product.price).toLocaleString("vi-VN")}₫`,
      );
    }
    const more = section.getByRole("link", { name: "Xem tất cả", exact: true });
    await expect(more).toHaveAttribute(
      "href",
      `/products?category=${category}`,
    );
    await more.click();
    await expect(page).toHaveURL(
      new RegExp(`/products\\?category=${category}$`),
    );
    await expect(page.locator(".rf-product-card").first()).toBeVisible();
    await page.goBack();
    await expect(section).toBeVisible();
  }
});

test("ba dải sản phẩm cuộn độc lập trên mobile và không làm tràn ngang landing", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const { title } of groups) {
    const section = page.getByRole("region", { name: title, exact: true });
    await section.scrollIntoViewIfNeeded();
    const viewport = section.locator(".rf-reference-rail-viewport");
    await expect(
      section.getByRole("button", { name: "Sản phẩm tiếp theo", exact: true }),
    ).toBeVisible();
    await section
      .getByRole("button", { name: "Sản phẩm tiếp theo", exact: true })
      .click();
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(50);
    await section
      .getByRole("button", { name: "Sản phẩm trước", exact: true })
      .click();
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollLeft))
      .toBeLessThan(3);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const section = page.getByRole("region", { name: "Laptop", exact: true });
  await section.screenshot({ path: info.outputPath("laptop-mobile.png") });
});
