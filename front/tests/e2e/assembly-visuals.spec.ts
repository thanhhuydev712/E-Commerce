import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import type { Product } from "../../src/catalog/model";
import assemblyPack from "../../public/images/pc-assembly/manifest.json";
import {
  ASSEMBLY_REGISTRY,
  getAssemblyPart,
  getAssemblyProfile,
  type AssemblyCaseProfile,
  type AssemblyPartVisual,
  type AssemblyRegistry,
} from "../../src/features/pc-builder/lib/assembly-visuals";
import type { Slot } from "../../src/features/pc-builder/lib/compatibility";

test("bộ ảnh runtime có đủ 18 PNG khác nhau và không dùng một hình cho mọi sản phẩm", () => {
  const files = new Set(
    [...assemblyPack.cases, ...assemblyPack.parts].map((asset) => asset.src),
  );
  expect(files.size).toBe(18);
  const hashes = new Set<string>();
  for (const src of files) {
    const bytes = readFileSync(
      path.resolve(process.cwd(), "public", `.${src}`),
    );
    expect(
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    ).toBe(true);
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
  }
  expect(hashes.size).toBe(18);
});

function product(slot: Slot, slug = `${slot}-fixture`): Product {
  return {
    id: slug,
    databaseId: slug,
    slug,
    name: slug,
    category: slot,
    brand: "Fixture",
    price: "1",
    oldPrice: "1",
    image: "",
    specs: [],
    technical: {},
    builderEligible: true,
    variants: [
      {
        id: slug,
        sku: `${slug}-black`,
        label: "Black",
        price: "1",
        oldPrice: "1",
        stock: 1,
      },
    ],
    stock: 1,
    warranty: "",
    reviews: [],
  };
}
function fixture() {
  const chassis = product("case"),
    gpu = product("gpu"),
    board = product("mainboard");
  const profile: AssemblyCaseProfile = {
    id: "case-profile-fixture",
    productSlug: chassis.slug,
    variantSku: chassis.variants[0].sku,
    src: "/images/pc-assembly/case.png",
    foregroundSrc: "/images/pc-assembly/case-frame.png",
    aperture: { x: 5, y: 5, width: 90, height: 90 },
    dimensionsMm: { width: 200, height: 400, depth: 350 },
    verified: true,
    sourceUrl: "https://example.com/case-reference",
  };
  const part: AssemblyPartVisual = {
    productSlug: gpu.slug,
    variantSku: gpu.variants[0].sku,
    slot: "gpu",
    caseProfileId: profile.id,
    src: "/images/pc-assembly/gpu.png",
    maskSrc: "/images/pc-assembly/gpu-mask.png",
    placement: { x: 10, y: 50, width: 60, height: 20 },
    zIndex: 5,
    dimensionsMm: { width: 240, height: 110, depth: 40 },
    verified: true,
    sourceUrl: "https://example.com/gpu-reference",
    requires: { mainboard: board.variants[0].sku },
    hiddenBy: ["cooler"],
  };
  const registry: AssemblyRegistry = { cases: [profile], parts: [part] };
  const selected = { case: chassis, gpu, mainboard: board };
  const resolve = () =>
    getAssemblyPart(gpu, "gpu", profile, selected, registry);
  return { chassis, gpu, board, profile, part, registry, selected, resolve };
}

test("registry dự phòng rỗng; binding chính xác và resolver không sửa đầu vào", () => {
  const f = fixture();
  expect(ASSEMBLY_REGISTRY).toEqual({ cases: [], parts: [] });
  expect(getAssemblyProfile(f.chassis)).toBeUndefined();
  expect(getAssemblyPart(f.gpu, "gpu", f.profile, f.selected)).toBeUndefined();
  const before = JSON.stringify(f);
  expect(getAssemblyProfile(f.chassis, f.registry)).toBe(f.profile);
  expect(f.resolve()).toBe(f.part);
  expect(JSON.stringify(f)).toBe(before);
});

test("ảnh dựng khai báo riêng được resolve nhưng vẫn giữ trạng thái chưa xác minh", () => {
  const f = fixture();
  f.profile.verified = false;
  f.profile.illustrative = true;
  f.part.verified = false;
  f.part.illustrative = true;
  expect(getAssemblyProfile(f.chassis, f.registry)).toBe(f.profile);
  expect(f.resolve()).toBe(f.part);
  expect(f.profile.verified).toBe(false);
  expect(f.part.verified).toBe(false);
  f.gpu.variants[0].sku = "other-color-sku";
  expect(f.resolve()).toBeUndefined();
  f.gpu.variants[0].sku = f.part.variantSku;
  f.selected.mainboard = product("mainboard", "other-board");
  expect(f.resolve()).toBeUndefined();
  f.selected.mainboard = f.board;
  f.selected.case = product("case", "other-case");
  expect(f.resolve()).toBeUndefined();
});

test("ảnh chưa xác minh không tự nhận là minh họa và flag sai kiểu bị từ chối", () => {
  for (const illustrative of [undefined, false, "true", 1, null]) {
    const f = fixture();
    Object.assign(f.profile, { verified: false, illustrative });
    expect(getAssemblyProfile(f.chassis, f.registry)).toBeUndefined();
    const fresh = fixture();
    Object.assign(fresh.part, { verified: false, illustrative });
    expect(fresh.resolve()).toBeUndefined();
  }
});

test("chỉ tầng minh họa cho phép đúng file provenance local", () => {
  const f = fixture();
  f.profile.sourceUrl = "/images/pc-assembly/SOURCES.json";
  expect(getAssemblyProfile(f.chassis, f.registry)).toBeUndefined();
  f.profile.verified = false;
  f.profile.illustrative = true;
  expect(getAssemblyProfile(f.chassis, f.registry)).toBe(f.profile);
  f.part.sourceUrl = "/images/pc-assembly/SOURCES.json";
  expect(f.resolve()).toBeUndefined();
  f.part.verified = false;
  f.part.illustrative = true;
  expect(f.resolve()).toBe(f.part);
  for (const sourceUrl of [
    "/images/pc-assembly/other.json",
    "/images/pc-assembly/SOURCES.json?version=1",
    "/images/pc-assembly/SOURCES.json#source",
    "/images/pc-assembly/%53OURCES.json",
  ]) {
    f.part.sourceUrl = sourceUrl;
    expect(f.resolve()).toBeUndefined();
    f.profile.sourceUrl = sourceUrl;
    expect(getAssemblyProfile(f.chassis, f.registry)).toBeUndefined();
    f.profile.sourceUrl = "/images/pc-assembly/SOURCES.json";
  }
});

test("manifest minh họa phủ hai case và 16 sản phẩm bằng binding riêng", () => {
  const registry = assemblyPack as AssemblyRegistry;
  expect(assemblyPack.version).toBe(1);
  expect(registry.cases).toHaveLength(2);
  expect(new Set(registry.parts.map((part) => part.productSlug)).size).toBe(16);
  const allAssets = [...registry.cases, ...registry.parts];
  for (const asset of allAssets) {
    expect(asset.verified).toBe(false);
    expect(asset.illustrative).toBe(true);
    expect(asset.src).toBe(`/images/pc-assembly/${asset.productSlug}-v1.png`);
  }
  for (const profile of registry.cases) {
    const chassis = product("case", profile.productSlug);
    chassis.variants[0].sku = profile.variantSku;
    expect(getAssemblyProfile(chassis, registry)).toBe(profile);
    const parts = registry.parts.filter(
      (part) => part.caseProfileId === profile.id,
    );
    expect(new Set(parts.map((part) => part.productSlug)).size).toBe(16);
    for (const part of parts) {
      const selectedProduct = product(part.slot, part.productSlug);
      selectedProduct.variants[0].sku = part.variantSku;
      const selected: Partial<Record<Slot, Product>> = {
        case: chassis,
        [part.slot]: selectedProduct,
      };
      if (part.requires?.mainboard) {
        const board = product("mainboard");
        board.variants[0].sku = part.requires.mainboard;
        selected.mainboard = board;
      }
      expect(
        getAssemblyPart(
          selectedProduct,
          part.slot,
          profile,
          selected,
          registry,
        ),
      ).toBe(part);
    }
  }
});

test("profile trùng ID, ảnh trùng binding và profile cũ đều bị từ chối", () => {
  const f = fixture();
  const duplicateId = {
    ...f.profile,
    productSlug: "another-case",
    variantSku: "another-sku",
  };
  expect(
    getAssemblyProfile(f.chassis, {
      ...f.registry,
      cases: [f.profile, duplicateId],
    }),
  ).toBeUndefined();
  expect(
    getAssemblyPart(
      f.gpu,
      "gpu",
      { ...f.profile, src: "/images/pc-assembly/old-case.png" },
      f.selected,
      f.registry,
    ),
  ).toBeUndefined();
  expect(
    getAssemblyPart(f.gpu, "gpu", f.profile, f.selected, {
      ...f.registry,
      parts: [f.part, { ...f.part, src: "/images/pc-assembly/duplicate.png" }],
    }),
  ).toBeUndefined();
});

test("đổi GPU, SKU mặc định hoặc slot không lấy ảnh gần giống", () => {
  const f = fixture();
  expect(
    getAssemblyPart(
      product("gpu", "other-gpu"),
      "gpu",
      f.profile,
      f.selected,
      f.registry,
    ),
  ).toBeUndefined();
  f.selected.gpu = product("gpu", "other-gpu");
  expect(f.resolve()).toBeUndefined();
  f.selected.gpu = f.gpu;
  f.gpu.variants[0].sku = "gpu-fixture-white";
  expect(f.resolve()).toBeUndefined();
  f.gpu.variants.push({ ...f.gpu.variants[0], sku: f.part.variantSku });
  expect(f.resolve()).toBeUndefined();
  expect(
    getAssemblyPart(f.gpu, "ram", f.profile, f.selected, f.registry),
  ).toBeUndefined();
  expect(
    getAssemblyPart(f.chassis, "case", f.profile, f.selected, f.registry),
  ).toBeUndefined();
});

test("đổi case/profile hoặc mainboard yêu cầu không tái sử dụng ảnh", () => {
  const f = fixture();
  f.selected.case = product("case", "other-case");
  expect(f.resolve()).toBeUndefined();
  f.selected.case = f.chassis;
  expect(
    getAssemblyPart(
      f.gpu,
      "gpu",
      { ...f.profile, id: "other-profile" },
      f.selected,
      f.registry,
    ),
  ).toBeUndefined();
  f.part.caseProfileId = "other-profile";
  expect(f.resolve()).toBeUndefined();
  f.part.caseProfileId = f.profile.id;
  f.selected.mainboard = product("mainboard", "other-board");
  expect(f.resolve()).toBeUndefined();
  delete (f.selected as Partial<Record<Slot, Product>>).mainboard;
  expect(f.resolve()).toBeUndefined();
});

test("thiếu sản phẩm, variant, profile hoặc xác minh đều đóng mặc định", () => {
  const f = fixture();
  expect(getAssemblyProfile(undefined, f.registry)).toBeUndefined();
  expect(
    getAssemblyPart(undefined, "gpu", f.profile, f.selected, f.registry),
  ).toBeUndefined();
  expect(
    getAssemblyPart(f.gpu, "gpu", undefined, f.selected, f.registry),
  ).toBeUndefined();
  f.gpu.variants = [];
  expect(f.resolve()).toBeUndefined();
  f.chassis.variants = [];
  expect(getAssemblyProfile(f.chassis, f.registry)).toBeUndefined();
  const fresh = fixture();
  fresh.part.verified = false;
  expect(fresh.resolve()).toBeUndefined();
  fresh.part.verified = true;
  fresh.profile.verified = false;
  expect(getAssemblyProfile(fresh.chassis, fresh.registry)).toBeUndefined();
  expect(fresh.resolve()).toBeUndefined();
  const missingSku = fixture();
  missingSku.gpu.variants[0].sku = "";
  expect(missingSku.resolve()).toBeUndefined();
  missingSku.chassis.variants[0].sku = "";
  expect(
    getAssemblyProfile(missingSku.chassis, missingSku.registry),
  ).toBeUndefined();
});

test("sản phẩm sai category/eligibility và case sai binding bị từ chối", () => {
  for (const change of [{ builderEligible: false }, { category: "ram" }]) {
    const f = fixture();
    Object.assign(f.gpu, change);
    expect(f.resolve()).toBeUndefined();
    Object.assign(f.chassis, change);
    expect(getAssemblyProfile(f.chassis, f.registry)).toBeUndefined();
  }
  for (const change of [
    { productSlug: "other-case" },
    { variantSku: "other-sku" },
  ]) {
    const f = fixture();
    Object.assign(f.profile, change);
    expect(getAssemblyProfile(f.chassis, f.registry)).toBeUndefined();
  }
});

const badPaths = [
  "https://example.com/gpu.png",
  "//example.com/gpu.png",
  "/images/catalog/gpu.png",
  "/images/pc-assembly/../gpu.png",
  "/images/pc-assembly/a/../../gpu.png",
  "/images/pc-assembly/%2e%2e/gpu.png",
  "/images/pc-assembly/a%2fb.png",
  "/images/pc-assembly/a%5cb.png",
  "/images/pc-assembly/%252f.png",
  "/images/pc-assembly/a\\b.png",
  "/images/pc-assembly/gpu.png?v=1",
  "/images/pc-assembly/gpu.png#mask",
  "/images/pc-assembly/",
  "/images/pc-assembly//gpu.png",
];
for (const path of badPaths) {
  test(`đường dẫn không hợp lệ: ${path}`, () => {
    const f = fixture();
    for (const field of ["src", "foregroundSrc"] as const) {
      const invalid = { ...f.profile, [field]: path };
      expect(
        getAssemblyProfile(f.chassis, { ...f.registry, cases: [invalid] }),
      ).toBeUndefined();
    }
    for (const field of ["src", "maskSrc"] as const) {
      expect(
        getAssemblyPart(f.gpu, "gpu", f.profile, f.selected, {
          ...f.registry,
          parts: [{ ...f.part, [field]: path }],
        }),
      ).toBeUndefined();
    }
  });
}

test("kích thước và tọa độ không hữu hạn, không dương, vượt canvas bị từ chối", () => {
  const f = fixture();
  const invalidDimensions = [
    { width: 0, height: 1, depth: 1 },
    { width: 1, height: -1, depth: 1 },
    { width: 1, height: 1, depth: NaN },
    { width: Infinity, height: 1, depth: 1 },
    { width: "240", height: 1, depth: 1 },
    null,
  ];
  const invalidRects = [
    { x: -1, y: 0, width: 1, height: 1 },
    { x: 0, y: NaN, width: 1, height: 1 },
    { x: 90, y: 0, width: 11, height: 1 },
    { x: 0, y: 99, width: 1, height: 2 },
    { x: 0, y: 0, width: 0, height: 1 },
    { x: 0, y: 0, width: 1, height: Infinity },
    null,
  ];
  for (const dimensionsMm of invalidDimensions) {
    expect(
      getAssemblyProfile(f.chassis, {
        ...f.registry,
        cases: [{ ...f.profile, dimensionsMm } as AssemblyCaseProfile],
      }),
    ).toBeUndefined();
    expect(
      getAssemblyPart(f.gpu, "gpu", f.profile, f.selected, {
        ...f.registry,
        parts: [{ ...f.part, dimensionsMm } as AssemblyPartVisual],
      }),
    ).toBeUndefined();
  }
  for (const value of invalidRects) {
    expect(
      getAssemblyProfile(f.chassis, {
        ...f.registry,
        cases: [{ ...f.profile, aperture: value } as AssemblyCaseProfile],
      }),
    ).toBeUndefined();
    expect(
      getAssemblyPart(f.gpu, "gpu", f.profile, f.selected, {
        ...f.registry,
        parts: [{ ...f.part, placement: value } as AssemblyPartVisual],
      }),
    ).toBeUndefined();
  }
});

test("source, zIndex, hiddenBy và requires không hợp lệ bị từ chối", () => {
  const f = fixture();
  for (const sourceUrl of [
    "http://example.com",
    "/relative",
    "javascript:alert(1)",
    "invalid",
  ]) {
    expect(
      getAssemblyProfile(f.chassis, {
        ...f.registry,
        cases: [{ ...f.profile, sourceUrl }],
      }),
    ).toBeUndefined();
    expect(
      getAssemblyPart(f.gpu, "gpu", f.profile, f.selected, {
        ...f.registry,
        parts: [{ ...f.part, sourceUrl }],
      }),
    ).toBeUndefined();
  }
  const invalidParts = [
    ...[-1, 51, 1.5, NaN, Infinity].map((zIndex) => ({ ...f.part, zIndex })),
    { ...f.part, hiddenBy: ["unknown"] },
    { ...f.part, hiddenBy: "cooler" },
    { ...f.part, requires: { unknown: "sku" } },
    { ...f.part, requires: { mainboard: "" } },
    { ...f.part, requires: null },
  ];
  for (const part of invalidParts) {
    expect(
      getAssemblyPart(f.gpu, "gpu", f.profile, f.selected, {
        ...f.registry,
        parts: [part as AssemblyPartVisual],
      }),
    ).toBeUndefined();
  }
});

test("crop ảnh linh kiện giữ tọa độ phần trăm hợp lệ và từ chối vùng lỗi", () => {
  const f = fixture();
  f.part.crop = { x: 10, y: 20, width: 80, height: 60 };
  expect(f.resolve()).toBe(f.part);
  expect(f.part.crop).toEqual({ x: 10, y: 20, width: 80, height: 60 });
  f.part.crop = { x: 0, y: 0, width: 100, height: 100 };
  expect(f.resolve()).toBe(f.part);
  f.part.aspectRatio = 0.75;
  expect(f.resolve()).toBe(f.part);
  for (const aspectRatio of [0, -1, NaN, Infinity]) {
    expect(
      getAssemblyPart(f.gpu, "gpu", f.profile, f.selected, {
        ...f.registry,
        parts: [{ ...f.part, aspectRatio }],
      }),
    ).toBeUndefined();
  }
  const invalidCrops = [
    null,
    "crop",
    { x: -1, y: 0, width: 10, height: 10 },
    { x: 0, y: 0, width: 0, height: 10 },
    { x: 0, y: 0, width: 10, height: -1 },
    { x: 90, y: 0, width: 11, height: 10 },
    { x: 0, y: 95, width: 10, height: 6 },
    { x: NaN, y: 0, width: 10, height: 10 },
    { x: 0, y: Infinity, width: 10, height: 10 },
    { x: 0, y: 0, width: "10", height: 10 },
  ];
  for (const crop of invalidCrops) {
    const invalid = { ...f.part, crop } as unknown as AssemblyPartVisual;
    expect(
      getAssemblyPart(f.gpu, "gpu", f.profile, f.selected, {
        ...f.registry,
        parts: [invalid],
      }),
    ).toBeUndefined();
  }
});

test("entry JSON và variants sai kiểu không gây exception hoặc được chấp nhận", () => {
  const f = fixture();
  for (const entry of [null, false, 1, "asset", [], {}]) {
    const registry = {
      cases: [entry, f.profile],
      parts: [entry, f.part],
    } as unknown as AssemblyRegistry;
    expect(getAssemblyProfile(f.chassis, registry)).toBe(f.profile);
    expect(getAssemblyPart(f.gpu, "gpu", f.profile, f.selected, registry)).toBe(
      f.part,
    );
    expect(
      getAssemblyProfile(f.chassis, {
        cases: [entry],
        parts: [],
      } as unknown as AssemblyRegistry),
    ).toBeUndefined();
  }
  for (const variants of [null, "sku", {}, [null], ["sku"], [{ sku: 123 }]]) {
    const invalidGpu = { ...f.gpu, variants } as Product;
    const invalidCase = { ...f.chassis, variants } as Product;
    expect(
      getAssemblyPart(
        invalidGpu,
        "gpu",
        f.profile,
        { ...f.selected, gpu: invalidGpu },
        f.registry,
      ),
    ).toBeUndefined();
    expect(getAssemblyProfile(invalidCase, f.registry)).toBeUndefined();
  }
});
