import { expect, test } from "@playwright/test";

test("PC Studio mở 3D, đổi góc nhìn và về ảnh ghép không phát sinh pageerror", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator(".rf-viewport canvas")).toBeVisible({
    timeout: 30000,
  });
  await page
    .locator(".rf-viewport canvas")
    .evaluate((canvas) =>
      canvas.setAttribute("data-runtime-id", "original-canvas"),
    );
  await page.getByRole("button", { name: "Tách linh kiện" }).click();
  for (const preset of ["Trực diện", "Góc bên", "Góc 3/4"]) {
    await page.getByRole("button", { name: preset, exact: true }).click();
    await expect(
      page.getByRole("button", { name: preset, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".rf-viewport canvas")).toHaveAttribute(
      "data-runtime-id",
      "original-canvas",
    );
  }
  await page.getByRole("button", { name: "Góc nhìn", exact: true }).click();
  await expect(page.locator(".rf-viewport canvas")).toBeVisible();
  await expect(page.locator(".rf-viewport canvas")).toHaveAttribute(
    "data-runtime-id",
    "original-canvas",
  );
  await page.getByRole("button", { name: "Ảnh ghép", exact: true }).click();
  await expect(page.locator(".rf-photo-assembly")).toBeVisible();
  expect(errors).toEqual([]);
});

test("góc và màu 3D thay đổi hình render trên cùng canvas", async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  const shaderErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /WebGLProgram|WebGLShader|VALIDATE_STATUS|INVALID_OPERATION/.test(
        message.text(),
      )
    )
      shaderErrors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await page.getByRole("button", { name: "Ánh sáng Tím", exact: true }).click();
  await page.getByRole("button", { name: "Bật thử", exact: true }).click();
  await page
    .locator(".rf-studio")
    .screenshot({ path: testInfo.outputPath("photo-assembled.png") });
  await page
    .getByRole("button", { name: "Tách linh kiện", exact: true })
    .click();
  await page
    .locator(".rf-studio")
    .screenshot({ path: testInfo.outputPath("photo-exploded.png") });
  await page.getByRole("button", { name: "Thu gọn", exact: true }).click();
  await page.getByRole("button", { name: "3D", exact: true }).click();
  const canvas = page.locator(".rf-viewport canvas");
  await expect(canvas).toBeVisible();
  await canvas.evaluate((node) =>
    node.setAttribute("data-runtime-id", "visual-canvas"),
  );
  const perspective = await canvas.screenshot();
  await page
    .locator(".rf-studio")
    .screenshot({ path: testInfo.outputPath("scene-perspective.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(
      async () => (await page.locator(".rf-scene-stage").boundingBox())!.width,
    )
    .toBeLessThan(391);
  await expect
    .poll(() =>
      canvas.evaluate(
        (node) =>
          Math.abs(
            (node as HTMLCanvasElement).width / node.clientWidth -
              Math.min(window.devicePixelRatio, 1.5),
          ) < 0.05,
      ),
    )
    .toBe(true);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(canvas).toHaveAttribute("data-runtime-id", "visual-canvas");
  await page
    .locator(".rf-scene-stage")
    .screenshot({ path: testInfo.outputPath("scene-perspective-mobile.png") });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Trực diện", exact: true }).click();
  await expect
    .poll(async () => (await canvas.screenshot()).equals(perspective))
    .toBe(false);
  await page
    .locator(".rf-studio")
    .screenshot({ path: testInfo.outputPath("scene-front.png") });
  // Cố định nền DOM để phép đo màu chỉ phản ánh hình WebGL, không phải halo CSS.
  const neutralBackground = await page.addStyleTag({
    content:
      '.rf-scene-stage > [aria-hidden="true"] { visibility: hidden !important; }',
  });
  const front = await canvas.screenshot();
  await page
    .getByRole("button", { name: "Ánh sáng Xanh băng", exact: true })
    .click();
  await expect
    .poll(async () => (await canvas.screenshot()).equals(front))
    .toBe(false);
  await expect(canvas).toHaveAttribute("data-runtime-id", "visual-canvas");
  await neutralBackground.evaluate((node) =>
    node.parentNode?.removeChild(node),
  );
  await page.getByRole("button", { name: "Ảnh ghép", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Chi tiết RAM", exact: true }).click();
  await page
    .locator(".rf-studio")
    .screenshot({ path: testInfo.outputPath("photo-mobile.png") });
  expect(shaderErrors).toEqual([]);
});
