"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { ProductCard } from "@/src/components/storefront";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  deal_section: [
    "rf-deal-section mt-9.5 bg-[#e9f2e9] bg-none pt-6 pb-0 px-5 border-[#c9dfcf] border-solid border rounded-[12px]",
    "max-[768px]:pt-5 max-[768px]:pb-0 max-[768px]:mt-7.5 max-[768px]:px-3",
  ].join(" "),
  deal_heading: [
    "rf-deal-heading flex items-center justify-between mb-5 gap-4 [&_h2]:flex [&_h2]:items-center [&_h2]:text-[26px]",
    "[&_h2]:text-[#1b5135] [&_h2]:tracking-[-0.7px] [&_h2]:mx-0 [&_h2]:my-1.25 [&_h2]:gap-2 [&_p]:text-[10px]",
    "[&_p]:text-[#6a846c] [&_p]:m-0 [&>a]:flex [&>a]:items-center [&>a]:text-[#306541] [&>a]:text-[11px]",
    "[&>a]:font-semibold [&>a]:gap-2.5 max-[768px]:items-start max-[768px]:[&_h2]:text-[21px] max-[768px]:[&_h2]:gap-1.25",
    "max-[768px]:[&_p]:text-[8px] max-[768px]:[&>a]:text-[8px] max-[768px]:[&>a]:max-w-18.75 max-[768px]:[&>a]:gap-1",
    "max-[768px]:[&>a_svg]:w-3 [&_.rf-eyebrow]:text-[8px] [&_.rf-eyebrow]:tracking-[1.5px] [&_.rf-eyebrow]:text-[#557e5e]",
    "max-[768px]:[&_.rf-eyebrow]:text-[6px] max-[768px]:[&_.rf-eyebrow]:tracking-[1px]",
  ].join(" "),
  product_grid_grid_five: [
    "rf-product-grid rf-grid-five grid grid-cols-[repeat(5,_minmax(0,_1fr))] gap-3.25",
    "max-[1200px]:grid-cols-[repeat(5,_minmax(0,_1fr))] max-[1200px]:gap-2.25",
    "max-[1024px]:grid-cols-[repeat(3,_minmax(0,_1fr))] max-[1024px]:gap-3",
    "max-[768px]:grid-cols-[repeat(2,_minmax(0,_1fr))] max-[768px]:gap-2.25",
    "max-[1024px]:[&>.rf-product-card:nth-child(n+4)]:hidden max-[768px]:[&>.rf-product-card:nth-child(n+4)]:block",
    "max-[768px]:[&>.rf-product-card:last-child:nth-child(odd)]:hidden",
  ].join(" "),
  deal_footer: [
    "rf-deal-footer flex items-center justify-between text-[10px] text-[#5d7d63] px-0.25 py-3.75 gap-3.5 [&_span]:flex",
    "[&_span]:items-center [&_span]:gap-1.75 [&_a]:flex [&_a]:items-center [&_a]:font-semibold [&_a]:gap-1.75",
    "max-[768px]:[&>span]:hidden max-[768px]:justify-center max-[768px]:text-[9px]",
  ].join(" "),
};

// Ưu đãi được biên tập bằng ID; không tạo countdown giả hoặc lượt mua ngẫu nhiên.
export function DealsSection() {
  const { featuredDeals } = useCatalog().presentation;

  return (
    <section className={tw.deal_section} aria-labelledby="deals-heading">
      <div className={tw.deal_heading}>
        <div>
          <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
            GIÁ TỐT CHO CẤU HÌNH MỚI
          </span>
          <h2 id="deals-heading">
            <Zap size={25} fill="currentColor" /> DEAL ĐÁNG BUILD
          </h2>
          <p>Sản phẩm nổi bật · Giá ưu đãi minh họa</p>
        </div>
        <Link href="/promotions">
          Xem tất cả ưu đãi <ArrowRight size={17} />
        </Link>
      </div>
      <div className={tw.product_grid_grid_five}>
        {featuredDeals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className={tw.deal_footer}>
        <span>
          <Sparkles size={14} /> Thêm lựa chọn, thêm cảm hứng cho chiếc PC tiếp
          theo.
        </span>
        <Link href="/pc-builder">
          Thử cấu hình của bạn <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
