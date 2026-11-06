import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductArt } from "@/src/components/storefront";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  studio_banner: [
    "rf-studio-banner relative isolate mt-11",
    "bg-[radial-gradient(_ellipse_at_88%_45%,_#315b45,_#153b2b_45%,_#102c22_80%_)] bg-transparent text-[#e6f1e9] px-11",
    "py-10 rounded-[12px] overflow-hidden [&>div]:relative [&>div]:z-2 [&_h2]:text-[31px] [&_h2]:leading-[1.3]",
    "[&_h2]:tracking-[-0.8px] [&_h2]:mx-0 [&_h2]:my-3.5 [&_h2_em]:text-[#b7edc9] [&_p]:text-[#a1bba9] [&_p]:text-[11px]",
    "[&_p]:leading-[1.9] [&_p]:mb-6 max-[1024px]:[&_h2]:text-[28px] max-[768px]:min-h-82.5 max-[768px]:mt-8",
    "max-[768px]:px-5.5 max-[768px]:py-7 max-[768px]:[&_h2]:text-[23px] max-[768px]:[&_p]:text-[10px]",
    "max-[768px]:[&_p]:max-w-55 [&_.rf-eyebrow]:text-[#9bcca9] [&_.rf-eyebrow]:text-[9px] [&>.rf-product-art]:absolute",
    "[&>.rf-product-art]:w-95 [&>.rf-product-art]:h-85 [&>.rf-product-art]:right-15 [&>.rf-product-art]:top-[-10px]",
    "[&>.rf-product-art]:z-1 [&>.rf-product-art]:[transform:rotate(-7deg)]",
    "[&>.rf-product-art]:[filter:drop-shadow(0_20px_20px_#0004)] max-[1200px]:[&>.rf-product-art]:right-0",
    "max-[1200px]:[&>.rf-product-art]:opacity-[0.85] max-[1024px]:[&>.rf-product-art]:w-75",
    "max-[1024px]:[&>.rf-product-art]:right-[-28px] max-[1024px]:[&>.rf-product-art]:top-7.5",
    "max-[1024px]:[&>.rf-product-art]:opacity-[0.6] max-[768px]:[&_.rf-eyebrow]:text-[7px]",
    "max-[768px]:[&>.rf-product-art]:w-57.5 max-[768px]:[&>.rf-product-art]:top-auto",
    "max-[768px]:[&>.rf-product-art]:bottom-[-40px] max-[768px]:[&>.rf-product-art]:right-[-68px]",
    "max-[768px]:[&>.rf-product-art]:h-62.5 max-[768px]:[&>.rf-product-art]:opacity-[0.4]",
    "max-[768px]:[&_.rf-btn]:text-[10px] max-[768px]:[&_.rf-btn]:px-3.25 max-[768px]:[&_.rf-btn]:py-2.5",
  ].join(" "),
  btn_btn_light: [
    "rf-btn rf-btn-light inline-flex items-center justify-center min-h-11 bg-[#d1f6dd] bg-none text-[#183c2b] text-[12px]",
    "font-bold leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-transparent border-solid",
    "border rounded-[6px] gap-2.5 print:hidden hover:bg-[#a7e9c4] hover:bg-none",
  ].join(" "),
  studio_watermark: [
    "rf-studio-watermark absolute right-[-8px] bottom-[-26px] text-[90px] font-extrabold tracking-[-5px] text-[#c0e0ce09]",
    "max-[768px]:text-[53px] max-[768px]:bottom-[-12px] max-[768px]:right-0 max-[768px]:tracking-[-2px]",
  ].join(" "),
};

/** Chỉ dùng SVG ở landing; bundle Three.js được tải khi người dùng mở Studio. */
export function StudioBanner() {
  return (
    <section className={tw.studio_banner}>
      <div>
        <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
          FROM PARTS TO POSSIBILITY
        </span>
        <h2>
          Đừng chỉ chọn một chiếc PC.
          <br />
          <em>Hãy tự tạo nên nó.</em>
        </h2>
        <p>
          Một không gian để chọn, thử và hình dung cấu hình của riêng bạn.
          <br />
          Khám phá PC Studio với trải nghiệm lắp ráp 3D.
        </p>
        <Link href="/pc-builder" className={tw.btn_btn_light}>
          Bước vào PC Studio <ArrowRight size={17} />
        </Link>
      </div>
      <ProductArt category="pc" />
      <span className={tw.studio_watermark} aria-hidden="true">
        PC STUDIO
      </span>
    </section>
  );
}
