"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";

import { CategoryIcon } from "./category-icon";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  category_tiles: [
    "rf-category-tiles grid grid-cols-[repeat(12,_1fr)] gap-2.5 [&>a]:flex [&>a]:flex-col [&>a]:items-center",
    "[&>a]:justify-center [&>a]:bg-white [&>a]:bg-none [&>a]:min-h-24 [&>a]:text-[10px] [&>a]:font-semibold",
    "[&>a]:[transition:border-color_0.2s,_transform_0.2s] [&>a]:border-rf-border [&>a]:border-solid [&>a]:border",
    "[&>a]:rounded-[9px] [&>a]:gap-3 [&>a_svg]:text-[#577567] max-[1200px]:grid-cols-[repeat(6,_1fr)]",
    "max-[1200px]:[&>a]:min-h-22 max-[768px]:grid-cols-[repeat(4,_1fr)] max-[768px]:gap-2 max-[768px]:[&>a]:min-h-20.5",
    "max-[768px]:[&>a]:text-[9px] max-[768px]:[&>a]:gap-2.25 max-[768px]:[&>a_svg]:w-6 max-[768px]:[&>a_svg]:h-6",
    "[&>a:hover]:[transform:translateY(-3px)] [&>a:hover]:border-[#a3c9b5]",
  ].join(" "),
};

// Component độc lập; nhận dữ liệu qua props, không truy cập API thật.
export function CategoryLinks() {
  const { categories } = useCatalog();

  return (
    <div className={tw.category_tiles}>
      {categories.map((c) => (
        <Link key={c.id} href={`/products?category=${c.id}`}>
          <CategoryIcon id={c.id} size={28} />
          <span>{c.short}</span>
        </Link>
      ))}
    </div>
  );
}
