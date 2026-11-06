"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Image from "next/image";
import Link from "next/link";
import { motion } from "@/src/components/ui/motion";
import { type CategoryId } from "@/src/catalog/model";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_directory: [
    "rf-reference-directory bg-white bg-none px-5 py-6 mx-0 my-10.5 rounded-[14px] max-[768px]:px-3 max-[768px]:py-4.25",
    "max-[768px]:mx-0 max-[768px]:my-7 max-[768px]:rounded-[9px]",
  ].join(" "),
  reference_section_label: [
    "rf-reference-section-label flex items-center justify-between mb-5.5 gap-3 [&_h2]:bg-rf-green [&_h2]:bg-none",
    "[&_h2]:text-white [&_h2]:text-[13px] [&_h2]:font-extrabold [&_h2]:px-4.5 [&_h2]:py-2.5 [&_h2]:m-0",
    "[&_h2]:rounded-[24px] [&>a]:flex [&>a]:items-center [&>a]:text-rf-green [&>a]:text-[11px] [&>a]:font-bold",
    "[&>a]:gap-1 max-[768px]:mb-4.75 max-[768px]:gap-1.75 max-[768px]:[&_h2]:text-[10px] max-[768px]:[&_h2]:px-3",
    "max-[768px]:[&_h2]:py-2.25 max-[768px]:[&>a]:text-[8px]",
  ].join(" "),
  directory_grid: [
    motion.tiles,
    "rf-directory-grid grid grid-cols-[repeat(10,_minmax(0,_1fr))] gap-y-5.5 gap-x-2.5 [&>a]:flex [&>a]:items-center",
    "[&>a]:flex-col [&>a]:text-center [&>a]:text-[10px] [&>a]:text-[#304049] [&>a]:gap-2.5 [&>a>div]:relative",
    "[&>a>div]:h-16 [&>a>div]:w-full [&_img]:object-contain [&_img]:[transition:transform_0.2s]",
    "max-[1024px]:grid-cols-[repeat(5,_minmax(0,_1fr))] max-[768px]:grid-cols-[repeat(4,_minmax(0,_1fr))]",
    "max-[768px]:gap-y-4.5 max-[768px]:gap-x-2 max-[768px]:[&>a]:text-[9px] max-[768px]:[&>a]:gap-1.5",
    "max-[768px]:[&>a>div]:h-12.25 motion-reduce:[&_img]:[transition:none] [&_a:hover_img]:[transform:translateY(-4px)]",
  ].join(" "),
};

const directory: CategoryId[] = [
  "gpu",
  "mainboard",
  "cpu",
  "ram",
  "cooler",
  "laptop",
  "pc",
  "monitor",
  "hdd",
  "case",
  "psu",
  "gear",
  "mouse",
  "headset",
  "chair",
  "desk",
  "network",
  "printer",
  "software",
  "camera",
];
export function CatalogDirectory() {
  const { categories, products } = useCatalog();

  return (
    <section className={tw.reference_directory}>
      <div className={tw.reference_section_label}>
        <h2>DANH MỤC SẢN PHẨM</h2>
      </div>
      <div className={tw.directory_grid}>
        {directory.map((id) => {
          const category = categories.find((item) => item.id === id)!;
          const image = products.find(
            (item) => item.category === id && item.id.startsWith("demo-"),
          )?.image;
          return (
            <Link href={`/products?category=${id}`} key={id}>
              {image && (
                <div>
                  <Image src={image} alt="" fill sizes="100px" />
                </div>
              )}
              <span>{category.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
