"use client";

import Link from "next/link";
import { ArrowUpRight, Keyboard, Laptop, MonitorCog } from "lucide-react";
import { useCatalog } from "@/src/catalog/catalog-provider";
import { ProductRail } from "./product-rail";

// Nội dung biên tập của ba nhóm; SKU, ảnh, giá và tồn vẫn lấy từ catalog API.
const collections = [
  {
    category: "pc",
    title: "PC & máy bộ",
    eyebrow: "DESKTOP / PLAY & CREATE",
    description:
      "Một góc máy, nhiều khả năng. Chọn bộ máy phù hợp cách bạn làm việc và giải trí.",
    icon: MonitorCog,
    background: "bg-[linear-gradient(135deg,#ede6ff,#f9f6ff_65%,#e7faff)]",
    accent: "bg-rf-accent text-white",
  },
  {
    category: "laptop",
    title: "Laptop",
    eyebrow: "ON THE GO / WORK & PLAY",
    description:
      "Mang cảm hứng theo bạn. Khám phá laptop cho học tập, công việc và những chuyến đi.",
    icon: Laptop,
    background: "bg-[linear-gradient(135deg,#d7f8fa,#f2fcff_65%,#e9e7ff)]",
    accent: "bg-rf-cyan text-rf-ink",
  },
  {
    category: "gear",
    title: "Gaming Gear",
    eyebrow: "YOUR DESK / YOUR SIGNATURE",
    description:
      "Thêm chất riêng cho bàn làm việc, bắt đầu từ những thiết bị bạn chạm vào mỗi ngày.",
    icon: Keyboard,
    background: "bg-[linear-gradient(135deg,#ffe4dc,#fff5f4_65%,#f5e7ff)]",
    accent: "bg-rf-ember text-rf-ink",
  },
] as const;

/** Fragment giữ ba section là con trực tiếp của landing để dùng reveal chung. */
export function ProductCollections() {
  const { products } = useCatalog();
  return collections.map((collection, index) => {
    const selected = products
      .filter((product) => product.category === collection.category)
      .slice(0, 8);
    const href = `/products?category=${collection.category}`;
    const Icon = collection.icon;
    return (
      <section
        key={collection.category}
        id={`landing-${collection.category}`}
        aria-labelledby={`landing-${collection.category}-title`}
        data-category={collection.category}
        className={`rf-landing-collection min-w-0 rounded-3xl border border-rf-border/70 p-4 md:p-7 ${collection.background}`}
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-72">
            <p className="mb-3 flex items-center gap-2 font-mono text-xs tracking-[0.13em] text-rf-muted">
              <span
                className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full font-semibold tracking-normal ${collection.accent}`}
              >
                0{index + 1}
              </span>
              {collection.eyebrow}
            </p>
            <div className="flex items-center gap-3">
              <Icon
                className="shrink-0 text-rf-accent"
                size={28}
                aria-hidden="true"
              />
              <h2
                id={`landing-${collection.category}-title`}
                className="m-0 text-2xl font-semibold tracking-tight md:text-3xl"
              >
                {collection.title}
              </h2>
            </div>
            <p className="mt-3 mb-0 max-w-2xl text-rf-caption leading-relaxed text-rf-muted md:text-rf-body">
              {collection.description}
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-rf-accent/20 bg-white/75 px-4 py-2 text-rf-caption font-semibold text-rf-accent transition-colors hover:border-rf-accent hover:bg-white motion-reduce:transition-none"
          >
            Xem tất cả <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        {selected.length ? (
          <div className="min-w-0 [&_.rf-reference-card]:rounded-2xl [&_.rf-reference-card]:border [&_.rf-reference-card]:border-rf-border [&_.rf-reference-card]:bg-rf-surface [&_.rf-reference-card]:shadow-[0_4px_18px_#20203b05]">
            <ProductRail products={selected} variant="shelf" />
          </div>
        ) : (
          <p className="m-0 rounded-2xl border border-dashed border-rf-border bg-white/75 px-5 py-8 text-center text-rf-body text-rf-muted">
            Nhóm sản phẩm đang được cập nhật. Bạn có thể xem thêm trong danh
            mục.
          </p>
        )}
        <p className="mt-4 mb-0 text-xs text-rf-muted">
          Sản phẩm và giá trong bản trải nghiệm là dữ liệu minh họa.
        </p>
      </section>
    );
  });
}
