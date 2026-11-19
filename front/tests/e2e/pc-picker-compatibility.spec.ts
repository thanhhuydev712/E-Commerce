import { expect, test, type Page } from "@playwright/test";
import type { Product, StorefrontSnapshot } from "../../src/catalog/model";
import type { Slot } from "../../src/features/pc-builder/lib/compatibility";

const names: Record<Slot, string> = {
  case: "Vỏ case",
  mainboard: "Mainboard",
  cpu: "CPU",
  ram: "RAM",
  gpu: "Card đồ họa",
  ssd: "SSD",
  psu: "Nguồn",
  cooler: "Tản nhiệt",
};
async function catalog(page: Page) {
  const response = await page.request.get("/api/v1/storefront");
  expect(response.ok()).toBe(true);
  return (await response.json()).data as StorefrontSnapshot;
}
async function open(page: Page, slot: Slot) {
  await page
    .getByRole("button", { name: `Chi tiết ${names[slot]}`, exact: true })
    .click();
  await page
    .locator(".rf-photo-inspector")
    .getByRole("button", { name: /^(Chọn|Đổi) linh kiện$/ })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
function row(page: Page, product: Product) {
  return page
    .locator(".rf-picker-list > div")
    .filter({ has: page.getByText(product.name, { exact: true }) });
}
async function close(page: Page) {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Đóng", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("socket và DDR sai bị khóa, nêu lý do và không thay lựa chọn cũ", async ({
  page,
}, info) => {
  const data = await catalog(page);
  const product = (slug: string) =>
    data.products.find((item) => item.slug === slug)!;
  await page.goto("/pc-builder");
  await page.getByRole("button", { name: "Dùng cấu hình đề xuất" }).click();
  await open(page, "cpu");
  const intel = row(page, product("intel-14400f"));
  const choose = intel.getByRole("button", { name: "Chọn", exact: true });
  await expect(choose).toBeDisabled();
  await expect(choose).toHaveAttribute("aria-describedby", /pc-picker-cpu-/);
  await expect(intel).toContainText("LGA1700");
  await expect(intel).toContainText("AM5");
  await choose.dispatchEvent("click");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    row(page, product("ryzen-7700")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeEnabled();
  await close(page);
  await open(page, "ram");
  const wrongRam = row(page, product("ram-ddr4"));
  await expect(
    wrongRam.getByRole("button", { name: "Chọn", exact: true }),
  ).toBeDisabled();
  await expect(wrongRam).toContainText("DDR");
  await expect(
    row(page, product("ram-ddr5")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeEnabled();
  await page.getByRole("dialog").screenshot({
    path: info.outputPath("incompatible-ddr-disabled.png"),
    animations: "disabled",
  });
  await close(page);
  await expect(page.locator('.rf-photo-stage [data-slot="cpu"]')).toHaveCount(
    0,
  ); // CPU remains covered by its cooler.
  await page.getByRole("button", { name: "Chi tiết CPU", exact: true }).click();
  await expect(page.locator(".rf-photo-inspector")).toContainText(
    product("ryzen-7600").name,
  );
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(8);
});

test("case Mini khóa GPU dài, mainboard ATX và tản quá cao; đổi case mở lại lựa chọn", async ({
  page,
}) => {
  const data = await catalog(page);
  const product = (slug: string) =>
    data.products.find((item) => item.slug === slug)!;
  await page.goto("/pc-builder");
  await open(page, "case");
  await row(page, product("case-mini"))
    .getByRole("button", { name: "Chọn", exact: true })
    .click();
  await open(page, "gpu");
  await expect(
    row(page, product("rtx-4070")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(row(page, product("rtx-4070"))).toContainText("khoảng trống");
  await expect(
    row(page, product("rtx-4060")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeEnabled();
  await close(page);
  await open(page, "cooler");
  await expect(
    row(page, product("cooler-ak400")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(row(page, product("cooler-ak400"))).toContainText("giới hạn");
  await row(page, product("cooler-assassin"))
    .getByRole("button", { name: "Chọn", exact: true })
    .click();
  await open(page, "mainboard");
  await expect(
    row(page, product("gigabyte-b650")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(row(page, product("gigabyte-b650"))).toContainText("ATX");
  await close(page);
  await open(page, "case");
  await row(page, product("case-air"))
    .getByRole("button", { name: "Chọn", exact: true })
    .click();
  await open(page, "gpu");
  await expect(
    row(page, product("rtx-4070")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeEnabled();
  await row(page, product("rtx-4070"))
    .getByRole("button", { name: "Chọn", exact: true })
    .click();
  await open(page, "case");
  await expect(
    row(page, product("case-mini")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeDisabled();
  await close(page);
  await page.getByRole("button", { name: "Bỏ gpu", exact: true }).click();
  await open(page, "case");
  await expect(
    row(page, product("case-mini")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeEnabled();
});

test("cấu hình chưa đủ vẫn chọn được CPU không iGPU, nguồn và SSD", async ({
  page,
}) => {
  const data = await catalog(page);
  const product = (slug: string) =>
    data.products.find((item) => item.slug === slug)!;
  await page.goto("/pc-builder");
  await open(page, "cpu");
  await expect(
    row(page, product("intel-14400f")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeEnabled();
  await row(page, product("intel-14400f"))
    .getByRole("button", { name: "Chọn", exact: true })
    .click();
  await expect(page.locator(".rf-compatibility")).toContainText("cần chọn VGA");
  await open(page, "psu");
  await expect(
    row(page, product("psu-650")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeEnabled();
  await close(page);
  await open(page, "ssd");
  await expect(
    row(page, product("ssd-kingston")).getByRole("button", {
      name: "Chọn",
      exact: true,
    }),
  ).toBeEnabled();
  await row(page, product("ssd-kingston"))
    .getByRole("button", { name: "Chọn", exact: true })
    .click();
  await expect(page.locator(".rf-build-slot.selected")).toHaveCount(2);
});
