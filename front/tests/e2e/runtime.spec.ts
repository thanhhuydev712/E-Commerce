import { expect, test } from "@playwright/test";

test("PC Studio mở 3D, đổi góc nhìn và về 2D không phát sinh pageerror", async ({
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
  await page.getByRole("button", { name: "Góc nhìn", exact: true }).click();
  await expect(page.locator(".rf-viewport canvas")).toBeVisible();
  await expect(page.locator(".rf-viewport canvas")).toHaveAttribute(
    "data-runtime-id",
    "original-canvas",
  );
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.locator(".rf-2d-machine")).toBeVisible();
  expect(errors).toEqual([]);
});
