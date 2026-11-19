import { expect, test, type Page, type TestInfo } from "@playwright/test";
import type { Product, StorefrontSnapshot } from "../../src/catalog/model";
import type { Slot } from "../../src/features/pc-builder/lib/compatibility";
import { installAssemblyPack } from "../support/assembly-fixtures";
import { compatibleAssemblySteps } from "../support/compatible-assembly";

const names: Record<Slot, string> = {
  case: "Vỏ case",
  mainboard: "Mainboard",
  cpu: "CPU",
  ram: "RAM",
  ssd: "SSD",
  psu: "Nguồn",
  gpu: "Card đồ họa",
  cooler: "Tản nhiệt",
};
async function catalog(page: Page) {
  const response = await page.request.get("/api/v1/storefront");
  expect(response.ok()).toBe(true);
  return (await response.json()).data as StorefrontSnapshot;
}
async function captureActualStudio(
  page: Page,
  info: TestInfo,
  filename: string,
) {
  await page.setViewportSize({ width: 1600, height: 1500 });
  await page.evaluate(() => {
    const studio = document.querySelector(".rf-studio")!;
    window.scrollTo({
      top: Math.max(0, scrollY + studio.getBoundingClientRect().top - 180),
      behavior: "instant",
    });
  });
  await page
    .locator(".rf-studio")
    .screenshot({ path: info.outputPath(filename), animations: "disabled" });
}
async function chooseProduct(page: Page, product: Product) {
  await page
    .locator(".rf-picker-list > div")
    .filter({ has: page.getByText(product.name, { exact: true }) })
    .getByRole("button", { name: "Chọn", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function expectLoadedLayers(page: Page, count: number) {
  const images = page.locator('.rf-photo-stage [data-slot] img:not([alt=""])');
  await expect(images).toHaveCount(count);
  await expect
    .poll(() =>
      images.evaluateAll((nodes) =>
        nodes.every((node) => {
          const image = node as HTMLImageElement;
          return image.complete && image.naturalWidth > 0;
        }),
      ),
    )
    .toBe(true);
}
async function replace(page: Page, slot: Slot, product: Product) {
  await page
    .getByRole("button", { name: `Chi tiết ${names[slot]}`, exact: true })
    .click();
  await page
    .locator(".rf-photo-inspector")
    .getByRole("button", { name: /^(Chọn|Đổi) linh kiện$/ })
    .click();
  await chooseProduct(page, product);
}

test("catalog thiếu bộ ảnh lắp không giả bộ máy; mẫu phối cảnh có nhãn riêng", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/images/pc-assembly/manifest.json", (route) =>
    route.fulfill({ json: { version: 1, cases: [], parts: [] } }),
  );
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
  await expect(page.locator(".rf-photo-stage [data-slot]")).toHaveCount(0);
  await expect(
    page.getByText("Cần ảnh case mở hông", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "8 linh kiện cần ảnh lắp" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xem mẫu phối cảnh" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("chưa phản ánh cấu hình bạn đang chọn");
  await expect(dialog.getByRole("img")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Xem mẫu phối cảnh" }),
  ).toBeFocused();
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Xem mẫu phối cảnh" }),
    ).toBeVisible();
    const statusBox = (await page
      .locator(".rf-assembly-missing")
      .boundingBox())!;
    const stageBox = (await page.locator(".rf-photo-stage").boundingBox())!;
    expect(statusBox.y).toBeGreaterThanOrEqual(stageBox.y);
    expect(statusBox.y + statusBox.height).toBeLessThanOrEqual(
      stageBox.y + stageBox.height,
    );
  }
  await page
    .locator(".rf-studio")
    .screenshot({ path: info.outputPath("actual-catalog-assets-missing.png") });
  expect(errors).toEqual([]);
});

test("ảnh minh họa thật ghép case Mini và mainboard MSI từ bộ PNG hiện có", async ({
  page,
}, info) => {
  const data = await catalog(page);
  const chassis = data.products.find(
    (product) => product.slug === "case-mini",
  )!;
  const board = data.products.find((product) => product.slug === "msi-b650")!;
  expect(chassis).toBeTruthy();
  expect(board).toBeTruthy();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Chọn vỏ case", exact: true }).click();
  await chooseProduct(page, chassis);
  await expectLoadedLayers(page, 1);
  await page
    .getByRole("button", { name: "Chi tiết Mainboard", exact: true })
    .click();
  await page
    .locator(".rf-photo-inspector")
    .getByRole("button", { name: "Chọn linh kiện", exact: true })
    .click();
  await chooseProduct(page, board);
  await expectLoadedLayers(page, 2);
  for (const [slot, product] of [
    ["case", chassis],
    ["mainboard", board],
  ] as const) {
    const layer = page.locator(`.rf-photo-stage [data-slot="${slot}"]`);
    await expect(layer).toHaveAttribute("data-product-id", product.id);
    await expect(layer).toHaveAttribute(
      "data-variant-sku",
      product.variants[0].sku,
    );
    await expect(layer).toHaveAttribute(
      "data-assembly-src",
      `/images/pc-assembly/${product.slug}-v1.png`,
    );
    await expect(
      layer.getByRole("img", { name: product.name, exact: true }),
    ).toBeVisible();
  }
  await expect(page.locator(".rf-assembly-unavailable")).toHaveCount(0);
  await expect(page.locator(".rf-assembly-missing")).toHaveCount(0);
  await expect(page.locator(".rf-assembly-illustrative")).toBeVisible();
  await captureActualStudio(page, info, "actual-mini-msi-illustrative.png");
  expect(errors).toEqual([]);
});

test("bộ ảnh minh họa thật lắp cấu hình đề xuất và đổi cả tám nhóm linh kiện", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const data = await catalog(page);
  const errors: string[] = [];
  const requestedPngs = new Set<string>();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    const url = new URL(response.url());
    const assetPath = url.searchParams.get("url") ?? url.pathname;
    if (
      assetPath.startsWith("/images/pc-assembly/") &&
      assetPath.endsWith(".png") &&
      response.ok()
    ) {
      requestedPngs.add(assetPath);
    }
  });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(page.locator(".rf-photo-stage [data-slot]")).toHaveCount(7);
  await expect(page.locator('.rf-photo-stage [data-slot="cpu"]')).toHaveCount(
    0,
  );
  await expectLoadedLayers(page, 7);
  await expect(page.locator(".rf-assembly-illustrative")).toHaveText(
    "Ảnh dựng minh họa · Chưa xác minh tỷ lệ lắp thực tế",
  );
  await expect(page.locator(".rf-assembly-missing")).toHaveCount(0);
  await captureActualStudio(page, info, "actual-starter-illustrative.png");
  await page
    .getByRole("button", { name: "Tách linh kiện", exact: true })
    .click();
  await expectLoadedLayers(page, 8);
  for (const { slot, slug, remove = [] } of compatibleAssemblySteps) {
    for (const removed of remove)
      await page
        .getByRole("button", { name: `Bỏ ${removed}`, exact: true })
        .click();
    const layer = page.locator(`.rf-photo-stage [data-slot="${slot}"]`);
    const previousSource = (await layer.count())
      ? await layer.getAttribute("data-assembly-src")
      : null;
    const alternative = data.products.find((product) => product.slug === slug)!;
    expect(alternative, slot).toBeTruthy();
    await replace(page, slot, alternative);
    const expectedSource = `/images/pc-assembly/${alternative.slug}-v1.png`;
    await expect(layer).toHaveAttribute("data-product-id", alternative.id);
    await expect(layer).toHaveAttribute(
      "data-variant-sku",
      alternative.variants[0].sku,
    );
    await expect(layer).toHaveAttribute("data-assembly-src", expectedSource);
    expect(expectedSource).not.toBe(previousSource);
    const image = layer.getByRole("img", {
      name: alternative.name,
      exact: true,
    });
    await expect(image).toBeVisible();
    const src = (await image.getAttribute("src"))!;
    const imageUrl = new URL(src, page.url());
    expect(imageUrl.searchParams.get("url") ?? imageUrl.pathname).toBe(
      expectedSource,
    );
    if (["ram", "gpu", "cooler"].includes(slot)) {
      await expect(layer.locator(".rf-assembly-crop")).toBeVisible();
      await expect(image).toHaveCSS("object-fit", "fill");
    }
    await expectLoadedLayers(
      page,
      await page.locator(".rf-build-slot.selected").count(),
    );
    await expect.poll(() => requestedPngs.has(expectedSource)).toBe(true);
    await expect(page.locator(".rf-assembly-missing")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Thu gọn", exact: true }).click();
  await expectLoadedLayers(page, 7);
  await expect(page.locator(".rf-assembly-unavailable")).toHaveCount(0);
  await expect(page.locator(".rf-assembly-illustrative")).toBeVisible();
  await captureActualStudio(page, info, "actual-swapped-illustrative.png");
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const stage = (await page.locator(".rf-photo-stage").boundingBox())!;
    const chassis = (await page
      .locator('.rf-photo-stage [data-slot="case"]')
      .boundingBox())!;
    expect(chassis.y).toBeGreaterThanOrEqual(stage.y - 1);
    expect(chassis.y + chassis.height).toBeLessThanOrEqual(
      stage.y + stage.height + 1,
    );
  }
  expect(errors).toEqual([]);
});

test("bộ ảnh test đã duyệt thay đúng SKU cho cả tám nhóm và hiệu chuẩn lại khi đổi case", async ({
  page,
}, info) => {
  const { data, registry } = await installAssemblyPack(page);
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(page.locator(".rf-photo-stage [data-slot]")).toHaveCount(8);
  for (const { slot, slug, remove = [] } of compatibleAssemblySteps) {
    for (const removed of remove)
      await page
        .getByRole("button", { name: `Bỏ ${removed}`, exact: true })
        .click();
    const layer = page.locator(`.rf-photo-stage [data-slot="${slot}"]`);
    const previousSource = (await layer.count())
      ? await layer.getAttribute("data-assembly-src")
      : null;
    const alternative = data.products.find((product) => product.slug === slug)!;
    expect(alternative, slot).toBeTruthy();
    await replace(page, slot, alternative);
    await expect(layer).toHaveAttribute("data-product-id", alternative.id);
    await expect(layer).toHaveAttribute(
      "data-variant-sku",
      alternative.variants[0].sku,
    );
    const source = await layer.getAttribute("data-assembly-src");
    expect(source).not.toBe(previousSource);
    const chassis = await page
      .locator('.rf-photo-stage [data-slot="case"]')
      .getAttribute("data-variant-sku");
    const profile = registry.cases.find((item) => item.variantSku === chassis)!;
    const asset =
      slot === "case"
        ? profile
        : registry.parts.find(
            (item) =>
              item.caseProfileId === profile.id &&
              item.variantSku === alternative.variants[0].sku,
          )!;
    expect(source).toBe(asset.src);
    await expect
      .poll(
        async () =>
          new URL(
            (await layer
              .getByRole("img", { name: alternative.name })
              .getAttribute("src"))!,
            page.url(),
          ).pathname,
      )
      .toBe(asset.src);
    await expect(layer.getByRole("img", { name: alternative.name })).toHaveCSS(
      "object-fit",
      "contain",
    );
  }
  await expect(page.locator(".rf-assembly-interior")).toHaveAttribute(
    "data-clipped",
    "true",
  );
  await expect(page.locator(".rf-assembly-foreground")).toHaveCSS(
    "z-index",
    "60",
  );
  await expect(page.locator("canvas")).toHaveCount(0);
  await page
    .locator(".rf-studio")
    .screenshot({ path: info.outputPath("fixture-only-layer-positions.png") });
});

test("CPU bị che khi có tản, tách linh kiện cho xem lại mà không đổi cấu hình", async ({
  page,
}) => {
  await installAssemblyPack(page, { hiddenCpu: true });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  const cpu = page.locator('.rf-photo-stage [data-slot="cpu"]');
  await expect(cpu).toHaveCount(0);
  await page
    .getByRole("button", { name: "Tách linh kiện", exact: true })
    .click();
  await expect(cpu).toBeVisible();
  await expect(page.locator(".rf-assembly-interior")).toHaveAttribute(
    "data-clipped",
    "false",
  );
  await page.getByRole("button", { name: "Thu gọn", exact: true }).click();
  await expect(cpu).toHaveCount(0);
  await page.getByRole("button", { name: "Bỏ cooler", exact: true }).click();
  await expect(cpu).toBeVisible();
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(7);
});

test("đổi mainboard bỏ ảnh tản phụ thuộc điểm socket cũ", async ({ page }) => {
  const { data } = await installAssemblyPack(page, {
    requireBoardForCooler: true,
  });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(
    page.locator('.rf-photo-stage [data-slot="cooler"]'),
  ).toHaveCount(1);
  const alternative = data.products.find(
    (product) => product.builderEligible && product.slug === "gigabyte-b650",
  )!;
  await replace(page, "mainboard", alternative);
  await expect(
    page.locator('.rf-photo-stage [data-slot="cooler"]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: "1 linh kiện cần ảnh lắp" }),
  ).toBeVisible();
});

test("ảnh case lỗi gỡ toàn bộ lớp phụ thuộc, không giữ case hay linh kiện mẫu cũ", async ({
  page,
}) => {
  await installAssemblyPack(page, { failSlot: "case" });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(
    page.getByText("Cần ảnh case mở hông", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".rf-photo-stage [data-slot]")).toHaveCount(0);
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
});

test("manifest sai cấu trúc không chạy ảnh chưa duyệt và không lỗi trang", async ({
  page,
}) => {
  await installAssemblyPack(page, { invalidManifest: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(
    page.getByText("Cần ảnh case mở hông", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".rf-photo-stage [data-slot]")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("animation kết thúc không ghi đè độ mờ case và chế độ tập trung", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await installAssemblyPack(page);
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await page.getByRole("button", { name: "Làm mờ case", exact: true }).click();
  await expect(page.locator('.rf-photo-stage [data-slot="case"]')).toHaveCSS(
    "opacity",
    "0.22",
  );
  await page
    .getByRole("button", { name: "Chi tiết Card đồ họa", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Tập trung linh kiện", exact: true })
    .click();
  await expect(
    page.locator('.rf-photo-stage [data-slot="mainboard"]'),
  ).toHaveCSS("opacity", "0.1");
  await expect(page.locator('.rf-photo-stage [data-slot="gpu"]')).toHaveCSS(
    "opacity",
    "1",
  );
});
