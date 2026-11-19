import type { Product } from "@/src/catalog/model";
import { slots, type Slot } from "./compatibility";

export type AssemblyRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
type AssemblyDimensions = { width: number; height: number; depth: number };
export type AssemblyCaseProfile = {
  id: string;
  productSlug: string;
  variantSku: string;
  src: string;
  foregroundSrc?: string;
  aperture: AssemblyRect;
  dimensionsMm: AssemblyDimensions;
  verified: boolean;
  illustrative?: boolean;
  sourceUrl: string;
};
export type AssemblyPartVisual = {
  productSlug: string;
  variantSku: string;
  slot: Slot;
  caseProfileId: string;
  src: string;
  placement: AssemblyRect;
  crop?: AssemblyRect;
  aspectRatio?: number;
  zIndex: number;
  dimensionsMm: AssemblyDimensions;
  verified: boolean;
  illustrative?: boolean;
  sourceUrl: string;
  requires?: Partial<Record<Slot, string>>;
  hiddenBy?: Slot[];
  maskSrc?: string;
};
export type AssemblyRegistry = {
  cases: AssemblyCaseProfile[];
  parts: AssemblyPartVisual[];
};

// Manifest tải riêng; ảnh dựng phải khai báo illustrative và không được coi là đã xác minh.
export const ASSEMBLY_REGISTRY: AssemblyRegistry = { cases: [], parts: [] };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function positive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function dimensions(value: unknown): boolean {
  return (
    record(value) &&
    positive(value.width) &&
    positive(value.height) &&
    positive(value.depth)
  );
}
function rect(value: unknown): boolean {
  return (
    record(value) &&
    typeof value.x === "number" &&
    Number.isFinite(value.x) &&
    value.x >= 0 &&
    typeof value.y === "number" &&
    Number.isFinite(value.y) &&
    value.y >= 0 &&
    positive(value.width) &&
    positive(value.height) &&
    value.x + value.width <= 100 &&
    value.y + value.height <= 100
  );
}
function localImage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/images/pc-assembly/") &&
    value
      .slice("/images/pc-assembly/".length)
      .split("/")
      .every((segment) => /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(segment))
  );
}
function source(
  value: unknown,
  verified: unknown,
  illustrative: unknown,
): boolean {
  if (
    value === "/images/pc-assembly/SOURCES.json" &&
    verified === false &&
    illustrative === true
  )
    return true;
  if (!text(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname;
  } catch {
    return false;
  }
}
function isSlot(value: unknown): value is Slot {
  return typeof value === "string" && slots.some((slot) => slot === value);
}
function allowedVisual(verified: unknown, illustrative: unknown): boolean {
  return (
    (illustrative === undefined || typeof illustrative === "boolean") &&
    (verified === true || (verified === false && illustrative === true))
  );
}
function sku(product: Product | undefined, slot: Slot): string | undefined {
  if (
    !record(product) ||
    product.builderEligible !== true ||
    product.category !== slot ||
    !text(product.slug) ||
    !Array.isArray(product.variants) ||
    !record(product.variants[0]) ||
    !text(product.variants[0].sku)
  )
    return undefined;
  return product.variants[0].sku;
}
function validProfile(profile: AssemblyCaseProfile): boolean {
  return (
    record(profile) &&
    allowedVisual(profile.verified, profile.illustrative) &&
    text(profile.id) &&
    text(profile.productSlug) &&
    text(profile.variantSku) &&
    localImage(profile.src) &&
    (profile.foregroundSrc === undefined ||
      localImage(profile.foregroundSrc)) &&
    dimensions(profile.dimensionsMm) &&
    rect(profile.aperture) &&
    source(profile.sourceUrl, profile.verified, profile.illustrative)
  );
}

export function getAssemblyProfile(
  product: Product | undefined,
  registry: AssemblyRegistry = ASSEMBLY_REGISTRY,
): AssemblyCaseProfile | undefined {
  const variantSku = sku(product, "case");
  if (!variantSku || !product) return undefined;
  const matches = registry.cases.filter(
    (profile) =>
      validProfile(profile) &&
      profile.productSlug === product.slug &&
      profile.variantSku === variantSku,
  );
  if (matches.length !== 1) return undefined;
  const profile = matches[0];
  return registry.cases.filter(
    (entry) => record(entry) && entry.id === profile.id,
  ).length === 1
    ? profile
    : undefined;
}

export function getAssemblyPart(
  product: Product | undefined,
  slot: Slot,
  profile: AssemblyCaseProfile | undefined,
  selected: Partial<Record<Slot, Product>>,
  registry: AssemblyRegistry = ASSEMBLY_REGISTRY,
): AssemblyPartVisual | undefined {
  if (!isSlot(slot) || slot === "case") return undefined;
  const variantSku = sku(product, slot);
  const selectedProfile = getAssemblyProfile(selected.case, registry);
  if (
    !variantSku ||
    !product ||
    sku(selected[slot], slot) !== variantSku ||
    selected[slot]?.slug !== product.slug ||
    !profile ||
    !validProfile(profile) ||
    !selectedProfile ||
    selectedProfile !== profile ||
    selectedProfile.productSlug !== profile.productSlug ||
    selectedProfile.variantSku !== profile.variantSku
  )
    return undefined;
  const matches = registry.parts.filter((part) => {
    if (
      !record(part) ||
      !allowedVisual(part.verified, part.illustrative) ||
      part.slot !== slot ||
      part.productSlug !== product.slug ||
      part.variantSku !== variantSku ||
      part.caseProfileId !== profile.id ||
      !localImage(part.src) ||
      (part.maskSrc !== undefined && !localImage(part.maskSrc)) ||
      !rect(part.placement) ||
      (part.crop !== undefined && !rect(part.crop)) ||
      (part.aspectRatio !== undefined && !positive(part.aspectRatio)) ||
      !dimensions(part.dimensionsMm) ||
      !Number.isInteger(part.zIndex) ||
      part.zIndex < 0 ||
      part.zIndex > 50 ||
      !source(part.sourceUrl, part.verified, part.illustrative)
    )
      return false;
    if (
      part.hiddenBy !== undefined &&
      (!Array.isArray(part.hiddenBy) || !part.hiddenBy.every(isSlot))
    )
      return false;
    if (part.requires === undefined) return true;
    return (
      record(part.requires) &&
      Object.entries(part.requires).every(
        ([requiredSlot, requiredSku]) =>
          isSlot(requiredSlot) &&
          text(requiredSku) &&
          sku(selected[requiredSlot], requiredSlot) === requiredSku,
      )
    );
  });
  return matches.length === 1 ? matches[0] : undefined;
}
