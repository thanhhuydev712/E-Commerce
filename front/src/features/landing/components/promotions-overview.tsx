"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CreditCard, Gift, MonitorCog } from "lucide-react";

import { motion } from "@/src/components/ui/motion";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_promotions: [
    "rf-reference-promotions bg-white bg-none px-5 py-6 mx-0 my-10.5 rounded-[14px] max-[768px]:px-3 max-[768px]:py-4.25",
    "max-[768px]:mx-0 max-[768px]:my-7 max-[768px]:rounded-[9px]",
  ].join(" "),
  reference_section_label: [
    "rf-reference-section-label flex items-center justify-between mb-5.5 gap-3 [&_h2]:bg-rf-green [&_h2]:bg-none",
    "[&_h2]:text-white [&_h2]:text-[13px] [&_h2]:font-extrabold [&_h2]:px-4.5 [&_h2]:py-2.5 [&_h2]:m-0",
    "[&_h2]:rounded-[24px] [&>a]:flex [&>a]:items-center [&>a]:text-rf-green [&>a]:text-[11px] [&>a]:font-bold",
    "[&>a]:gap-1 max-[768px]:mb-4.75 max-[768px]:gap-1.75 max-[768px]:[&_h2]:text-[10px] max-[768px]:[&_h2]:px-3",
    "max-[768px]:[&_h2]:py-2.25 max-[768px]:[&>a]:text-[8px]",
  ].join(" "),
  promotion_grid: [
    "rf-promotion-grid grid grid-cols-[repeat(3,_minmax(0,_1fr))] gap-5 [&_article]:flex [&_article]:flex-col",
    "[&_article]:min-w-0 [&_h3]:text-[18px] [&_h3]:leading-[1.55] [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2.5",
    "[&_h3]:mx-2 [&_p]:text-[15px] [&_p]:leading-[1.6] [&_p]:italic [&_p]:mt-0 [&_p]:mb-3.5 [&_p]:text-[#293f48]",
    "[&_p]:mx-2 max-[1024px]:[&_h3]:text-[14px] max-[1024px]:[&_h3]:mx-0 max-[1024px]:[&_p]:text-[12px]",
    "max-[1024px]:[&_p]:mx-0 max-[768px]:grid-cols-[1fr] max-[768px]:gap-6.25 max-[768px]:[&_h3]:text-[15px]",
    "max-[768px]:[&_h3]:mt-3 max-[768px]:[&_h3]:mb-2 max-[768px]:[&_h3]:mx-0 max-[768px]:[&_p]:text-[13px]",
    "max-[768px]:[&_p]:mt-0 max-[768px]:[&_p]:mb-2.5 max-[768px]:[&_p]:mx-0",
  ].join(" "),
  promotion_visual_promotion_visual_setup_promotion_visual_studio: [
    motion.media,
    "flex relative items-center h-43.75 isolate",
    "bg-[radial-gradient(ellipse_at_80%_20%,_#317c76,_transparent_70%),_linear-gradient(130deg,_#031e2d,_#006653)]",
    "bg-transparent text-white p-4.5 rounded-[3px] overflow-hidden [&_span]:block [&_span]:text-[10px] [&_span]:font-bold",
    "[&_strong]:block [&_strong]:text-[31px] [&_strong]:font-black [&_strong]:text-[#d0f8a3] [&_strong]:leading-[1.1]",
    "[&_strong]:tracking-[-1.5px] [&_strong]:mx-0 [&_strong]:my-2 [&_small]:text-[9px] [&_small]:px-1.5 [&_small]:py-1",
    "[&_small]:border-[#7bbaa7] [&_small]:border-solid [&_small]:border [&>svg]:absolute [&>svg]:right-2.5",
    "[&>svg]:bottom-2.5 [&>svg]:text-[#acf0c5] [&>svg]:z-1 max-[1024px]:h-36.25 max-[1024px]:p-3",
    "max-[1024px]:[&_strong]:text-[23px] max-[1024px]:[&_span]:text-[8px] max-[1024px]:[&_small]:text-[7px]",
    "max-[768px]:h-42.5 max-[768px]:p-5 max-[768px]:[&_strong]:text-[33px] max-[768px]:[&_span]:text-[10px]",
    "max-[768px]:[&_small]:text-[9px] min-[1024px]:[&_strong]:text-[29px] [&>div:first-child]:z-1",
    "[&>div:first-child]:relative [&>div:first-child]:w-[62%] min-[1024px]:[&>div:first-child]:w-[65%]",
    "[&.rf-promotion-visual-setup]:bg-[linear-gradient(120deg,_#0b2945,_#185f7c)]",
    "[&.rf-promotion-visual-studio]:bg-[linear-gradient(130deg,_#041c2c,_#194932)]",
  ].join(" "),
  promotion_product: [
    "rf-promotion-product absolute right-[-25px] w-[53%] h-37.5 top-3.75 bg-white bg-none [transform:rotate(-10deg)]",
    "rounded-full [&_img]:object-contain [&_img]:mix-blend-multiply [&_img]:p-4.5 min-[1024px]:w-[42%]",
    "min-[1024px]:right-[-12px]",
  ].join(" "),
  promotion_more: [
    "rf-promotion-more flex items-center justify-end text-rf-green text-[14px] mt-auto mb-3.75 mx-2.5 gap-1",
    "max-[768px]:text-[12px] max-[768px]:mt-0 max-[768px]:mb-1.25 max-[768px]:mx-0",
  ].join(" "),
};

const promotions = [
  {
    id: "welcome",
    eyebrow: "ƯU ĐÃI CHÀO BẠN MỚI",
    offer: "GIẢM 5%",
    caption: "MÃ RIGFORGE5",
    title: "MỞ CẤU HÌNH MỚI, NHẬN ƯU ĐÃI CÙNG RIGFORGE",
    description:
      "Khám phá linh kiện, chọn chiếc PC phù hợp và thử áp dụng mã ưu đãi cho đơn hàng của bạn.",
    category: "pc",
    href: "/promotions",
    icon: Gift,
  },
  {
    id: "setup",
    eyebrow: "HOÀN THIỆN GÓC MÁY",
    offer: "BUILD CHẤT",
    caption: "CHỌN THEO CÁCH BẠN",
    title: "NÂNG CẤP MÀN HÌNH, THÊM CẢM HỨNG MỖI NGÀY",
    description:
      "Một góc nhìn mới cho công việc và những trận đấu yêu thích. Chọn thiết bị theo nhu cầu, phong cách và ngân sách.",
    category: "monitor",
    href: "/products?category=monitor",
    icon: CreditCard,
  },
  {
    id: "studio",
    eyebrow: "PC STUDIO 3D",
    offer: "TỰ RÁP PC",
    caption: "FORGE YOUR OWN POWER",
    title: "TỪ LINH KIỆN RỜI ĐẾN CẤU HÌNH MANG CHẤT RIÊNG",
    description:
      "Trải nghiệm chọn linh kiện, kiểm tra tương thích mẫu và hình dung chiếc máy của riêng bạn trong không gian 3D.",
    category: "gpu",
    href: "/pc-builder",
    icon: MonitorCog,
  },
];
export function PromotionsOverview() {
  const { products } = useCatalog();

  return (
    <section className={tw.reference_promotions}>
      <div className={tw.reference_section_label}>
        <h2>TỔNG HỢP KHUYẾN MÃI</h2>
        <Link href="/promotions">
          XEM TẤT CẢ <ArrowRight size={13} />
        </Link>
      </div>
      <div className={tw.promotion_grid}>
        {promotions.map(
          ({
            id,
            eyebrow,
            offer,
            caption,
            title,
            description,
            category,
            href,
            icon: Icon,
          }) => {
            const image = products.find(
              (item) =>
                item.category === category && item.id.startsWith("demo-"),
            )?.image;
            return (
              <article key={id}>
                <Link
                  href={href}
                  className={
                    `rf-promotion-visual rf-promotion-visual-${id}` +
                    " " +
                    tw.promotion_visual_promotion_visual_setup_promotion_visual_studio
                  }
                >
                  <div>
                    <span>{eyebrow}</span>
                    <strong>{offer}</strong>
                    <small>{caption}</small>
                  </div>
                  {image && (
                    <div className={tw.promotion_product}>
                      <Image src={image} alt="" fill sizes="180px" />
                    </div>
                  )}
                  <Icon size={30} />
                </Link>
                <h3>
                  <Link href={href}>{title}</Link>
                </h3>
                <p>{description}</p>
                <Link className={tw.promotion_more} href={href}>
                  Xem thêm <ArrowRight size={12} />
                </Link>
              </article>
            );
          },
        )}
      </div>
    </section>
  );
}
