"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Flame, Gift } from "lucide-react";
import { type CategoryId } from "@/src/catalog/model";
import { ProductRail } from "./product-rail";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_campaign: [
    "rf-reference-campaign pt-7 pb-8 bg-white bg-none shadow-[0_8px_25px_#1834440f] px-6.25 mx-0 my-9.5 rounded-[20px]",
    "max-[768px]:pt-3.5 max-[768px]:pb-5 max-[768px]:px-2.5 max-[768px]:mx-0 max-[768px]:my-7 max-[768px]:rounded-[12px]",
    "[&_.rf-reference-card]:px-2.5 [&_.rf-reference-card]:border-[#e2e7e6] [&_.rf-reference-card]:border-solid",
    "[&_.rf-reference-card]:border [&_.rf-reference-card]:rounded-[8px] [&_.rf-reference-card-name]:text-[13px]",
    "[&_.rf-reference-card-name]:h-10 [&_.rf-reference-card-name]:min-h-10 [&_.rf-reference-card-name]:leading-[20px]",
    "[&_.rf-reference-card-price_strong]:text-[16px] [&_.rf-reference-card-specs]:px-1.25",
    "[&_.rf-reference-card-actions]:gap-1.25 [&_.rf-card-add]:w-8.5 [&_.rf-card-buy_span]:text-[10px]",
    "max-[768px]:[&_.rf-reference-card-name]:text-[11px] max-[768px]:[&_.rf-reference-card-price_strong]:text-[14px]",
    "[&_.rf-reference-card_.rf-product-photo]:h-42.5 max-[1024px]:[&_.rf-reference-card_.rf-product-photo]:h-47.5",
    "max-[768px]:[&_.rf-reference-card_.rf-product-photo]:h-36.25",
  ].join(" "),
  campaign_tabs: [
    "rf-campaign-tabs grid grid-cols-[repeat(4,_1fr)] pt-3.75 pb-5.5 px-0 gap-3 [&>button]:bg-white [&>button]:bg-none",
    "[&>button]:[border-top-width:0] [&>button]:[border-top-style:none] [&>button]:border-t-current",
    "[&>button]:[border-right-width:0] [&>button]:[border-right-style:none] [&>button]:border-r-current",
    "[&>button]:border-b-2 [&>button]:[border-bottom-style:solid] [&>button]:border-b-[#edf1f2]",
    "[&>button]:[border-left-width:0] [&>button]:[border-left-style:none] [&>button]:border-l-current",
    "[&>button]:text-[#087058] [&>button]:text-center [&>button]:p-2.5 [&>button]:rounded-[12px] [&_span]:block",
    "[&_span]:text-[10px] [&_span]:font-black [&_small]:inline-block [&_small]:mt-1.25 [&_small]:text-[9px]",
    "[&_small]:rounded-tl-[5px] [&_small]:rounded-tr-[0] [&_small]:rounded-br-[0] [&_small]:rounded-bl-[5px]",
    "[&_small]:bg-[#08775b] [&_small]:bg-none [&_small]:text-white [&_small]:px-1.25 [&_small]:py-1",
    "[&_strong]:inline-block [&_strong]:text-[22px] [&_strong]:bg-[#08775b] [&_strong]:bg-none [&_strong]:text-white",
    "[&_strong]:pt-0 [&_strong]:pb-0.25 [&_strong]:rounded-tl-[0] [&_strong]:rounded-tr-[5px] [&_strong]:rounded-br-[5px]",
    "[&_strong]:rounded-bl-[0] [&_strong]:leading-[1.25] [&_strong]:px-2 max-[1024px]:[&_strong]:text-[18px]",
    "max-[768px]:grid-cols-[repeat(2,_1fr)] max-[768px]:pt-0.75 max-[768px]:pb-3.25 max-[768px]:px-0 max-[768px]:gap-1.5",
    "max-[768px]:[&>button]:px-1.25 max-[768px]:[&>button]:py-2 max-[768px]:[&_span]:text-[8px]",
    "max-[768px]:[&_small]:text-[7px] max-[768px]:[&_strong]:text-[17px] [&>button.active]:bg-[#edf8ee]",
    "[&>button.active]:bg-none [&>button.active]:border-b-[#0a8d66]",
  ].join(" "),
  campaign_ribbon: [
    "rf-campaign-ribbon flex items-center min-h-13 bg-[linear-gradient(100deg,_#082b37,_#10463d,_#0d2939)] bg-transparent",
    "text-[#c5efcb] mb-3.75 px-4 py-2 gap-3.75 [&_h2]:flex [&_h2]:items-center [&_h2]:text-[23px] [&_h2]:italic",
    "[&_h2]:mr-auto [&_h2]:ml-0 [&_h2]:my-0 [&_h2]:gap-2 [&_span]:flex [&_span]:items-center [&_span]:text-[9px]",
    "[&_span]:gap-1.25 [&>b]:text-[10px] [&>b]:text-[#0b3c2f] [&>b]:bg-[#a5e1b3] [&>b]:bg-none [&>b]:px-2 [&>b]:py-1.5",
    "[&>b]:rounded-[4px] [&_small]:text-[8px] max-[1024px]:[&_small]:hidden max-[1024px]:[&_span]:hidden",
    "max-[768px]:min-h-11.25 max-[768px]:mb-2.5 max-[768px]:p-2.5 max-[768px]:gap-1.5 max-[768px]:[&_h2]:text-[17px]",
    "max-[768px]:[&_h2_svg]:w-4.5 max-[768px]:[&>b]:text-[7px] max-[768px]:[&>b]:p-1",
    "max-[768px]:[&>b:last-of-type]:hidden",
  ].join(" "),
  campaign_more: [
    "rf-campaign-more flex justify-center items-center mt-7 text-[13px] text-[#006f58] font-bold gap-1.5",
    "max-[768px]:text-[10px] max-[768px]:mt-5 max-[768px]:text-center",
  ].join(" "),
};

const campaigns: {
  label: string;
  line: string;
  offer: string;
  category: CategoryId;
}[] = [
  {
    label: "PC QUỐC DÂN",
    line: "CẤU HÌNH TỪ",
    offer: "15 TRIỆU",
    category: "pc",
  },
  {
    label: "MÀN HÌNH GAMING",
    line: "TRẢI NGHIỆM",
    offer: "MƯỢT MÀ",
    category: "monitor",
  },
  {
    label: "LAPTOP CHÍNH HÃNG",
    line: "LỰA CHỌN",
    offer: "TỐI ƯU",
    category: "laptop",
  },
  {
    label: "CAMERA THÔNG MINH",
    line: "GIÁ TỐT",
    offer: "MỖI NGÀY",
    category: "camera",
  },
];
export function CampaignSection() {
  const { products } = useCatalog();

  const [active, setActive] = useState(0);
  const selected = campaigns[active];
  const rows = products
    .filter(
      (product) =>
        product.category === selected.category &&
        product.id.startsWith("demo-"),
    )
    .slice(0, 6);
  return (
    <section
      className={tw.reference_campaign}
      aria-label="Sản phẩm theo chiến dịch"
    >
      <div className={tw.campaign_tabs}>
        {campaigns.map((campaign, index) => (
          <button
            key={campaign.category}
            aria-pressed={active === index}
            className={active === index ? "active" : ""}
            onClick={() => setActive(index)}
          >
            <span>{campaign.label}</span>
            <small>{campaign.line}</small>
            <strong>{campaign.offer}</strong>
          </button>
        ))}
      </div>
      <div className={tw.campaign_ribbon}>
        <h2>
          <Flame size={24} />
          {selected.label}
        </h2>
        <span>
          <Gift size={14} />
          Linh kiện chính hãng
        </span>
        <b>HIỆU NĂNG TỐT</b>
        <b>GIÁ TỐI ƯU</b>
        <small>RIGFORGE · FORGE YOUR OWN POWER</small>
      </div>
      <ProductRail products={rows} columns={6} />
      <Link
        className={tw.campaign_more}
        href={`/products?category=${selected.category}`}
      >
        Xem thêm {selected.label.toLowerCase()} giá tốt tại Rigforge{" "}
        <ArrowRight size={15} />
      </Link>
    </section>
  );
}
