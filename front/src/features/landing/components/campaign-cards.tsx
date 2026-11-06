import Link from "next/link";
import { ArrowUpRight, Cpu } from "lucide-react";
import { ProductArt } from "@/src/components/storefront";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  side_promos: [
    "rf-side-promos grid grid-rows-[1.1fr_1fr] gap-3.5 [&>a]:block [&>a]:relative [&>a]:min-h-47.5 [&>a]:px-5.25",
    "[&>a]:py-5.75 [&>a]:rounded-[9px] [&>a]:overflow-hidden [&_h2]:text-[23px] [&_h2]:leading-[1.25]",
    "[&_h2]:tracking-[-0.6px] [&_h2]:mt-3.75 [&_h2]:mb-2 [&_h2]:relative [&_h2]:z-1 [&_h2]:mx-0 [&_p]:text-[10px]",
    "[&_p]:text-[#6d8069] [&_p]:relative [&_p]:z-1 [&_strong]:flex [&_strong]:items-center [&_strong]:text-[10px]",
    "[&_strong]:text-[#2e583a] [&_strong]:absolute [&_strong]:bottom-5.25 [&_strong]:z-1 [&_strong]:gap-3.25",
    "max-[1200px]:col-span-full max-[1200px]:grid-cols-[1fr_1fr] max-[1200px]:grid-rows-[auto]",
    "max-[1200px]:[&>a]:min-h-41.25 max-[1200px]:[&_h2_br]:hidden max-[1200px]:[&_strong]:bottom-5.5 max-[768px]:gap-2.5",
    "max-[768px]:[&>a]:min-h-45 max-[768px]:[&>a]:px-3.5 max-[768px]:[&>a]:py-4.25 max-[768px]:[&_h2]:text-[18px]",
    "max-[768px]:[&_h2]:leading-[1.3] max-[768px]:[&_h2]:mt-3 max-[768px]:[&_h2_br]:block max-[768px]:[&_p]:text-[8px]",
    "max-[768px]:[&_p]:max-w-23.75 max-[768px]:[&_strong]:bottom-3.75 max-[768px]:[&_strong]:text-[9px]",
    "max-[768px]:[&_strong]:gap-1.75 max-[1200px]:[&_.rf-gear-promo>.rf-component-art]:w-50",
    "max-[1200px]:[&_.rf-gear-promo>.rf-component-art]:h-40",
    "max-[1200px]:[&_.rf-gear-promo>.rf-component-art]:bottom-[-20px]",
    "max-[1200px]:[&_.rf-gear-promo>.rf-component-art]:right-1.25 max-[1200px]:[&_.rf-gear-promo>.rf-product-art]:w-50",
    "max-[1200px]:[&_.rf-gear-promo>.rf-product-art]:h-40 max-[1200px]:[&_.rf-gear-promo>.rf-product-art]:bottom-[-20px]",
    "max-[1200px]:[&_.rf-gear-promo>.rf-product-art]:right-1.25 max-[768px]:[&_.rf-gear-promo>.rf-component-art]:w-25",
    "max-[768px]:[&_.rf-gear-promo>.rf-component-art]:right-[-10px]",
    "max-[768px]:[&_.rf-gear-promo>.rf-component-art]:bottom-2 max-[768px]:[&_.rf-gear-promo>.rf-component-art]:h-20",
    "max-[768px]:[&_.rf-gear-promo>.rf-component-art]:opacity-[0.22] max-[768px]:[&_.rf-gear-promo>.rf-product-art]:w-25",
    "max-[768px]:[&_.rf-gear-promo>.rf-product-art]:right-[-10px] max-[768px]:[&_.rf-gear-promo>.rf-product-art]:bottom-2",
    "max-[768px]:[&_.rf-gear-promo>.rf-product-art]:h-20 max-[768px]:[&_.rf-gear-promo>.rf-product-art]:opacity-[0.22]",
  ].join(" "),
  mini_label: [
    "rf-mini-label flex items-center text-[8px] font-bold tracking-[1px] text-[#466143] gap-1.75 [&>span]:text-[7px]",
    "[&>span]:bg-[#20633b] [&>span]:bg-none [&>span]:text-white [&>span]:px-0.75 [&>span]:py-0.25 [&>span]:rounded-[2px]",
    "max-[768px]:text-[6px] max-[768px]:tracking-[0.6px] max-[768px]:gap-0.75 max-[768px]:[&>span]:text-[6px]",
  ].join(" "),
  promo_board: [
    "rf-promo-board absolute bottom-2.75 right-[-8px] w-22.5 h-22.5 [transform:rotate(-20deg)] text-[#71966b]",
    "opacity-[0.35] [&>span]:block [&>span]:absolute [&>span]:h-18.75 [&>span]:w-1 [&>span]:bg-[#a4bd95] [&>span]:bg-none",
    "[&>span]:left-17 [&>span]:top-[-4px] [&>span]:shadow-[8px_0_#a4bd95,_16px_0_#a4bd95] max-[768px]:right-[-30px]",
    "max-[768px]:bottom-5.5",
  ].join(" "),
  gear_promo: [
    "rf-gear-promo bg-[#eee8df] bg-none border-[#e5ded4] border-solid border [&_strong]:text-[#6c5940]",
    "[&_.rf-mini-label]:text-[#8a785f] [&>.rf-component-art]:absolute [&>.rf-component-art]:right-[-32px]",
    "[&>.rf-component-art]:bottom-[-1px] [&>.rf-component-art]:w-33.75 [&>.rf-component-art]:h-31.25",
    "[&>.rf-component-art]:min-h-0 [&>.rf-component-art]:[transform:rotate(-14deg)] [&>.rf-component-art]:bg-transparent",
    "[&>.rf-component-art]:bg-none [&>.rf-component-art]:text-[#8a7b60] [&>.rf-component-art]:opacity-[0.35]",
    "[&>.rf-product-art]:absolute [&>.rf-product-art]:right-[-32px] [&>.rf-product-art]:bottom-[-1px]",
    "[&>.rf-product-art]:w-33.75 [&>.rf-product-art]:h-31.25 [&>.rf-product-art]:min-h-0",
    "[&>.rf-product-art]:[transform:rotate(-14deg)] [&>.rf-product-art]:bg-transparent [&>.rf-product-art]:bg-none",
    "[&>.rf-product-art]:text-[#8a7b60] [&>.rf-product-art]:opacity-[0.35] [&>.rf-component-art_span]:hidden",
  ].join(" "),
};

/** Hai lối vào phụ có URL thật; không trỏ mọi banner về trang chủ. */
export function CampaignCards() {
  return (
    <aside className={tw.side_promos}>
      <Link
        href="/pc-builder"
        className="rf-builder-promo bg-[#e3eee1] bg-none border-[#d8e3d7] border-solid border"
      >
        <span className={tw.mini_label}>
          RIGFORGE PC STUDIO <span>3D</span>
        </span>
        <h2>
          Chiếc PC của bạn.
          <br />
          Do bạn kiến tạo.
        </h2>
        <p>Chọn linh kiện. Xem máy thành hình.</p>
        <div className={tw.promo_board} aria-hidden="true">
          <Cpu size={56} strokeWidth={1} />
          <span />
          <span />
          <span />
        </div>
        <strong>
          Bắt đầu ráp PC <ArrowUpRight size={17} />
        </strong>
      </Link>
      <Link href="/products?category=gear" className={tw.gear_promo}>
        <span className={tw.mini_label}>UPGRADE YOUR SETUP</span>
        <h2>
          Gear mới.
          <br />
          Cảm hứng mới.
        </h2>
        <ProductArt category="gear" />
        <strong>
          Khám phá ngay <ArrowUpRight size={16} />
        </strong>
      </Link>
    </aside>
  );
}
