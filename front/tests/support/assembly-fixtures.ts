import { expect, type Page } from "@playwright/test";
import type { StorefrontSnapshot } from "../../src/catalog/model";
import {
  slots,
  type Slot,
} from "../../src/features/pc-builder/lib/compatibility";
import type {
  AssemblyRegistry,
  AssemblyRect,
} from "../../src/features/pc-builder/lib/assembly-visuals";

// Browser-only fixtures: metadata and images are intercepted, never shipped in the real pack.
export async function installAssemblyPack(
  page: Page,
  options: {
    hiddenCpu?: boolean;
    requireBoardForCooler?: boolean;
    missingSlot?: Slot;
    failSlot?: Slot;
    invalidManifest?: boolean;
  } = {},
) {
  const response = await page.request.get("/api/v1/storefront");
  expect(response.ok()).toBe(true);
  const data = (await response.json()).data as StorefrontSnapshot;
  const products = data.products.filter(
    (product) =>
      product.builderEligible &&
      slots.some((slot) => product.category === slot),
  );
  const rects: Record<Slot, AssemblyRect> = {
    case: { x: 0, y: 0, width: 100, height: 100 },
    mainboard: { x: 12, y: 12, width: 54, height: 55 },
    cpu: { x: 29, y: 29, width: 13, height: 13 },
    ram: { x: 58, y: 22, width: 10, height: 32 },
    gpu: { x: 15, y: 62, width: 65, height: 13 },
    ssd: { x: 32, y: 53, width: 22, height: 7 },
    psu: { x: 14, y: 80, width: 25, height: 14 },
    cooler: { x: 24, y: 22, width: 30, height: 30 },
  };
  const registry: AssemblyRegistry & { version: 1 } = {
    version: 1,
    cases: [],
    parts: [],
  };
  const starterBoard = data.products.find(
    (product) => product.id === data.presentation.starterBuild.mainboard,
  )!;
  for (const chassis of products.filter(
    (product) => product.category === "case",
  )) {
    const id = `test-${chassis.slug}`;
    if (options.missingSlot !== "case")
      registry.cases.push({
        id,
        productSlug: chassis.slug,
        variantSku: chassis.variants[0].sku,
        src: `/images/pc-assembly/test-case-${chassis.slug}.svg`,
        foregroundSrc: `/images/pc-assembly/test-foreground-${chassis.slug}.svg`,
        aperture: { x: 8, y: 8, width: 84, height: 84 },
        dimensionsMm: { width: 400, height: 450, depth: 220 },
        verified: true,
        sourceUrl: "https://example.com/test-reference",
      });
    for (const product of products.filter((item) => item.category !== "case")) {
      const slot = product.category as Slot;
      if (slot === options.missingSlot) continue;
      registry.parts.push({
        productSlug: product.slug,
        variantSku: product.variants[0].sku,
        slot,
        caseProfileId: id,
        src: `/images/pc-assembly/test-${slot}-${chassis.slug}-${product.slug}.svg`,
        placement: rects[slot],
        zIndex: slots.indexOf(slot) + 1,
        dimensionsMm: { width: 100, height: 100, depth: 30 },
        verified: true,
        sourceUrl: "https://example.com/test-reference",
        hiddenBy: slot === "cpu" && options.hiddenCpu ? ["cooler"] : undefined,
        requires:
          slot === "cooler" && options.requireBoardForCooler
            ? { mainboard: starterBoard.variants[0].sku }
            : undefined,
      });
    }
  }
  await page.route("**/images/pc-assembly/manifest.json", (route) =>
    route.fulfill({
      json: options.invalidManifest
        ? { version: 99, cases: [null], parts: "invalid" }
        : registry,
    }),
  );
  await page.route("**/images/pc-assembly/test-*.svg", (route) => {
    const name = new URL(route.request().url()).pathname;
    if (options.failSlot && name.includes(`/test-${options.failSlot}-`))
      return route.fulfill({ status: 404, body: "" });
    const part = registry.parts.find((item) => item.src === name);
    const isCase = name.includes("/test-case-");
    const foreground = name.includes("/test-foreground-");
    const content = foreground
      ? '<rect x="18" y="400" width="465" height="80" fill="#202b35"/>'
      : isCase
        ? '<rect x="12" y="12" width="476" height="476" rx="12" fill="#0f1820" stroke="#708393" stroke-width="10"/>'
        : `<rect x="3" y="3" width="494" height="494" rx="18" fill="${part?.slot === "cooler" ? "#dd4df5" : part?.slot === "gpu" ? "#719cbb" : "#45bc97"}" fill-opacity="0.85"/><text x="20" y="260" fill="white" font-size="50">${part?.slot ?? "fixture"}</text>`;
    return route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">${content}</svg>`,
    });
  });
  return { data, registry };
}
