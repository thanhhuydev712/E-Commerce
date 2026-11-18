import { expect, test } from "@playwright/test";

test("PC Studio chỉ dùng ảnh sản phẩm và giữ cấu hình khi đổi góc ảnh ghép", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  const modelRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/pc[-_]scene|\.glb(?:[?#]|$)/i.test(request.url()))
      modelRequests.push(request.url());
  });
  await page.goto("/pc-builder");
  await expect(
    page.getByRole("button", { name: "3D", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("#pc-studio-photo-status")).toContainText(
    "Ảnh ghép lấy từ từng sản phẩm đang chọn trong catalog",
  );
  await expect(page.locator("#pc-studio-photo-status")).toContainText(
    "chưa phải ảnh bộ máy đã lắp",
  );
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
  const assembly = page.locator(".rf-photo-assembly");
  await expect(assembly).toBeVisible();
  await expect(page.locator(".rf-photo-stage [data-slot]")).toHaveCount(8);
  await page.getByRole("button", { name: "Tách linh kiện" }).click();
  await expect(assembly).toHaveAttribute("data-exploded", "true");
  for (const [preset, value] of [
    ["Trực diện", "front"],
    ["Góc bên", "side"],
    ["Góc 3/4", "perspective"],
  ]) {
    await page.getByRole("button", { name: preset, exact: true }).click();
    await expect(
      page.getByRole("button", { name: preset, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(assembly).toHaveAttribute("data-camera-view", value);
  }
  await page.getByRole("button", { name: "Góc nhìn", exact: true }).click();
  await expect(assembly).toBeVisible();
  await expect(
    page.getByText("Ảnh ghép sản phẩm", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
  await expect(page.locator(".rf-viewport canvas")).toHaveCount(0);
  await expect(page.locator(".rf-scene-stage")).toHaveCount(0);
  expect(modelRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("ảnh ghép giữ điều khiển màu nền, độ rõ case và linh kiện trên desktop/mobile", async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  const assembly = page.locator(".rf-photo-assembly");
  await expect(assembly).toBeVisible();
  await page.getByRole("button", { name: "Ánh sáng Tím", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Ánh sáng Tím", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Bật nền sáng", exact: true }).click();
  await expect(assembly).toHaveAttribute("data-powered", "true");
  await page
    .locator(".rf-studio")
    .screenshot({ path: testInfo.outputPath("photo-assembled.png") });
  await page
    .getByRole("button", { name: "Tách linh kiện", exact: true })
    .click();
  await expect(assembly).toHaveAttribute("data-exploded", "true");
  await page
    .locator(".rf-studio")
    .screenshot({ path: testInfo.outputPath("photo-exploded.png") });
  await page.getByRole("button", { name: "Thu gọn", exact: true }).click();
  await expect(assembly).toHaveAttribute("data-exploded", "false");
  await page.getByRole("button", { name: "Làm mờ case", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Hiện rõ case", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const caseLayer = page.locator('.rf-photo-stage [data-slot="case"]');
  await expect(caseLayer).toHaveAttribute("data-muted", "true");
  await page.getByRole("button", { name: "Hiện rõ case", exact: true }).click();
  await expect(caseLayer).toHaveAttribute("data-muted", "false");
  await page.getByRole("button", { name: "Trực diện", exact: true }).click();
  await expect(assembly).toHaveAttribute("data-camera-view", "front");
  await page
    .getByRole("button", { name: "Ánh sáng Xanh băng", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ánh sáng Xanh băng", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(
      async () => (await page.locator(".rf-photo-stage").boundingBox())!.width,
    )
    .toBeLessThan(391);
  await page.getByRole("button", { name: "Chi tiết RAM", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Chi tiết RAM", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator(".rf-photo-inspector").getByRole("heading", {
      name: "RAM",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .locator(".rf-studio")
    .screenshot({ path: testInfo.outputPath("photo-mobile.png") });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
  await expect(
    page.getByRole("button", { name: "3D", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".rf-viewport canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});
