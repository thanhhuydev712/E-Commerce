import { expect, test } from "@playwright/test";
import {
  checkBuild,
  missingSlots,
} from "../../src/features/pc-builder/lib/compatibility";
import type { Product } from "../../src/catalog/model";

function product(
  id: string,
  category: string,
  technical: Product["technical"] = {},
): Product {
  return {
    id,
    databaseId: id,
    slug: id,
    name: id,
    category,
    technical,
    brand: "Test",
    price: "1000000",
    oldPrice: "1000000",
    image: "",
    specs: [],
    builderEligible: true,
    stock: 1,
    warranty: "",
    reviews: [],
    variants: [
      {
        id,
        sku: id,
        label: id,
        price: "1000000",
        oldPrice: "1000000",
        stock: 1,
      },
    ],
  };
}

test("thiếu thông số không được kết luận socket hoặc DDR phù hợp", () => {
  const products = [
    product("cpu", "cpu"),
    product("board", "mainboard"),
    product("ram", "ram"),
  ];
  const result = checkBuild(
    { cpu: "cpu", mainboard: "board", ram: "ram" },
    (id) => products.find((p) => p.id === id),
  );
  expect(result.some((check) => check.level === "ok")).toBe(false);
  expect(
    result.filter((check) => check.level === "warning").length,
  ).toBeGreaterThanOrEqual(3);
});

test("socket khác và DDR khác phải bị chặn", () => {
  const products = [
    product("cpu", "cpu", { socket: "AM5" }),
    product("board", "mainboard", { socket: "LGA1700", ddr: "DDR4" }),
    product("ram", "ram", { ddr: "DDR5" }),
  ];
  const errors = checkBuild(
    { cpu: "cpu", mainboard: "board", ram: "ram" },
    (id) => products.find((p) => p.id === id),
  ).filter((check) => check.level === "error");
  expect(errors.some((check) => check.message.includes("không phù hợp"))).toBe(
    true,
  );
  expect(
    errors.some((check) => check.message.includes("khác thế hệ DDR")),
  ).toBe(true);
});

test("ID cũ hoặc linh kiện sai nhóm vẫn được tính là chưa hoàn thiện", () => {
  const cpu = product("cpu", "cpu");
  const lookup = (id: string) => (id === cpu.id ? cpu : undefined);
  expect(missingSlots({ cpu: "removed", ram: "cpu" }, lookup)).toEqual(
    expect.arrayContaining(["cpu", "ram"]),
  );
  expect(
    checkBuild({ ram: "cpu" }, lookup).some((check) => check.level === "error"),
  ).toBe(true);
});

test("không báo sai kích thước hoặc nguồn khi thiếu dữ liệu kỹ thuật", () => {
  const products = [
    product("gpu", "gpu", { length: 300 }),
    product("case", "case"),
    product("psu", "psu"),
  ];
  const checks = checkBuild({ gpu: "gpu", case: "case", psu: "psu" }, (id) =>
    products.find((p) => p.id === id),
  );
  expect(checks.some((check) => check.level === "error")).toBe(false);
  expect(checks.some((check) => check.level === "ok")).toBe(false);
});

test("cấu hình hết hàng bị chặn nhưng CPU có iGPU không bắt buộc VGA rời", () => {
  const cpu = product("cpu", "cpu", { integrated: true });
  cpu.variants[0].stock = 0;
  const lookup = (id: string) => (id === cpu.id ? cpu : undefined);
  expect(
    checkBuild({ cpu: "cpu" }, lookup).some(
      (check) => check.level === "error" && check.message.includes("hết hàng"),
    ),
  ).toBe(true);
  expect(missingSlots({ cpu: "cpu" }, lookup)).not.toContain("gpu");
});
