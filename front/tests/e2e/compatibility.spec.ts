import { expect, test } from "@playwright/test";
import type { Product } from "../../src/catalog/model";
import {
  checkBuild,
  estimateWatts,
  getCandidateCompatibility,
  type Build,
  type Slot,
} from "../../src/features/pc-builder/lib/compatibility";

function product(
  slot: Slot,
  id: string,
  technical: Product["technical"] = {},
): Product {
  return {
    id,
    databaseId: id,
    slug: id,
    name: id,
    category: slot,
    brand: "Test",
    price: "1",
    oldPrice: "1",
    image: "",
    specs: [],
    technical,
    builderEligible: true,
    stock: 1,
    warranty: "",
    reviews: [],
    variants: [
      {
        id: `${id}-variant`,
        sku: `${id}-sku`,
        label: "Default",
        price: "1",
        oldPrice: "1",
        stock: 1,
      },
    ],
  };
}
function assess(existing: [Slot, Product][], slot: Slot, candidate: Product) {
  const build = Object.fromEntries(
    existing.map(([key, item]) => [key, item.id]),
  ) as Build;
  return getCandidateCompatibility(
    build,
    slot,
    candidate,
    (id) => existing.find(([, item]) => item.id === id)?.[1],
  );
}

const pairs: [string, Slot, Product, Slot, Product][] = [
  [
    "socket",
    "cpu",
    product("cpu", "am5", { socket: "AM5", integrated: true }),
    "mainboard",
    product("mainboard", "intel", { socket: "LGA1700" }),
  ],
  [
    "DDR",
    "mainboard",
    product("mainboard", "ddr4-board", {
      ddr: "DDR4",
      capacity: 128,
      slots: 4,
    }),
    "ram",
    product("ram", "ddr5-ram", { ddr: "DDR5", capacity: 32, slots: 2 }),
  ],
  [
    "form",
    "mainboard",
    product("mainboard", "atx-board", { form: "ATX" }),
    "case",
    product("case", "matx-case", { form: "mATX" }),
  ],
  [
    "GPU length",
    "gpu",
    product("gpu", "long-gpu", { length: 308 }),
    "case",
    product("case", "short-case", { gpuMax: 270 }),
  ],
  [
    "cooler height",
    "cooler",
    product("cooler", "tall-cooler", { clearance: 156 }),
    "case",
    product("case", "low-case", { coolerMax: 155 }),
  ],
  [
    "RAM capacity",
    "ram",
    product("ram", "large-kit", { ddr: "DDR5", capacity: 192, slots: 2 }),
    "mainboard",
    product("mainboard", "small-board", {
      ddr: "DDR5",
      capacity: 128,
      slots: 4,
    }),
  ],
  [
    "RAM slots",
    "ram",
    product("ram", "four-stick", { ddr: "DDR5", capacity: 32, slots: 4 }),
    "mainboard",
    product("mainboard", "two-slot", { ddr: "DDR5", capacity: 128, slots: 2 }),
  ],
];
for (const [name, firstSlot, first, secondSlot, second] of pairs) {
  test(`${name} chặn cả hai chiều chọn linh kiện`, () => {
    for (const result of [
      assess([[firstSlot, first]], secondSlot, second),
      assess([[secondSlot, second]], firstSlot, first),
    ]) {
      expect(result.disabled).toBe(true);
      expect(
        result.errors.some(
          (error) =>
            error.blocksSelection === true &&
            error.slots?.includes(firstSlot) &&
            error.slots.includes(secondSlot),
        ),
      ).toBe(true);
    }
  });
}

test("chuẩn form ATX/mATX/ITX có thứ bậc, chuẩn lạ chỉ cảnh báo", () => {
  const forms = ["ITX", "mATX", "ATX"];
  for (let boardIndex = 0; boardIndex < forms.length; boardIndex++) {
    for (let caseIndex = 0; caseIndex < forms.length; caseIndex++) {
      const board = product("mainboard", "board", { form: forms[boardIndex] });
      const chassis = product("case", "case", { form: forms[caseIndex] });
      expect(assess([["case", chassis]], "mainboard", board).disabled).toBe(
        boardIndex > caseIndex,
      );
      expect(assess([["mainboard", board]], "case", chassis).disabled).toBe(
        boardIndex > caseIndex,
      );
    }
  }
  const unknown = assess(
    [["mainboard", product("mainboard", "board", { form: "ATX" })]],
    "case",
    product("case", "unknown", { form: "E-ATX" }),
  );
  expect(unknown.disabled).toBe(false);
  expect(
    unknown.warnings.some((check) =>
      check.message.includes("chuẩn kích thước"),
    ),
  ).toBe(true);
});

test("socket/DDR trim và không phân biệt hoa thường; không đoán từ tên", () => {
  expect(
    assess(
      [["mainboard", product("mainboard", "board", { socket: " am5 " })]],
      "cpu",
      product("cpu", "cpu", { socket: "Am5", integrated: true }),
    ).disabled,
  ).toBe(false);
  const ram = product("ram", "ram", { ddr: " ddr5 ", capacity: 32, slots: 2 });
  const board = product("mainboard", "board", {
    ddr: "DDR5",
    capacity: 128,
    slots: 4,
  });
  expect(assess([["mainboard", board]], "ram", ram).disabled).toBe(false);
  const missing = assess(
    [["mainboard", product("mainboard", "AM5-board")]],
    "cpu",
    product("cpu", "Ryzen-AM5", { integrated: true }),
  );
  expect(missing.disabled).toBe(false);
  expect(
    missing.warnings.some((check) => check.message.includes("socket")),
  ).toBe(true);
});

test("biên kích thước và sức chứa bằng nhau vẫn được chọn", () => {
  const chassis = product("case", "case", { gpuMax: 270, coolerMax: 155 });
  expect(
    assess([["case", chassis]], "gpu", product("gpu", "gpu", { length: 270 }))
      .disabled,
  ).toBe(false);
  expect(
    assess(
      [["case", chassis]],
      "cooler",
      product("cooler", "cooler", { clearance: 155 }),
    ).disabled,
  ).toBe(false);
  const board = product("mainboard", "board", {
    ddr: "DDR5",
    capacity: 32,
    slots: 2,
  });
  expect(
    assess(
      [["mainboard", board]],
      "ram",
      product("ram", "ram", { ddr: "DDR5", capacity: 32, slots: 2 }),
    ).disabled,
  ).toBe(false);
});

test("0, số âm và không hữu hạn là thiếu dữ liệu, không được kết luận vừa", () => {
  for (const invalid of [undefined, 0, -1, NaN, Infinity, -Infinity]) {
    for (const [slot, candidate, peerSlot, peer] of [
      [
        "gpu",
        product("gpu", "gpu", { length: invalid }),
        "case",
        product("case", "case", { gpuMax: 300 }),
      ],
      [
        "case",
        product("case", "case", { gpuMax: invalid }),
        "gpu",
        product("gpu", "gpu", { length: 300 }),
      ],
      [
        "cooler",
        product("cooler", "cooler", { clearance: invalid }),
        "case",
        product("case", "case", { coolerMax: 160 }),
      ],
      [
        "ram",
        product("ram", "ram", {
          ddr: "DDR5",
          capacity: invalid,
          slots: invalid,
        }),
        "mainboard",
        product("mainboard", "board", { ddr: "DDR5", capacity: 128, slots: 4 }),
      ],
    ] as [Slot, Product, Slot, Product][]) {
      const result = assess([[peerSlot, peer]], slot, candidate);
      expect(result.disabled).toBe(false);
      expect(result.errors).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  }
});

test("CPU thiếu iGPU vẫn chọn trước; yêu cầu VGA nằm ở panel toàn cấu hình", () => {
  const cpu = product("cpu", "f-cpu", { integrated: false, watts: 65 });
  const candidate = assess([], "cpu", cpu);
  expect(candidate).toEqual({ errors: [], warnings: [], disabled: false });
  const global = checkBuild({ cpu: cpu.id }, (id) =>
    id === cpu.id ? cpu : undefined,
  );
  expect(
    global.some(
      (check) =>
        check.level === "error" &&
        check.message.includes("cần chọn VGA") &&
        check.blocksSelection === false,
    ),
  ).toBe(true);
  const gpu = product("gpu", "gpu", { watts: 115 });
  expect(assess([["cpu", cpu]], "gpu", gpu).disabled).toBe(false);
});

test("xung đột cũ không liên quan không khóa SSD/PSU và không đưa warning chung vào picker", () => {
  const cpu = product("cpu", "cpu", {
    socket: "AM5",
    watts: 65,
    integrated: true,
  });
  const board = product("mainboard", "board", { socket: "LGA1700" });
  const existing: [Slot, Product][] = [
    ["cpu", cpu],
    ["mainboard", board],
  ];
  expect(assess(existing, "ssd", product("ssd", "ssd"))).toEqual({
    errors: [],
    warnings: [],
    disabled: false,
  });
  const psu = assess(existing, "psu", product("psu", "psu", { watts: 650 }));
  expect(psu.disabled).toBe(false);
  expect(psu.errors).toEqual([]);
  expect(psu.warnings).toEqual([]);
});

test("nguồn tính headroom theo cấu hình sau thay; CPU ít watt sửa được thiếu nguồn", () => {
  const cpu = product("cpu", "heavy", { watts: 300, integrated: true });
  const gpu = product("gpu", "gpu", { watts: 200 });
  const psu = product("psu", "psu", { watts: 650 });
  const existing: [Slot, Product][] = [
    ["cpu", cpu],
    ["gpu", gpu],
    ["psu", psu],
  ];
  const insufficient = assess(existing, "psu", psu);
  expect(insufficient.disabled).toBe(true);
  expect(insufficient.errors[0].slots).toEqual(["psu", "cpu", "gpu"]);
  const repair = assess(
    existing,
    "cpu",
    product("cpu", "efficient", { watts: 65, integrated: true }),
  );
  expect(repair.disabled).toBe(false);
  expect(repair.errors).toEqual([]);
  expect(
    assess(
      [["cpu", product("cpu", "low", { watts: 20, integrated: true })]],
      "psu",
      product("psu", "exact", { watts: 130 }),
    ).disabled,
  ).toBe(false);
});

test("nguồn chưa đủ dữ liệu chỉ cảnh báo; build từng phần vẫn được chọn", () => {
  const cpu = product("cpu", "cpu", { watts: 65, integrated: true });
  for (const watts of [undefined, 0, -1, NaN, Infinity]) {
    const result = assess(
      [["cpu", cpu]],
      "psu",
      product("psu", "psu", { watts }),
    );
    expect(result.disabled).toBe(false);
    expect(
      result.warnings.some((check) => check.message.includes("công suất")),
    ).toBe(true);
  }
  expect(
    assess([], "psu", product("psu", "psu", { watts: 650 })).disabled,
  ).toBe(false);
  expect(assess([], "mainboard", product("mainboard", "board")).disabled).toBe(
    false,
  );
  const invalid = product("cpu", "invalid", { watts: NaN });
  expect(
    Number.isFinite(estimateWatts({ cpu: invalid.id }, () => invalid)),
  ).toBe(true);
});

test("tự thay chính sản phẩm không mutate build; candidate không cần có sẵn trong lookup", () => {
  const cpu = product("cpu", "cpu", { socket: "AM5", integrated: true });
  const board = product("mainboard", "board", { socket: "AM5" });
  const build: Build = { cpu: cpu.id, mainboard: board.id };
  const before = JSON.stringify({ build, cpu, board });
  const result = getCandidateCompatibility(build, "cpu", cpu, (id) =>
    id === board.id ? board : undefined,
  );
  expect(result.disabled).toBe(false);
  expect(JSON.stringify({ build, cpu, board })).toBe(before);
});

test("không khả dụng, sai slot, thiếu default SKU hoặc hết hàng default đều khóa", () => {
  const invalids = [
    { ...product("cpu", "wrong-slot"), category: "ram" },
    { ...product("cpu", "ineligible"), builderEligible: false },
    { ...product("cpu", "no-variants"), variants: [] },
  ];
  const missingSku = product("cpu", "empty-sku");
  missingSku.variants[0].sku = "";
  invalids.push(missingSku);
  const outOfStock = product("cpu", "empty-stock");
  outOfStock.variants[0].stock = 0;
  outOfStock.variants.push({
    ...outOfStock.variants[0],
    id: "alternate",
    sku: "alternate",
    stock: 4,
  });
  outOfStock.stock = 4;
  invalids.push(outOfStock);
  for (const item of invalids) {
    const result = assess([], "cpu", item);
    expect(result.disabled).toBe(true);
    expect(
      result.errors.some(
        (check) => check.slots?.includes("cpu") && check.blocksSelection,
      ),
    ).toBe(true);
  }
  expect(
    checkBuild({ cpu: "removed" }, () => undefined).some(
      (check) =>
        check.level === "error" &&
        check.slots?.includes("cpu") &&
        check.blocksSelection,
    ),
  ).toBe(true);
});
