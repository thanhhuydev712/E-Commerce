"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { useCatalog } from "@/src/catalog/catalog-provider";

const brandArtwork: Record<
  string,
  { src: string; glow: string; dark?: boolean }
> = {
  asus: { src: "/images/brands/asus.svg", glow: "#45e2ef" },
  amd: { src: "/images/brands/amd.svg", glow: "#ff795f", dark: true },
  msi: { src: "/images/brands/msi.png", glow: "#c298ff" },
  gigabyte: { src: "/images/brands/gigabyte.svg", glow: "#45e2ef" },
  kingston: { src: "/images/brands/kingston.png", glow: "#ff795f" },
  corsair: { src: "/images/brands/corsair.svg", glow: "#c298ff" },
};
const offsets = ["md:top-3", "", "md:top-3", "", "md:-top-3", ""];
const brandKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Logo được lưu local, giữ màu và tỷ lệ gốc; xem nguồn trong docs/BRAND_ASSETS.md. */
export function PartnerBrands() {
  const { presentation, products } = useCatalog();
  const brands = Array.from(
    new Map(
      [
        ...presentation.partnerBrands,
        ...products.map((product) => product.brand),
      ]
        .map((brand) => brand.trim())
        .filter(Boolean)
        .map((brand) => [brandKey(brand), brand]),
    ).values(),
  ).slice(0, 6);

  return (
    <section
      aria-labelledby="forge-partners-heading"
      className="rf-reference-brands relative isolate overflow-hidden rounded-3xl border border-[#353053] bg-[#111025] p-5 text-white sm:p-8 lg:p-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-52 -right-32 size-[600px] rounded-full bg-[#6334e3]/25 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-80 -left-32 size-[600px] rounded-full border border-rf-cyan/15 before:absolute before:inset-12 before:rounded-full before:border before:border-rf-cyan/10 after:absolute after:inset-24 after:rounded-full after:border after:border-rf-cyan/10"
      />
      <header className="relative mb-6 grid items-end gap-5 border-b border-white/15 pb-7 md:mb-8 lg:grid-cols-[1.3fr_0.7fr] lg:gap-12 lg:pb-9">
        <div className="min-w-0">
          <p className="mb-4 flex flex-wrap items-center gap-3 font-mono text-rf-caption tracking-[0.13em] text-rf-cyan">
            <span aria-hidden="true" className="h-px w-8 bg-rf-cyan" />
            ĐỐI TÁC &amp; THƯƠNG HIỆU
          </p>
          <h2
            id="forge-partners-heading"
            className="m-0 text-[clamp(2rem,3.1vw,3.5rem)] leading-[1.14] font-bold tracking-[-0.04em]"
          >
            Những tên tuổi lớn.
            <br />
            <span className="text-[#b9abff]">Cho chất riêng của bạn.</span>
          </h2>
        </div>
        <div className="min-w-0 lg:pb-1">
          <p className="mb-4 max-w-md text-rf-body leading-relaxed text-[#d1cde6]">
            Từ linh kiện cốt lõi đến góc máy hoàn chỉnh. Khám phá hệ sinh thái
            công nghệ cùng RIGFORCE STORE.
          </p>
          <Link
            href="/brands"
            className="inline-flex min-h-11 items-center gap-3 rounded-full border border-white/25 bg-white/5 px-5 py-2 text-rf-small font-semibold text-white! hover:border-rf-cyan hover:bg-rf-cyan/10 focus-visible:outline-rf-cyan"
          >
            Khám phá thương hiệu <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </header>
      {brands.length ? (
        <div className="relative grid min-w-0 grid-cols-2 gap-3 py-1 sm:gap-4 md:grid-cols-3 md:gap-5 md:py-4">
          {brands.map((brand, index) => {
            const artwork = brandArtwork[brandKey(brand)];
            return (
              <Link
                key={brandKey(brand)}
                href={`/products?brand=${encodeURIComponent(brand)}`}
                aria-label={`Sản phẩm ${brand}`}
                style={
                  {
                    "--brand-glow": artwork?.glow ?? "#c298ff",
                  } as CSSProperties
                }
                className={`rf-brand-tile group relative flex min-h-40 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/40 p-4 shadow-[0_8px_28px_#00000020] transition-[translate,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-1.5 hover:border-[color:var(--brand-glow)] hover:shadow-[0_16px_40px_#00000040,0_0_24px_color-mix(in_srgb,var(--brand-glow)_25%,transparent)] motion-safe:focus-visible:-translate-y-1.5 focus-visible:outline-rf-cyan motion-reduce:transition-none sm:min-h-44 sm:p-5 ${offsets[index]} ${artwork?.dark ? "bg-[#242039] text-white" : "bg-[#fafaff] text-rf-ink"}`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -bottom-24 size-52 rounded-full bg-[var(--brand-glow)] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 group-focus-visible:opacity-20 motion-reduce:transition-none"
                />
                <div className="relative flex items-center justify-between gap-3">
                  <span
                    aria-hidden="true"
                    className="font-mono text-xs text-[#7c7890]"
                  >
                    0{index + 1} /
                  </span>
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-[var(--brand-glow)]"
                  />
                </div>
                <div className="relative my-3 flex min-h-16 flex-1 items-center justify-center sm:my-4 sm:min-h-20">
                  {artwork ? (
                    <div
                      className={`relative h-14 w-full sm:h-20 ${brandKey(brand) === "msi" ? "max-w-36" : "max-w-52 sm:max-w-64"}`}
                    >
                      <Image
                        src={artwork.src}
                        alt={`Logo ${brand}`}
                        fill
                        unoptimized
                        sizes="(max-width: 639px) 38vw, (max-width: 1023px) 28vw, 360px"
                        className="rf-brand-logo object-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transition-none"
                      />
                    </div>
                  ) : (
                    <span className="text-xl font-bold [overflow-wrap:anywhere]">
                      {brand}
                    </span>
                  )}
                </div>
                <div
                  className={`relative flex items-center justify-between gap-2 border-t pt-3 ${artwork?.dark ? "border-white/15 text-[#c7c3d8]" : "border-[#e7e5f0] text-[#69647d]"}`}
                >
                  <span className="text-rf-caption">
                    Khám phá <span className="hidden sm:inline">sản phẩm</span>
                  </span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eeecf6] text-rf-ink transition-[color,background-color] duration-300 group-hover:bg-rf-accent group-hover:text-white group-focus-visible:bg-rf-accent group-focus-visible:text-white">
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="relative rounded-xl border border-white/15 p-6 text-rf-body text-white/75">
          Chưa có thương hiệu để hiển thị.
        </p>
      )}
      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-5 text-rf-caption text-[#a9a2c2]">
        <span>Thương hiệu minh họa trong bản demo</span>
        {brands.length > 0 && (
          <span className="inline-flex items-center gap-2 font-mono tracking-wider">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-rf-cyan"
            />
            {String(brands.length).padStart(2, "0")} THƯƠNG HIỆU / MỘT GÓC MÁY
          </span>
        )}
      </div>
    </section>
  );
}
