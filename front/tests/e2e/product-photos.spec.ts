import { expect, test, type Page } from "@playwright/test";
import type { Product, StorefrontSnapshot } from "../../src/catalog/model";

async function catalog(page: Page) {
  const response = await page.request.get("/api/v1/storefront");
  expect(response.ok()).toBe(true);
  return (await response.json()).data as StorefrontSnapshot;
}
async function replacePart(page: Page, slot: "gpu" | "case", product: Product) {
  await page
    .getByRole("button", {
      name: slot === "gpu" ? "Chi tiết Card đồ họa" : "Chi tiết Vỏ case",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Đổi linh kiện", exact: true })
    .click();
  const row = page
    .locator(".rf-picker-list > div")
    .filter({ has: page.getByText(product.name, { exact: true }) });
  await row.getByRole("button", { name: "Chọn", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function imageSource(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const src = element.getAttribute("src")!;
    return new URL(src, location.origin).searchParams.get("url") ?? src;
  });
}

test("chi tiết dùng ảnh nghiêng nhẹ theo chuột, bàn phím và Home, không có 3D", async ({
  page,
}) => {
  const data = await catalog(page);
  const product = data.products.find((item) => item.category === "gpu")!;
  await page.goto(`/products/${product.slug}`);
  const tilt = page.getByRole("group", { name: "Nghiêng nhẹ ảnh sản phẩm" });
  const surface = tilt.locator(".rf-photo-tilt-surface");
  // SSR renders the photo before event handlers hydrate. A keyboard interaction
  // confirms the gallery is interactive before sending a single mouse move.
  await tilt.focus();
  await expect(async () => {
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    await expect(surface).toHaveAttribute("style", /--tilt-y: 2deg/);
  }).toPass();
  await page.keyboard.press("Home");
  const box = (await tilt.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.3);
  await expect
    .poll(() =>
      surface.evaluate((element) =>
        parseFloat(element.style.getPropertyValue("--tilt-y")),
      ),
    )
    .toBeGreaterThan(1);
  expect(
    await surface.evaluate((element) =>
      Math.abs(parseFloat(element.style.getPropertyValue("--tilt-y"))),
    ),
  ).toBeLessThanOrEqual(7);
  await page.mouse.move(0, 0);
  await expect
    .poll(() =>
      surface.evaluate((element) => element.style.getPropertyValue("--tilt-y")),
    )
    .toBe("0deg");
  await tilt.focus();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() =>
      surface.evaluate((element) => element.style.getPropertyValue("--tilt-y")),
    )
    .toBe("2deg");
  await page.keyboard.press("Home");
  await expect
    .poll(() =>
      surface.evaluate((element) => element.style.getPropertyValue("--tilt-y")),
    )
    .toBe("0deg");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /360|3D/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Phóng to ảnh sản phẩm" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Phóng to ảnh sản phẩm" }),
  ).toBeFocused();
});

test("giảm chuyển động giữ ảnh đứng yên trên mobile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products/ssd-kingston");
  const tilt = page.getByRole("group", { name: "Nghiêng nhẹ ảnh sản phẩm" });
  const surface = tilt.locator(".rf-photo-tilt-surface");
  await tilt.hover();
  await expect
    .poll(() =>
      surface.evaluate((element) => element.style.getPropertyValue("--tilt-y")),
    )
    .toBe("0deg");
  await expect(surface).toHaveCSS("transition-property", "none");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("đổi GPU và case đổi đúng ảnh record catalog, không dùng ảnh slot cố định", async ({
  page,
}, info) => {
  const data = await catalog(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  for (const slot of ["gpu", "case"] as const) {
    const layer = page.locator(`.rf-photo-stage [data-slot="${slot}"]`);
    const originalId = await layer.getAttribute("data-product-id");
    const originalImage = await layer.getAttribute("data-product-image");
    const alternative = data.products.find(
      (item) =>
        item.builderEligible &&
        item.category === slot &&
        item.id !== originalId &&
        item.image !== originalImage &&
        item.variants.some((variant) => variant.stock > 0),
    )!;
    expect(alternative).toBeTruthy();
    await replacePart(page, slot, alternative);
    await expect(layer).toHaveAttribute("data-product-id", alternative.id);
    await expect(layer).toHaveAttribute(
      "data-product-image",
      alternative.image,
    );
    await expect(
      layer.getByRole("img", { name: alternative.name }),
    ).toBeVisible();
    expect(
      await imageSource(page, `.rf-photo-stage [data-slot="${slot}"] img`),
    ).toBe(alternative.image);
    await expect(layer.locator("img")).toHaveCSS("object-fit", "contain");
  }
  await expect(
    page.getByRole("button", { name: "3D", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page
    .locator(".rf-studio")
    .screenshot({ path: info.outputPath("selected-product-collage.png") });
  expect(errors).toEqual([]);
});

test("lỗi ảnh GPU cũ không làm mất ảnh sản phẩm thay thế trong cùng slot", async ({
  page,
}) => {
  const data = await catalog(page);
  const starterId = data.presentation.starterBuild.gpu;
  const original = data.products.find((item) => item.id === starterId)!;
  const alternative = data.products.find(
    (item) =>
      item.builderEligible &&
      item.category === "gpu" &&
      item.id !== starterId &&
      item.image !== original.image &&
      item.variants.some((variant) => variant.stock > 0),
  )!;
  expect(alternative).toBeTruthy();
  await page.route("**/_next/image?*", (route) =>
    new URL(route.request().url()).searchParams.get("url") === original.image
      ? route.fulfill({ status: 404, body: "" })
      : route.continue(),
  );
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  const layer = page.locator('.rf-photo-stage [data-slot="gpu"]');
  await expect(
    layer.getByText("Chưa có ảnh sản phẩm", { exact: true }),
  ).toBeVisible();
  await replacePart(page, "gpu", alternative);
  await expect(
    layer.getByRole("img", { name: alternative.name }),
  ).toBeVisible();
  expect(await imageSource(page, '.rf-photo-stage [data-slot="gpu"] img')).toBe(
    alternative.image,
  );
  await expect(
    layer.getByText("Chưa có ảnh sản phẩm", { exact: true }),
  ).toHaveCount(0);
});
