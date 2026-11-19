"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { ImageIcon, Layers3 } from "lucide-react";
import { useCatalog } from "@/src/catalog/catalog-provider";
import type { Product } from "@/src/catalog/model";
import { CategoryIcon, Dialog } from "@/src/components/storefront";
import { slots, type Build, type Slot } from "../lib/compatibility";
import {
  ASSEMBLY_REGISTRY,
  getAssemblyPart,
  getAssemblyProfile,
  type AssemblyRect,
  type AssemblyRegistry,
} from "../lib/assembly-visuals";

function isAssemblyRegistry(value: unknown): value is AssemblyRegistry {
  if (!value || typeof value !== "object") return false;
  const pack = value as Record<string, unknown>;
  return (
    pack.version === 1 &&
    Array.isArray(pack.cases) &&
    Array.isArray(pack.parts) &&
    pack.cases.length <= 1000 &&
    pack.parts.length <= 10000
  );
}

const labels: Record<Slot, string> = {
  case: "Vỏ case",
  mainboard: "Mainboard",
  cpu: "CPU",
  ram: "RAM",
  ssd: "SSD",
  psu: "Nguồn",
  gpu: "Card đồ họa",
  cooler: "Tản nhiệt",
};
const separated: Record<Slot, AssemblyRect> = {
  case: { x: 26, y: 25, width: 48, height: 48 },
  mainboard: { x: 0, y: 3, width: 27, height: 28 },
  cpu: { x: 36, y: 0, width: 24, height: 24 },
  cooler: { x: 0, y: 37, width: 27, height: 28 },
  ram: { x: 3, y: 72, width: 27, height: 27 },
  ssd: { x: 36, y: 75, width: 27, height: 25 },
  gpu: { x: 73, y: 3, width: 27, height: 28 },
  psu: { x: 73, y: 39, width: 27, height: 27 },
};
const rectStyle = (rect: AssemblyRect): CSSProperties => ({
  left: `${rect.x}%`,
  top: `${rect.y}%`,
  width: `${rect.width}%`,
  height: `${rect.height}%`,
});

/** SKU/case-specific assets keep verified and illustrative tiers distinct. */
export function AssembledLayers({
  build,
  focus,
  isolate,
  exploded,
  panelOpen,
  onFocus,
  onChoose,
  poseStyle,
}: {
  build: Build;
  focus: Slot;
  isolate: boolean;
  exploded: boolean;
  panelOpen: boolean;
  onFocus: (slot: Slot) => void;
  onChoose: (slot: Slot) => void;
  poseStyle: CSSProperties;
}) {
  const { productById } = useCatalog();
  const [registry, setRegistry] = useState(ASSEMBLY_REGISTRY);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [referenceOpen, setReferenceOpen] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/images/pc-assembly/manifest.json", { signal: controller.signal })
      .then(async (response) =>
        response.ok ? (response.json() as Promise<unknown>) : null,
      )
      .then((value: unknown) => {
        if (!controller.signal.aborted && isAssemblyRegistry(value))
          setRegistry(value);
      })
      .catch(() => {
        /* Missing packs leave the honest unavailable state. */
      });
    return () => controller.abort();
  }, []);
  const selected: Partial<Record<Slot, Product>> = {};
  for (const slot of slots) {
    const product = productById(build[slot] ?? "");
    if (product?.builderEligible && product.category === slot)
      selected[slot] = product;
  }
  const candidate = getAssemblyProfile(selected.case, registry);
  const profileKey = candidate
    ? `${candidate.id}:${candidate.variantSku}:${candidate.src}`
    : "";
  const profile = candidate && !failed[profileKey] ? candidate : undefined;
  const assets = slots.flatMap((slot) => {
    if (slot === "case") return [];
    const product = selected[slot];
    const asset = getAssemblyPart(product, slot, profile, selected, registry);
    if (!asset || !product) return [];
    const key = `${profile!.id}:${asset.variantSku}:${asset.src}`;
    return failed[key] ? [] : [{ slot, product, asset, key }];
  });
  const missing = slots.filter(
    (slot) =>
      selected[slot] &&
      (slot === "case" ? !profile : !assets.some((item) => item.slot === slot)),
  );
  const illustrative =
    (candidate?.verified === false && candidate.illustrative === true) ||
    assets.some(
      ({ asset }) => asset.verified === false && asset.illustrative === true,
    );
  const profileError = () =>
    setFailed((value) => ({ ...value, [profileKey]: true }));
  const imageClass = "rf-photo-cutout pointer-events-none object-contain";
  return (
    <>
      {(illustrative || !!missing.length) && (
        <div className="rf-assembly-messages pointer-events-none flex w-full shrink-0 flex-col items-center gap-1 px-3 text-center text-xs leading-5">
          {illustrative && (
            <p
              role="note"
              className="rf-assembly-illustrative m-0 text-violet-200"
            >
              Ảnh dựng minh họa · Chưa xác minh tỷ lệ lắp thực tế
            </p>
          )}
          {!!missing.length && (
            <p className="rf-assembly-missing m-0 text-amber-200" role="status">
              {missing.length}{" "}
              {illustrative
                ? "linh kiện chưa tải được ảnh lắp"
                : "linh kiện cần ảnh lắp đã xác minh"}
            </p>
          )}
        </div>
      )}
      <div className="rf-assembly-canvas relative flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          className="rf-photo-stack"
          data-isolated={isolate && !!selected[focus]}
          style={poseStyle}
        >
          {!profile && (
            <div className="rf-assembly-unavailable absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-violet-300/25 bg-[radial-gradient(ellipse_at_top,#703fdc18,transparent_75%)] px-4 text-center">
              <CategoryIcon id="case" size={40} />
              <p className="m-0 text-base font-semibold text-white">
                {selected.case ? "Cần ảnh case mở hông" : "Bắt đầu từ vỏ case"}
              </p>
              <p className="m-0 max-w-72 text-xs leading-relaxed text-slate-400">
                {selected.case
                  ? "Chưa có bộ ảnh lắp đúng mẫu cho case đang chọn. Các linh kiện vẫn được giữ trong cấu hình."
                  : "Chọn case và linh kiện để xem bộ ảnh dựng theo sản phẩm."}
              </p>
              <button
                type="button"
                onClick={() => onChoose("case")}
                className="min-h-11 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 text-sm text-emerald-100"
              >
                {selected.case ? "Đổi vỏ case" : "Chọn vỏ case"}
              </button>
              <button
                type="button"
                onClick={() => setReferenceOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs text-violet-200 underline underline-offset-4"
              >
                <ImageIcon size={15} /> Xem mẫu phối cảnh
              </button>
            </div>
          )}
          {profile && selected.case && (
            <>
              <div
                className="rf-photo-layer"
                data-slot="case"
                data-product-id={selected.case.id}
                data-variant-sku={profile.variantSku}
                data-assembly-src={profile.src}
                data-muted={panelOpen}
                data-focused={focus === "case"}
                style={{
                  ...rectStyle(
                    exploded
                      ? separated.case
                      : { x: 0, y: 0, width: 100, height: 100 },
                  ),
                  zIndex: 0,
                }}
              >
                <button
                  type="button"
                  aria-label="Xem Vỏ case"
                  aria-pressed={focus === "case"}
                  title={selected.case.name}
                  onClick={() => onFocus("case")}
                  className="relative block size-full bg-transparent p-0 outline-offset-4"
                >
                  <Image
                    src={profile.src}
                    alt={selected.case.name}
                    fill
                    sizes="(max-width:767px) 85vw, 460px"
                    unoptimized={profile.src.endsWith(".svg")}
                    draggable={false}
                    className={imageClass}
                    onError={profileError}
                  />
                </button>
              </div>
              <div
                className="rf-assembly-interior absolute inset-0"
                data-clipped={!exploded && !isolate}
                style={{
                  clipPath:
                    exploded || isolate
                      ? undefined
                      : `inset(${profile.aperture.y}% ${100 - profile.aperture.x - profile.aperture.width}% ${100 - profile.aperture.y - profile.aperture.height}% ${profile.aperture.x}%)`,
                  pointerEvents: "none",
                }}
              >
                {assets.map(({ slot, product, asset, key }) => {
                  const occluded =
                    !exploded &&
                    !(isolate && focus === slot) &&
                    asset.hiddenBy?.some((cover) => !!selected[cover]);
                  if (occluded) return null;
                  const fail = () =>
                    setFailed((value) => ({ ...value, [key]: true }));
                  const cutout = (
                    <Image
                      src={asset.src}
                      alt={product.name}
                      fill
                      sizes="(max-width:767px) 60vw, 460px"
                      unoptimized={asset.src.endsWith(".svg")}
                      draggable={false}
                      className={
                        asset.crop
                          ? "rf-photo-cutout pointer-events-none object-fill"
                          : imageClass
                      }
                      style={
                        asset.maskSrc
                          ? {
                              maskImage: `url("${asset.maskSrc}")`,
                              maskSize: "100% 100%",
                              maskRepeat: "no-repeat",
                            }
                          : undefined
                      }
                      onError={fail}
                    />
                  );
                  const position = exploded ? separated[slot] : asset.placement;
                  const boxRatio = position.width / position.height;
                  const fit = asset.aspectRatio
                    ? {
                        width: `${Math.min(1, asset.aspectRatio / boxRatio) * 100}%`,
                        height: `${Math.min(1, boxRatio / asset.aspectRatio) * 100}%`,
                      }
                    : { width: "100%", height: "100%" };
                  return (
                    <div
                      key={key}
                      className="rf-photo-layer"
                      data-slot={slot}
                      data-product-id={product.id}
                      data-variant-sku={asset.variantSku}
                      data-assembly-src={asset.src}
                      data-focused={focus === slot}
                      style={{
                        ...rectStyle(
                          exploded ? separated[slot] : asset.placement,
                        ),
                        zIndex: isolate && focus === slot ? 55 : asset.zIndex,
                        pointerEvents: "auto",
                      }}
                    >
                      <button
                        type="button"
                        aria-label={`Xem ${labels[slot]}`}
                        aria-pressed={focus === slot}
                        onClick={() => onFocus(slot)}
                        title={product.name}
                        className="group relative block size-full bg-transparent p-0 outline-offset-4"
                      >
                        {asset.crop ? (
                          <span
                            className="rf-assembly-crop pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
                            style={fit}
                          >
                            <span
                              className="absolute block"
                              style={{
                                left: `${(-asset.crop.x / asset.crop.width) * 100}%`,
                                top: `${(-asset.crop.y / asset.crop.height) * 100}%`,
                                width: `${10000 / asset.crop.width}%`,
                                height: `${10000 / asset.crop.height}%`,
                              }}
                            >
                              {cutout}
                            </span>
                          </span>
                        ) : (
                          cutout
                        )}
                        {asset.maskSrc && (
                          <Image
                            src={asset.maskSrc}
                            alt=""
                            width={1}
                            height={1}
                            unoptimized
                            loading="eager"
                            className="hidden"
                            onError={fail}
                          />
                        )}
                        <span
                          className={`absolute -top-5 left-0 rounded border border-emerald-300/30 bg-[#101d26] px-1.5 text-xs text-emerald-100 ${exploded ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
                        >
                          {labels[slot]}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
              {profile.foregroundSrc && !exploded && (
                <div
                  className="rf-assembly-foreground pointer-events-none absolute inset-0"
                  data-muted={panelOpen || isolate}
                  style={{ zIndex: 60 }}
                >
                  <Image
                    src={profile.foregroundSrc}
                    alt=""
                    fill
                    sizes="(max-width:767px) 85vw,460px"
                    unoptimized={profile.foregroundSrc.endsWith(".svg")}
                    className="object-contain"
                    draggable={false}
                    onError={profileError}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {referenceOpen && (
        <Dialog
          title="Mẫu phối cảnh đã duyệt"
          onClose={() => setReferenceOpen(false)}
        >
          <Image
            src="/images/pc-assembly/reference-concept-v1.png"
            alt="Mẫu ý tưởng bộ PC trước và sau khi thay tản nhiệt RGB"
            width={1536}
            height={1024}
            className="h-auto max-h-[60vh] w-full object-contain"
          />
          <p className="text-sm leading-relaxed">
            Mẫu ý tưởng có RTX 5070 FE và tản AG400 ARGB. Ảnh này chưa phản ánh
            cấu hình bạn đang chọn và chưa được xác minh tỷ lệ lắp thực tế.
          </p>
        </Dialog>
      )}
      <span
        className="sr-only"
        data-assembly-ready-count={(profile ? 1 : 0) + assets.length}
      >
        <Layers3 aria-hidden="true" /> Ảnh lắp sẵn sàng:{" "}
        {(profile ? 1 : 0) + assets.length} / {Object.keys(selected).length}
      </span>
    </>
  );
}
