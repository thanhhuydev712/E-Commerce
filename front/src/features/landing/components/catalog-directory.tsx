"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/src/components/storefront/category-icon";

const shortcuts = [
  "pc",
  "laptop",
  "gpu",
  "cpu",
  "monitor",
  "gear",
  "mouse",
  "ram",
];

// Ảnh biên tập theo nhóm; không đổi ảnh SKU ở card có giá bán.
const artwork: Record<string, { image: string; tone: string }> = {
  pc: { image: "/images/catalog/case-4.webp", tone: "bg-[#ede4ff]" },
  laptop: { image: "/images/catalog/laptop-5.webp", tone: "bg-[#ffe7e0]" },
  gpu: { image: "/images/catalog/gpu-6.webp", tone: "bg-[#ddf7fc]" },
  cpu: { image: "/images/catalog/cpu-1.webp", tone: "bg-[#fff0ce]" },
  monitor: { image: "/images/catalog/monitor-4.webp", tone: "bg-[#e4eaff]" },
  gear: { image: "/images/catalog/gear-4.webp", tone: "bg-[#ffe3ee]" },
  mouse: { image: "/images/catalog/mouse-3.webp", tone: "bg-[#ddf8f4]" },
  ram: { image: "/images/catalog/ram-1.webp", tone: "bg-[#f1e4ff]" },
};

/** Tám lối tắt trên landing; toàn bộ danh mục vẫn có trong menu và catalog. */
export function CatalogDirectory() {
  const { categories, products } = useCatalog();
  const visible = shortcuts.flatMap((id) => {
    const category = categories.find((item) => item.id === id);
    return category ? [category] : [];
  });
  if (!visible.length) return null;
  return (
    <section
      className="rf-reference-directory border-t border-rf-border pt-7"
      aria-labelledby="forge-categories"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="forge-categories"
          className="m-0 text-2xl font-semibold tracking-tight md:text-3xl"
        >
          Bạn đang tìm gì?
        </h2>
        <Link
          href="/products"
          className="inline-flex min-h-11 items-center gap-2 text-rf-body font-semibold text-rf-accent hover:text-rf-accent-hover"
        >
          Tất cả danh mục <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="rf-directory-grid grid grid-cols-4 gap-2 md:grid-cols-8 md:gap-3">
        {visible.map((category) => {
          const image =
            artwork[category.id]?.image ??
            products.find(
              (product) => product.category === category.id && product.image,
            )?.image;
          return (
            <Link
              href={`/products?category=${encodeURIComponent(category.id)}`}
              key={category.id}
              className="group flex min-w-0 flex-col items-center overflow-hidden rounded-2xl border border-rf-border bg-rf-surface text-center text-rf-caption font-semibold transition-[background-color,border-color,box-shadow,translate] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1 hover:shadow-[0_10px_25px_#6334e318] motion-reduce:transition-none hover:border-rf-accent hover:bg-rf-accent-soft sm:text-rf-body"
            >
              <div
                className={`relative h-24 w-full overflow-hidden md:h-28 ${artwork[category.id]?.tone ?? "bg-rf-accent-soft"}`}
              >
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100px, 180px"
                    className="rf-category-image object-contain p-3 mix-blend-multiply transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.16] group-focus-visible:scale-[1.16] motion-reduce:transition-none"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-rf-accent">
                    <CategoryIcon id={category.icon} size={28} />
                  </span>
                )}
              </div>
              <span className="flex min-h-14 items-center justify-center px-2 py-3 leading-snug">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
