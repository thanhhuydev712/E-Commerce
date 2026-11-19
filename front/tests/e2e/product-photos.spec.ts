import { expect, test, type Page } from "@playwright/test";
import type { Product, StorefrontSnapshot } from "../../src/catalog/model";
import { installAssemblyPack } from "../support/assembly-fixtures";

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
    const url = new URL(src, location.origin);
    return url.searchParams.get("url") ?? url.pathname;
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

test("đổi GPU và case dùng đúng ảnh lắp theo sản phẩm, SKU và profile case", async ({
  page,
}, info) => {
  const { data, registry } = await installAssemblyPack(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(page.locator(".rf-photo-stage [data-slot]")).toHaveCount(8);
  for (const slot of ["gpu", "case"] as const) {
    if (slot === "case") {
      await page.getByRole("button", { name: "Bỏ gpu", exact: true }).click();
      await page
        .getByRole("button", { name: "Bỏ cooler", exact: true })
        .click();
    }
    const layer = page.locator(`.rf-photo-stage [data-slot="${slot}"]`);
    const originalId = await layer.getAttribute("data-product-id");
    const alternative = data.products.find(
      (item) =>
        item.builderEligible &&
        item.category === slot &&
        item.id !== originalId &&
        item.variants.some((variant) => variant.stock > 0),
    )!;
    expect(alternative).toBeTruthy();
    await replacePart(page, slot, alternative);
    await expect(layer).toHaveAttribute("data-product-id", alternative.id);
    const selectedCaseId = await page
      .locator('.rf-photo-stage [data-slot="case"]')
      .getAttribute("data-product-id");
    const selectedCase = data.products.find(
      (item) => item.id === selectedCaseId,
    )!;
    const profile = registry.cases.find(
      (item) =>
        item.productSlug === selectedCase.slug &&
        item.variantSku === selectedCase.variants[0].sku,
    )!;
    expect(profile).toBeTruthy();
    const asset =
      slot === "case"
        ? profile
        : registry.parts.find(
            (item) =>
              item.slot === slot &&
              item.productSlug === alternative.slug &&
              item.variantSku === alternative.variants[0].sku &&
              item.caseProfileId === profile.id,
          )!;
    expect(asset).toBeTruthy();
    await expect(layer).toHaveAttribute(
      "data-variant-sku",
      alternative.variants[0].sku,
    );
    await expect(layer).toHaveAttribute("data-assembly-src", asset.src);
    await expect(
      layer.getByRole("img", { name: alternative.name }),
    ).toBeVisible();
    expect(
      await imageSource(page, `.rf-photo-stage [data-slot="${slot}"] img`),
    ).toBe(asset.src);
    expect(asset.src).not.toBe(alternative.image);
    await expect(layer.locator("img")).toHaveCSS("object-fit", "contain");
  }
  await expect(
    page.getByRole("button", { name: "3D", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page
    .locator(".rf-studio")
    .screenshot({ path: info.outputPath("selected-assembled-pc.png") });
  expect(errors).toEqual([]);
});

test("lỗi ảnh GPU cũ không làm mất ảnh sản phẩm thay thế trong cùng slot", async ({
  page,
}) => {
  const { data, registry } = await installAssemblyPack(page);
  const starterId = data.presentation.starterBuild.gpu;
  const original = data.products.find((item) => item.id === starterId)!;
  const alternative = data.products.find(
    (item) =>
      item.builderEligible &&
      item.category === "gpu" &&
      item.id !== starterId &&
      item.variants.some((variant) => variant.stock > 0),
  )!;
  expect(alternative).toBeTruthy();
  const caseProduct = data.products.find(
    (item) => item.id === data.presentation.starterBuild.case,
  )!;
  const profile = registry.cases.find(
    (item) =>
      item.productSlug === caseProduct.slug &&
      item.variantSku === caseProduct.variants[0].sku,
  )!;
  const originalAsset = registry.parts.find(
    (item) =>
      item.productSlug === original.slug &&
      item.variantSku === original.variants[0].sku &&
      item.caseProfileId === profile.id,
  )!;
  const alternativeAsset = registry.parts.find(
    (item) =>
      item.productSlug === alternative.slug &&
      item.variantSku === alternative.variants[0].sku &&
      item.caseProfileId === profile.id,
  )!;
  expect(originalAsset).toBeTruthy();
  expect(alternativeAsset).toBeTruthy();
  await page.route("**/images/pc-assembly/test-gpu-*", (route) =>
    new URL(route.request().url()).pathname === originalAsset.src
      ? route.fulfill({ status: 404, body: "" })
      : route.fallback(),
  );
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  const layer = page.locator('.rf-photo-stage [data-slot="gpu"]');
  await expect(layer).toHaveCount(0);
  await expect(page.locator(".rf-assembly-missing")).toHaveText(
    "1 linh kiện cần ảnh lắp đã xác minh",
  );
  await replacePart(page, "gpu", alternative);
  await expect(
    layer.getByRole("img", { name: alternative.name }),
  ).toBeVisible();
  expect(await imageSource(page, '.rf-photo-stage [data-slot="gpu"] img')).toBe(
    alternativeAsset.src,
  );
  await expect(layer).toHaveAttribute(
    "data-assembly-src",
    alternativeAsset.src,
  );
  await expect(page.locator(".rf-assembly-missing")).toHaveCount(0);
});
