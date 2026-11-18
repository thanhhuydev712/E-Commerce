import { expect, test } from "@playwright/test";

test("modal khóa nền khi wheel/keyboard và trả lại vị trí khi đóng", async ({
  page,
}) => {
  await page.goto("/pc-builder");
  const trigger = page.getByRole("button", {
    name: "Chọn cooler",
    exact: true,
  });
  await trigger.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.style.position))
    .toBe("fixed");
  const locked = await page.evaluate(() => ({
    y: window.scrollY,
    top: document.body.style.top,
  }));
  await page.mouse.move(5, 5);
  await page.mouse.wheel(0, 900);
  await page.keyboard.press("PageDown");
  expect(await page.evaluate(() => window.scrollY)).toBe(locked.y);
  expect(await page.evaluate(() => document.body.style.top)).toBe(locked.top);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.position)).not.toBe(
    "fixed",
  );
});

test("modal dài chỉ cuộn phần nội dung, giữ tiêu đề và search", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 650 });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Chọn cooler", exact: true }).click();
  const dialog = page.getByRole("dialog"),
    body = dialog.locator(".rf-dialog-body");
  await body.evaluate((element) => {
    const space = document.createElement("div");
    space.style.height = "1200px";
    space.dataset.scrollProbe = "true";
    element.append(space);
  });
  const head = await dialog.locator(".rf-dialog-head").boundingBox();
  const search = await dialog
    .getByRole("textbox", { name: "Tìm linh kiện" })
    .boundingBox();
  await body.hover();
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => body.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  expect((await dialog.locator(".rf-dialog-head").boundingBox())!.y).toBe(
    head!.y,
  );
  expect(
    (await dialog
      .getByRole("textbox", { name: "Tìm linh kiện" })
      .boundingBox())!.y,
  ).toBe(search!.y);
  expect(await dialog.evaluate((element) => element.scrollTop)).toBe(0);
  await body.evaluate((element) => {
    element.querySelector("[data-scroll-probe]")?.remove();
    element.scrollTop = 0;
  });
  await dialog.screenshot({ path: info.outputPath("picker-mobile.png") });
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

test("modal ngắn không có vùng cuộn thừa và không đóng khi bấm nội dung", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Chọn cooler", exact: true }).click();
  const dialog = page.getByRole("dialog");
  expect(
    await dialog
      .locator(".rf-dialog-body")
      .evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
  ).toBe(true);
  await dialog.getByRole("heading").click();
  await expect(dialog).toBeVisible();
  await dialog.screenshot({ path: info.outputPath("picker-desktop.png") });
  await page.mouse.click(2, 2);
  await expect(dialog).toHaveCount(0);
});
