import { expect, test } from "@playwright/test";

test("bản ghép khởi đầu rỗng và không cần WebGL", async ({ page }) => {
  await page.goto("/pc-builder");
  await expect(
    page.getByRole("button", { name: "Ảnh ghép", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".rf-photo-stage [data-slot]")).toHaveCount(0);
  await expect(page.locator(".rf-viewport canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Chọn vỏ case", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".rf-picker-list img").first()).toBeVisible();
});

test("chọn, bỏ và hoàn tác cập nhật lớp ảnh cùng bảng chi tiết", async ({
  page,
}) => {
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(page.locator(".rf-photo-stage [data-slot]")).toHaveCount(8);
  await expect(
    page.locator('.rf-photo-stage [data-slot="case"]'),
  ).toBeVisible();
  expect(
    (await page.locator(".rf-photo-stack").boundingBox())!.width,
  ).toBeGreaterThan(100);
  await expect
    .poll(() =>
      page
        .locator(".rf-photo-stage img")
        .evaluateAll((images) =>
          images.every(
            (node) =>
              (node as HTMLImageElement).complete &&
              (node as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Chi tiết RAM", exact: true }).click();
  await expect(page.locator(".rf-photo-inspector h4")).toHaveText("RAM");
  await expect(page.locator(".rf-photo-inspector img")).toBeVisible();
  await page
    .getByRole("button", { name: "Đổi linh kiện", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Chọn", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Bỏ ram", exact: true }).click();
  await expect(page.locator('.rf-photo-stage [data-slot="ram"]')).toHaveCount(
    0,
  );
  await expect(page.locator(".rf-photo-inspector")).toContainText(
    "Chưa chọn linh kiện",
  );
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect(page.locator('.rf-photo-stage [data-slot="ram"]')).toHaveCount(
    1,
  );
});

test("bản ghép hỗ trợ lắp tách, kính, nguồn, zoom và giảm chuyển động", async ({
  page,
}) => {
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await page
    .getByRole("button", { name: "Tách linh kiện", exact: true })
    .click();
  await expect(page.locator(".rf-photo-assembly")).toHaveAttribute(
    "data-exploded",
    "true",
  );
  await page.getByRole("button", { name: "Thu gọn", exact: true }).click();
  await page.getByRole("button", { name: "Mở kính", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Đóng kính", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Phóng to bản ghép", exact: true })
    .click();
  await expect(page.locator(".rf-photo-stage")).toContainText("110%");
  await page
    .getByRole("button", { name: "Xem chính diện", exact: true })
    .press("Enter");
  await expect(page.locator(".rf-photo-stage")).toContainText("100%");
  await page.getByRole("button", { name: "Bật thử", exact: true }).click();
  await page.getByRole("checkbox", { name: "Giảm chuyển động" }).check();
  await expect(page.locator(".rf-photo-assembly")).toHaveAttribute(
    "data-powered",
    "true",
  );
  await expect(page.locator(".rf-photo-stage")).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
  await expect
    .poll(() =>
      page
        .locator('.rf-photo-stage [data-slot="gpu"]')
        .evaluate((node) => getComputedStyle(node).animationName),
    )
    .toBe("none");
});

test("ảnh lớp bị lỗi có fallback và vẫn giữ linh kiện đã chọn", async ({
  page,
}) => {
  await page.route("**/_next/image?*", (route) => {
    const image = new URL(route.request().url()).searchParams.get("url");
    return image === "/images/pc-studio/gpu.webp"
      ? route.fulfill({ status: 404, body: "" })
      : route.continue();
  });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  const gpu = page.locator('.rf-photo-stage [data-slot="gpu"]');
  await expect(gpu).toContainText("Card đồ họa");
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
  await page
    .getByRole("button", { name: "Chi tiết Card đồ họa", exact: true })
    .click();
  await expect(page.locator(".rf-photo-inspector img")).toBeVisible();
});

test("studio ảnh ghép không tràn ngang trên mobile, tablet và desktop", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator(".rf-photo-assembly").scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
      String(width),
    ).toBe(false);
    await expect(
      page.getByRole("button", { name: "Chi tiết CPU", exact: true }),
    ).toBeVisible();
    if ([390, 1440].includes(width))
      await page
        .locator(".rf-studio")
        .screenshot({ path: testInfo.outputPath(`photo-studio-${width}.png`) });
  }
  expect(errors).toEqual([]);
});

test("tách ảnh để lộ CPU và chế độ tập trung giữ linh kiện đang xem", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await page
    .getByRole("button", { name: "Tách linh kiện", exact: true })
    .click();
  const cpu = page.locator('.rf-photo-stage [data-slot="cpu"]');
  const cooler = page.locator('.rf-photo-stage [data-slot="cooler"]');
  const cpuBox = (await cpu.boundingBox())!,
    coolerBox = (await cooler.boundingBox())!;
  expect(cpuBox.x + cpuBox.width).toBeLessThan(coolerBox.x);
  await expect(cpu).toContainText("CPU");
  await page.getByRole("button", { name: "Chi tiết CPU", exact: true }).click();
  await page
    .getByRole("button", { name: "Tập trung linh kiện", exact: true })
    .click();
  await expect
    .poll(() => cooler.evaluate((node) => getComputedStyle(node).opacity))
    .toBe("0.1");
  await expect
    .poll(() => cpu.evaluate((node) => getComputedStyle(node).opacity))
    .toBe("1");
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
  await page.getByRole("button", { name: "Chi tiết RAM", exact: true }).click();
  await expect(page.locator(".rf-photo-inspector h4")).toHaveText("RAM");
  await expect
    .poll(() => cpu.evaluate((node) => getComputedStyle(node).opacity))
    .toBe("0.1");
});

test("preset và màu ánh sáng ảnh ghép giữ cấu hình và chi tiết đã chọn", async ({
  page,
}) => {
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await page.getByRole("button", { name: "Chi tiết RAM", exact: true }).click();
  await page.getByRole("button", { name: "Trực diện", exact: true }).click();
  await expect(page.locator(".rf-photo-assembly")).toHaveAttribute(
    "data-camera-view",
    "front",
  );
  await page.getByRole("button", { name: "Ánh sáng Tím", exact: true }).click();
  await page.getByRole("button", { name: "Bật thử", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Ánh sáng Tím", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page
        .locator(".rf-photo-lighting span")
        .first()
        .evaluate((node) => getComputedStyle(node).borderColor),
    )
    .toBe("rgb(196, 181, 253)");
  await expect(page.locator(".rf-photo-inspector h4")).toHaveText("RAM");
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
});
