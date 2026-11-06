"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { CalendarDays, Clock3, Flame, Sparkles } from "lucide-react";

import { ProductRail } from "./product-rail";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_flash: [
    "rf-reference-flash shadow-[0_10px_30px_#10574020] mt-8.5 mb-9.5 bg-[#e3f3eb] bg-none mx-0 rounded-[16px]",
    "overflow-hidden max-[768px]:mt-5.5 max-[768px]:mb-7 max-[768px]:mx-0 max-[768px]:rounded-[10px]",
  ].join(" "),
  flash_masthead: [
    "rf-flash-masthead flex items-center",
    "bg-[repeating-linear-gradient(_90deg,_#0d2935_0,_#0d2935_25px,_#102f3e_25px,_#102f3e_50px_)] bg-transparent",
    "text-[#c0f3d4] rounded-tl-[16px] rounded-tr-[16px] rounded-br-[0] rounded-bl-[0] min-h-15.5 px-5 py-3.25 gap-4.5",
    "[&_h2]:flex [&_h2]:items-center [&_h2]:mr-auto [&_h2]:ml-0 [&_h2]:text-[19px] [&_h2]:font-black [&_h2]:italic",
    "[&_h2]:my-0 [&_h2]:gap-1.5 [&>span]:text-[8px] [&>span]:text-center [&_b]:block [&_b]:text-[17px]",
    "[&_b]:text-[#143a35] [&_b]:bg-[#a2e6b8] [&_b]:bg-none [&_b]:px-2.25 [&_b]:py-0.75 [&_b]:rounded-[3px]",
    "[&_small]:text-[9px] [&_small]:leading-[1.8] [&_small]:border-l [&_small]:[border-left-style:solid]",
    "[&_small]:border-l-[#a5d9bf44] [&_small]:pl-4.25 [&_small]:text-[#cae1d8] max-[1024px]:gap-2.5",
    "max-[1024px]:[&_h2]:text-[15px] max-[1024px]:[&_small]:hidden max-[768px]:min-h-12 max-[768px]:p-2.75",
    "max-[768px]:[&_h2]:text-[12px] max-[768px]:[&_h2_svg]:hidden max-[768px]:[&>span]:hidden",
  ].join(" "),
  flash_date: [
    "rf-flash-date flex flex-col items-center justify-center min-h-22 text-white",
    "bg-[linear-gradient(110deg,_#008d6a,_#0b3544)] bg-transparent shadow-[0_5px_10px_#055c3926] m-3 rounded-[12px]",
    "[&_small]:text-[11px] [&_small]:mb-1.25 [&_strong]:flex [&_strong]:items-center [&_strong]:text-[22px]",
    "[&_strong]:gap-2 max-[768px]:min-h-17.5 max-[768px]:m-2 max-[768px]:[&_strong]:text-[18px]",
    "max-[768px]:[&_small]:text-[9px]",
  ].join(" "),
  flash_time: [
    "rf-flash-time flex justify-center items-center min-h-17.5 bg-white bg-none border-b-4 [border-bottom-style:solid]",
    "border-b-[#0d9775] text-[#068060] text-[16px] font-bold gap-1.5 [&>span]:text-[11px] [&>span]:font-normal",
    "[&>span]:text-[#719086] max-[768px]:min-h-12.5 max-[768px]:text-[13px] max-[768px]:[&>span]:text-[9px]",
  ].join(" "),
  flash_footer: [
    "rf-flash-footer flex justify-between items-center bg-[linear-gradient(110deg,_#b2e4c5,_#51b992)] bg-transparent",
    "px-6.25 py-4.5 [&>div>strong]:flex [&>div>strong]:items-center [&>div>strong]:justify-center",
    "[&>div>strong]:text-[13px] [&>div>strong]:text-[#164937] [&>div>strong]:mb-1.25 [&>div>strong]:gap-1.25",
    "[&>a]:bg-[#ffffff30] [&>a]:bg-none [&>a]:text-[#143d2e] [&>a]:text-[13px] [&>a]:font-bold",
    "[&>a]:shadow-[0_4px_7px_#105b2d13] [&>a]:px-5 [&>a]:py-2.5 [&>a]:border-[#ffffff90] [&>a]:border-solid [&>a]:border",
    "[&>a]:rounded-[8px] max-[768px]:px-2.75 max-[768px]:py-3.25 max-[768px]:gap-2 max-[768px]:[&>div>strong]:text-[9px]",
    "max-[768px]:[&>a]:text-[10px] max-[768px]:[&>a]:px-2.5 max-[768px]:[&>a]:py-2",
  ].join(" "),
  countdown: [
    "rf-countdown flex gap-1.75 [&>span]:flex [&>span]:flex-col [&>span]:items-center [&>span]:min-w-14.5",
    "[&>span]:bg-white [&>span]:bg-none [&>span]:text-[#165c46] [&>span]:text-[11px] [&>span]:leading-[1.2]",
    "[&>span]:px-3.25 [&>span]:py-1.25 [&>span]:rounded-[8px] [&_b]:text-[17px] max-[768px]:gap-1",
    "max-[768px]:[&>span]:min-w-9 max-[768px]:[&>span]:text-[8px] max-[768px]:[&>span]:px-1.75 max-[768px]:[&>span]:py-1",
    "max-[768px]:[&>span]:rounded-[5px] max-[768px]:[&_b]:text-[13px]",
  ].join(" "),
};

export function FlashSaleSection() {
  const { featuredDeals } = useCatalog().presentation;
  const flashProducts = featuredDeals.slice(0, 6);
  const stock = flashProducts.reduce((sum, product) => sum + product.stock, 0);
  return (
    <section className={tw.reference_flash} aria-labelledby="flash-title">
      <div className={tw.flash_masthead}>
        <h2 id="flash-title">
          <Sparkles size={22} />
          GIÁ THẬT TỐT · BUILD THẬT CHẤT
        </h2>
        <span>
          GIÁ TỐT <b>MỖI NGÀY</b>
        </span>
        <span>
          ƯU ĐÃI <b>ĐỘC QUYỀN</b>
        </span>
        <small>
          TRẢI NGHIỆM ONLINE
          <br />
          Dữ liệu và giá minh họa
        </small>
      </div>
      <div className={tw.flash_date}>
        <small>RIGFORGE FLASH DEAL</small>
        <strong>
          <CalendarDays size={21} />
          Phiên ưu đãi nổi bật
        </strong>
      </div>
      <div className={tw.flash_time}>
        <Clock3 size={19} />
        Giá và tồn từ cửa hàng
      </div>
      <div className="rf-flash-products bg-[linear-gradient(#e9f5ed,_#dbefe4)] bg-transparent p-3 max-[768px]:p-2">
        <ProductRail products={flashProducts} variant="flash" />
      </div>
      <div className={tw.flash_footer}>
        <div>
          <strong>
            <Flame size={16} />
            Tồn khả dụng của nhóm nổi bật
          </strong>
          <div className={tw.countdown}>
            <span>
              <b>{stock}</b>sản phẩm
            </span>
          </div>
        </div>
        <Link href="/promotions">Xem tất cả</Link>
      </div>
    </section>
  );
}
