import { expect, test, type Page } from "@playwright/test";
import type { StorefrontSnapshot } from "../../src/catalog/model";

async function storefront(page: Page) {
  const response = await page.request.get("/api/v1/storefront");
  expect(response.ok()).toBe(true);
  return (await response.json()).data as StorefrontSnapshot;
}

test("catalog chặn khoảng giá ngược và hỗ trợ sửa URL giá sai", async ({
  page,
}) => {
  await page.goto("/products?category=ram");
  await page.locator("#catalog-filters summary").click();
  await page.getByLabel("Giá từ (₫)", { exact: true }).fill("3000000");
  await page.getByLabel("Giá đến (₫)", { exact: true }).fill("1000000");
  await page.getByRole("button", { name: "Áp dụng giá" }).click();
  await expect(page.locator("#catalog-price-error")).toContainText(
    "Giá từ phải nhỏ hơn",
  );
  await expect(page).not.toHaveURL(/min=/);
  await expect(page.getByLabel("Giá từ (₫)", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await page.goto(
    "/products?category=ram&min=3000000&max=1000000&sort=low&page=3",
  );
  await expect(
    page.locator(".rf-catalog-reference [role=alert]"),
  ).toContainText("Khoảng giá chưa hợp lệ");
  await page.getByRole("button", { name: "Đổi hai mức giá" }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("min"))
    .toBe("1000000");
  const params = new URL(page.url()).searchParams;
  expect(params.get("max")).toBe("3000000");
  expect(params.get("category")).toBe("ram");
  expect(params.get("sort")).toBe("low");
  expect(params.has("page")).toBe(false);
  await expect(page.locator(".rf-catalog-reference [role=alert]")).toHaveCount(
    0,
  );
});

test("lọc còn hàng dùng tồn biến thể, giữ qua refresh và bỏ bằng chip", async ({
  page,
}) => {
  const data = await storefront(page);
  const stocked = data.products.filter((product) =>
    product.variants.some((variant) => variant.stock > 0),
  );
  expect(stocked.length).toBeGreaterThan(0);
  await page.goto("/products?sort=low&page=2");
  const checkbox = page.getByRole("checkbox", {
    name: "Chỉ hiện sản phẩm còn hàng",
  });
  await checkbox.click();
  await expect(page).toHaveURL(/inStock=1/);
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.locator(".rf-catalog-grid .rf-product-card")).toHaveCount(
    Math.min(20, stocked.length),
  );
  const links = await page
    .locator(".rf-catalog-grid .rf-reference-card-name")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")),
    );
  expect(links.length).toBeGreaterThan(0);
  for (const href of links)
    expect(
      stocked.some((product) => href === `/products/${product.slug}`),
    ).toBe(true);
  await page.reload();
  await expect(checkbox).toBeChecked();
  await page
    .getByRole("button", { name: "Bỏ lọc Còn hàng", exact: true })
    .click();
  await expect(checkbox).not.toBeChecked();
  await expect(page).not.toHaveURL(/inStock=/);
});

test("xóa bộ lọc giữ từ khóa và danh mục, tìm lại không mất ngữ cảnh", async ({
  page,
}) => {
  await page.goto("/products?category=ram&q=DDR5&max=1&sort=low&inStock=1");
  await expect(
    page.getByRole("heading", { name: "Chưa tìm thấy sản phẩm phù hợp" }),
  ).toBeVisible();
  await page
    .locator(".rf-active-filters")
    .getByRole("link", { name: "Xóa bộ lọc", exact: true })
    .click();
  await expect
    .poll(() => new URL(page.url()).searchParams.has("max"))
    .toBe(false);
  const params = new URL(page.url()).searchParams;
  expect(params.get("q")).toBe("DDR5");
  expect(params.get("category")).toBe("ram");
  expect(params.get("sort")).toBe("low");
  expect(params.has("inStock")).toBe(false);
  await expect(
    page.locator(".rf-catalog-grid .rf-product-card").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Lọc CPU", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("searchbox", { name: "Từ khóa trong danh mục" })
    .fill("khong-co-123-rigforce");
  await page.getByRole("button", { name: "Tìm sản phẩm", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Chưa tìm thấy sản phẩm phù hợp" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa từ khóa", exact: true }).click();
  await expect(page).not.toHaveURL(/q=/);
  await expect(page).toHaveURL(/category=ram/);
});

test("mobile mở bộ lọc và dùng được lựa chọn còn hàng không tràn ngang", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products?category=ram");
  await page
    .getByRole("button", { name: "Bộ lọc sản phẩm", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Chỉ hiện sản phẩm còn hàng" })
    .click();
  await expect(page).toHaveURL(/inStock=1/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("so sánh cùng nhóm có tên thuộc tính, lọc khác biệt và bỏ sản phẩm", async ({
  page,
}) => {
  const data = await storefront(page);
  const products = data.products
    .filter((product) => product.category === "ram" && product.technical.ddr)
    .slice(0, 2);
  expect(products).toHaveLength(2);
  for (const product of products) {
    await page.goto(`/products/${product.slug}`);
    const button = page.getByRole("button", {
      name: "Thêm so sánh",
      exact: true,
    });
    await button.click();
    await expect(
      page.getByRole("button", { name: "Đã thêm so sánh", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page.goto("/compare");
  const table = page.getByRole("region", { name: "Bảng so sánh sản phẩm" });
  await expect(
    table.getByRole("rowheader", { name: "Thế hệ RAM", exact: true }),
  ).toBeVisible();
  await expect(
    table.getByRole("rowheader", { name: /^Thông số \d/ }),
  ).toHaveCount(0);
  const checkbox = page.getByRole("checkbox", {
    name: "Chỉ xem điểm khác biệt",
  });
  const before = await table.locator("tbody tr").count();
  await checkbox.check();
  await expect(
    table.getByRole("rowheader", { name: "Loại sản phẩm", exact: true }),
  ).toHaveCount(0);
  expect(await table.locator("tbody tr").count()).toBeLessThan(before);
  await checkbox.uncheck();
  await expect(
    table.getByRole("rowheader", { name: "Loại sản phẩm", exact: true }),
  ).toBeVisible();
  await table
    .getByRole("button", {
      name: `Bỏ ${products[0].name} khỏi so sánh`,
      exact: true,
    })
    .click();
  await expect(checkbox).toBeDisabled();
  await expect(
    page.getByText("Đã chọn 1/4 sản phẩm", { exact: true }),
  ).toBeVisible();
});

test("so sánh khác nhóm báo phạm vi thông số và cuộn bảng trên mobile", async ({
  page,
}) => {
  const data = await storefront(page);
  const products = [
    data.products.find((product) => product.category === "ram")!,
    data.products.find((product) => product.category === "cpu")!,
  ];
  expect(products.every(Boolean)).toBe(true);
  await page.addInitScript(
    (ids) => localStorage.setItem("rigforge-compare-v2", JSON.stringify(ids)),
    products.map((product) => product.id),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/compare");
  await expect(page.locator("#compare-guidance")).toContainText(
    "sản phẩm khác nhóm",
  );
  const table = page.getByRole("region", { name: "Bảng so sánh sản phẩm" });
  await expect(
    table.getByText("Không cùng nhóm", { exact: true }).first(),
  ).toBeVisible();
  await expect(table.getByRole("link", { name: /Xem chi tiết/ })).toHaveCount(
    2,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await table.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true);
});
