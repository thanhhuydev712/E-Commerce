"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Flame } from "lucide-react";

import { productsForTab, type ShelfDefinition } from "../data/shelf-data";
import { ProductRail } from "./product-rail";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_shelf_shelf_ice: [
    "pt-0 pb-4.5 bg-[#e9f5ef] bg-none [scroll-margin-top:110px] [--shelf-bg:#e9f5ef] px-4 mx-0 my-14 rounded-[5px]",
    "max-[1024px]:mx-0 max-[1024px]:my-10 max-[768px]:pt-0 max-[768px]:pb-2.5 max-[768px]:px-2.25 max-[768px]:mx-0",
    "max-[768px]:my-7.5 max-[768px]:rounded-[8px] [&.rf-shelf-ice]:bg-[#eaf1f8] [&.rf-shelf-ice]:[--shelf-bg:#eaf1f8]",
    "[&.rf-shelf-ice_.rf-shelf-promo]:bg-[linear-gradient(#fff_9%,_#fff_32%,_#aecbdd)]",
    "[&.rf-shelf-ice_.rf-shelf-promo]:bg-transparent",
    "max-[768px]:[&.rf-shelf-ice_.rf-shelf-promo]:bg-[linear-gradient(100deg,_#fff,_#c3d8e8)]",
    "max-[768px]:[&.rf-shelf-ice_.rf-shelf-promo]:bg-transparent",
  ].join(" "),
  shelf_tabs: [
    "rf-shelf-tabs flex items-stretch bg-white bg-none rounded-tl-[6px] rounded-tr-[6px] rounded-br-[0] rounded-bl-[0]",
    "overflow-x-auto [scrollbar-width:none] min-h-14.25 mx-[-16px] my-0 [&>button]:flex-1 [&>button]:whitespace-nowrap",
    "[&>button]:text-rf-green [&>button]:text-[15px] [&>button]:font-bold [&>button]:bg-transparent [&>button]:bg-none",
    "[&>button]:rounded-tl-[7px] [&>button]:rounded-tr-[7px] [&>button]:rounded-br-[0] [&>button]:rounded-bl-[0]",
    "[&>button]:px-2 [&>button]:py-3.75 [&>button]:border-current [&>button]:border-none [&>button]:[border-width:0]",
    "max-[1200px]:[&>button]:text-[13px] max-[1024px]:[&>button]:text-[11px] max-[1024px]:[&>button]:px-2.5",
    "max-[1024px]:[&>button]:py-3.25 max-[768px]:min-h-11.25 max-[768px]:mx-[-9px] max-[768px]:my-0",
    "max-[768px]:[&>button]:flex-[0_0_auto] max-[768px]:[&>button]:min-w-25 max-[768px]:[&>button]:text-[11px]",
    "max-[768px]:[&>button]:p-3 [&>button.active]:bg-[var(--shelf-bg)] [&>button.active]:bg-none",
    "[&>button.active]:text-[#004c3f] [&>button:hover]:text-[#0a303d]",
  ].join(" "),
  shelf_more: [
    "rf-shelf-more flex justify-end pt-2.75 pb-3.25 px-0 [&_a]:inline-flex [&_a]:items-center [&_a]:text-[12px]",
    "[&_a]:text-[#20353b] [&_a]:gap-0.75 max-[768px]:px-0 max-[768px]:py-2.25 max-[768px]:[&_a]:text-[10px]",
  ].join(" "),
  shelf_body: [
    "rf-shelf-body grid grid-cols-[190px_minmax(0,_1fr)] items-stretch gap-3",
    "max-[1200px]:grid-cols-[160px_minmax(0,_1fr)] max-[1200px]:gap-2.5 max-[1024px]:grid-cols-[145px_minmax(0,_1fr)]",
    "max-[768px]:flex max-[768px]:flex-col max-[768px]:gap-2.5 [&_.rf-reference-card-specs]:min-h-30.5",
    "max-[1024px]:[&_.rf-reference-card-name]:text-[12px] max-[1024px]:[&_.rf-reference-card-price_strong]:text-[15px]",
    "max-[1024px]:[&_.rf-reference-card-specs>span]:text-[10px] max-[768px]:[&_.rf-reference-card-name]:text-[11px]",
    "max-[768px]:[&_.rf-reference-card-name]:leading-[18px] max-[768px]:[&_.rf-reference-card-name]:h-9",
    "max-[768px]:[&_.rf-reference-card-name]:min-h-9 max-[768px]:[&_.rf-reference-card-price_strong]:text-[14px]",
    "max-[768px]:[&_.rf-reference-card-specs]:min-h-26.25 max-[768px]:[&_.rf-reference-card-specs]:mb-3.5",
    "max-[768px]:[&_.rf-reference-card-specs>span]:text-[9px] [&>.rf-reference-rail_.rf-reference-card]:min-h-130",
    "[&_.rf-reference-card_.rf-product-photo]:h-46.25",
    "max-[1200px]:[&_.rf-reference-rail-viewport>.rf-reference-card]:basis-[calc((100%_-_36px)_/_4)]",
    "max-[1024px]:[&_.rf-reference-rail-viewport>.rf-reference-card]:basis-[calc((100%_-_24px)_/_3)]",
    "max-[1024px]:[&>.rf-reference-rail_.rf-reference-card]:min-h-120",
    "max-[1024px]:[&_.rf-reference-card_.rf-product-photo]:h-41.25",
    "max-[768px]:[&_.rf-reference-rail-viewport>.rf-reference-card]:basis-[calc((100%_-_9px)_/_2)]",
    "max-[768px]:[&>.rf-reference-rail_.rf-reference-card]:min-h-105",
    "max-[768px]:[&_.rf-reference-card_.rf-product-photo]:h-35.75",
  ].join(" "),
  shelf_promo: [
    "rf-shelf-promo relative flex flex-col items-center text-center bg-[linear-gradient(#fff_9%,_#fff_32%,_#c1e9d1)]",
    "bg-transparent pt-6.25 pb-4.25 min-h-130 px-3.5 rounded-[24px] overflow-hidden [&>span]:text-[16px]",
    "[&>span]:font-extrabold [&>span]:leading-[1.3] [&>span]:text-[#162c33] [&>hr]:w-[80%] [&>hr]:mt-4.25 [&>hr]:mb-4.75",
    "[&>hr]:border-t [&>hr]:[border-top-style:solid] [&>hr]:border-t-[#72877e] [&>hr]:[border-right-width:0]",
    "[&>hr]:[border-right-style:none] [&>hr]:border-r-current [&>hr]:[border-bottom-width:0]",
    "[&>hr]:[border-bottom-style:none] [&>hr]:border-b-current [&>hr]:[border-left-width:0]",
    "[&>hr]:[border-left-style:none] [&>hr]:border-l-current [&>hr]:mx-0 [&>strong]:text-[28px] [&>strong]:leading-[1.15]",
    "[&>strong]:tracking-[-1.2px] [&>strong]:font-black [&>strong]:text-[#00694d] [&>strong]:relative [&>strong]:z-1",
    "[&>strong>span]:block [&>i]:grid [&>i]:place-items-center [&>i]:absolute [&>i]:bottom-15.75 [&>i]:left-4.5",
    "[&>i]:w-9.75 [&>i]:h-9.75 [&>i]:bg-[#b8e1a3] [&>i]:bg-none [&>i]:text-[#176e44] [&>i]:shadow-[0_0_15px_#85cba2]",
    "[&>i]:[transform:rotate(-12deg)] [&>i]:rounded-full [&>b]:relative [&>b]:z-1 [&>b]:flex [&>b]:items-center",
    "[&>b]:justify-center [&>b]:mt-auto [&>b]:bg-[#007859] [&>b]:bg-none [&>b]:text-white [&>b]:text-[11px]",
    "[&>b]:min-h-8.75 [&>b]:px-3 [&>b]:py-2 [&>b]:rounded-[10px] [&>b]:gap-1 max-[1200px]:px-2.5",
    "max-[1200px]:[&>strong]:text-[25px] max-[1200px]:[&>span]:text-[14px] max-[1024px]:min-h-120",
    "max-[1024px]:[&>strong]:text-[24px] max-[768px]:grid max-[768px]:grid-cols-[1fr_90px]",
    "max-[768px]:justify-items-start max-[768px]:min-h-27.5 max-[768px]:h-27.5 max-[768px]:text-left",
    "max-[768px]:bg-[linear-gradient(100deg,_#fff,_#d0ecdc)] max-[768px]:bg-transparent max-[768px]:px-4.5",
    "max-[768px]:py-3.5 max-[768px]:rounded-[12px] max-[768px]:[&>span]:text-[10px] max-[768px]:[&>span]:self-start",
    "max-[768px]:[&>strong]:[grid-column:1] max-[768px]:[&>strong]:[grid-row:2] max-[768px]:[&>strong]:text-[20px]",
    "max-[768px]:[&>strong]:tracking-[-0.4px] max-[768px]:[&>strong]:leading-[1.1] max-[768px]:[&>strong>span]:inline",
    "max-[768px]:[&>hr]:hidden max-[768px]:[&>i]:hidden max-[768px]:[&>b]:[grid-row:3] max-[768px]:[&>b]:[grid-column:1]",
    "max-[768px]:[&>b]:text-[8px] max-[768px]:[&>b]:min-h-6 max-[768px]:[&>b]:mt-1.75 max-[768px]:[&>b]:px-2",
    "max-[768px]:[&>b]:py-1.25 max-[768px]:[&>b]:rounded-[5px] max-[768px]:[&>b>svg]:w-2.5",
    'max-[768px]:[&>strong>span+span::before]:content-["_"]',
  ].join(" "),
  shelf_promo_image: [
    "rf-shelf-promo-image relative w-50 h-62.5 mt-6 mix-blend-multiply [&_img]:object-contain [&_img]:px-3.75",
    "[&_img]:py-1.75 max-[1200px]:w-42.5 max-[1024px]:w-40 max-[1024px]:h-55 max-[768px]:[grid-column:2]",
    "max-[768px]:[grid-row:1/4] max-[768px]:w-23.75 max-[768px]:h-23.75 max-[768px]:absolute max-[768px]:right-2",
    "max-[768px]:top-1.25 max-[768px]:m-0 max-[768px]:[&_img]:p-0",
  ].join(" "),
  shelf_empty: [
    "rf-shelf-empty flex flex-col items-center justify-center min-h-105 bg-white bg-none text-center p-6.25",
    "rounded-[10px] gap-2.5 [&_p]:text-[#768d82] [&_p]:text-[12px] [&_p]:m-0 [&_a]:flex [&_a]:items-center",
    "[&_a]:text-[#007d60] [&_a]:text-[12px] [&_a]:gap-1.25 max-[768px]:min-h-50",
  ].join(" "),
};

/** Một template cho chín dải sản phẩm: tab → promo dọc + rail; không nhân đôi logic giỏ. */
export function CategoryShelf({ shelf }: { shelf: ShelfDefinition }) {
  const { products } = useCatalog();

  const [active, setActive] = useState(0);
  const tab = shelf.tabs[active];
  const visible = useMemo(() => productsForTab(tab, products), [tab, products]);
  const image = products.find(
    (product) =>
      product.category === shelf.imageCategory &&
      product.id.startsWith("demo-"),
  )?.image;
  const href = `/products?category=${tab.categories[0]}`;
  return (
    <section
      className={
        `rf-reference-shelf rf-shelf-${shelf.tone}` +
        " " +
        tw.reference_shelf_shelf_ice
      }
      aria-labelledby={`shelf-${shelf.id}`}
    >
      <h2
        id={`shelf-${shelf.id}`}
        className="rf-visually-hidden absolute w-0.25 h-0.25 [clip:rect(0,_0,_0,_0)] whitespace-nowrap p-0 m-[-1px] border-current border-none [border-width:0] overflow-hidden"
      >
        {shelf.label} — sản phẩm nổi bật
      </h2>
      <div className={tw.shelf_tabs} aria-label={`Nhóm ${shelf.label}`}>
        {shelf.tabs.map((item, index) => (
          <button
            key={item.id}
            aria-pressed={active === index}
            className={active === index ? "active" : ""}
            onClick={() => setActive(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={tw.shelf_more}>
        <Link href={href}>
          Xem tất cả <ChevronRight size={15} />
        </Link>
      </div>
      <div className={tw.shelf_body}>
        <Link href={href} className={tw.shelf_promo}>
          <span>{shelf.label}</span>
          <hr />
          <strong>
            {shelf.headline.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </strong>
          {image && (
            <div className={tw.shelf_promo_image}>
              <Image src={image} alt="" fill sizes="200px" />
            </div>
          )}
          <i>
            <Flame size={28} />
          </i>
          <b>
            KHÁM PHÁ NGAY <ArrowRight size={12} />
          </b>
        </Link>
        {visible.length ? (
          <ProductRail products={visible} />
        ) : (
          <div className={tw.shelf_empty}>
            <strong>Danh mục đang được cập nhật</strong>
            <p>Khám phá thêm lựa chọn trong catalog.</p>
            <Link href={href}>
              Xem danh mục <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
