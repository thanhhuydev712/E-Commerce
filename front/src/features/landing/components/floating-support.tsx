"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Headphones, MessageCircle } from "lucide-react";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  floating_consult: [
    "rf-floating-consult fixed z-35 bottom-5 left-4 flex items-center bg-[#081f2b] bg-none text-white pr-3.75 pl-1.75",
    "shadow-[0_4px_14px_#102e3925] py-1.75 rounded-[35px] gap-1.75 [&>span]:grid [&>span]:place-items-center",
    "[&>span]:w-10.75 [&>span]:h-10.75 [&>span]:bg-[#0a8b65] [&>span]:bg-none [&>span]:text-[#bdf1b5]",
    "[&>span]:rounded-full [&>div]:flex [&>div]:flex-col [&>div]:text-[9px] [&>div]:gap-0.75 [&_strong]:text-[11px]",
    "max-[768px]:hidden",
  ].join(" "),
  side_ad_side_ad_left: [
    "pointer-events-none [&>a]:pointer-events-auto",
    "rf-side-ad rf-side-ad-left hidden min-[1024px]:block min-[1024px]:fixed min-[1024px]:top-45",
    "min-[1024px]:w-27.5 min-[1024px]:max-w-27.5 min-[1024px]:z-20",
    "min-[1024px]:left-0 min-[1024px]:rounded-[6px] min-[1024px]:overflow-hidden",
    "min-[1024px]:[&>a]:-translate-x-1/2 min-[1024px]:[&>a]:transition-transform min-[1024px]:[&>a]:duration-300",
    "min-[1024px]:hover:[&>a]:translate-x-0 min-[1024px]:focus-within:[&>a]:translate-x-0 motion-reduce:[&>a]:transition-none",
    "min-[1024px]:[&>a]:flex min-[1024px]:[&>a]:items-center min-[1024px]:[&>a]:flex-col min-[1024px]:[&>a]:text-center",
    "min-[1024px]:[&>a]:text-[#d6f4b3] min-[1024px]:[&>a]:bg-[linear-gradient(#061e33,_#075145,_#091c2b)]",
    "min-[1024px]:[&>a]:bg-transparent min-[1024px]:[&>a]:min-h-112.5 min-[1024px]:[&>a]:px-1 min-[1024px]:[&>a]:py-5",
    "min-[1024px]:[&_small]:text-[9px] min-[1024px]:[&_small]:font-black min-[1024px]:[&_b]:text-[23px]",
    "min-[1024px]:[&_b]:leading-[1.15] min-[1024px]:[&_b]:mx-0 min-[1024px]:[&_b]:my-4.5",
    "min-[1024px]:[&_span]:text-[11px] min-[1024px]:[&_span]:font-extrabold min-[1024px]:[&_span]:text-white",
    "min-[1024px]:[&_a>div]:relative min-[1024px]:[&_a>div]:w-20 min-[1024px]:[&_a>div]:h-27.5",
    "min-[1024px]:[&_a>div]:bg-white min-[1024px]:[&_a>div]:bg-none min-[1024px]:[&_a>div]:mx-0",
    "min-[1024px]:[&_a>div]:my-3.75 min-[1024px]:[&_a>div]:rounded-[10px] min-[1024px]:[&_img]:object-contain",
    "min-[1024px]:[&_strong]:text-[#092b35] min-[1024px]:[&_strong]:bg-[#bfe49d] min-[1024px]:[&_strong]:bg-none",
    "min-[1024px]:[&_strong]:text-[17px] min-[1024px]:[&_strong]:leading-[1.2] min-[1024px]:[&_strong]:px-3",
    "min-[1024px]:[&_strong]:py-2 min-[1024px]:[&_strong]:rounded-[10px]",
  ].join(" "),
  side_ad_side_ad_right: [
    "pointer-events-none [&>a]:pointer-events-auto",
    "rf-side-ad rf-side-ad-right hidden min-[1024px]:block min-[1024px]:fixed min-[1024px]:top-45",
    "min-[1024px]:w-27.5 min-[1024px]:max-w-27.5 min-[1024px]:z-20",
    "min-[1024px]:right-0 min-[1024px]:rounded-[6px] min-[1024px]:overflow-hidden",
    "min-[1024px]:[&>a]:translate-x-1/2 min-[1024px]:[&>a]:transition-transform min-[1024px]:[&>a]:duration-300",
    "min-[1024px]:hover:[&>a]:translate-x-0 min-[1024px]:focus-within:[&>a]:translate-x-0 motion-reduce:[&>a]:transition-none",
    "min-[1024px]:[&>a]:flex min-[1024px]:[&>a]:items-center min-[1024px]:[&>a]:flex-col min-[1024px]:[&>a]:text-center",
    "min-[1024px]:[&>a]:text-[#d6f4b3] min-[1024px]:[&>a]:bg-[linear-gradient(#061e33,_#075145,_#091c2b)]",
    "min-[1024px]:[&>a]:bg-transparent min-[1024px]:[&>a]:min-h-112.5 min-[1024px]:[&>a]:px-1 min-[1024px]:[&>a]:py-5",
    "min-[1024px]:[&_small]:text-[9px] min-[1024px]:[&_small]:font-black min-[1024px]:[&_b]:text-[23px]",
    "min-[1024px]:[&_b]:leading-[1.15] min-[1024px]:[&_b]:mx-0 min-[1024px]:[&_b]:my-4.5",
    "min-[1024px]:[&_span]:text-[11px] min-[1024px]:[&_span]:font-extrabold min-[1024px]:[&_span]:text-white",
    "min-[1024px]:[&_a>div]:relative min-[1024px]:[&_a>div]:w-20 min-[1024px]:[&_a>div]:h-27.5",
    "min-[1024px]:[&_a>div]:bg-white min-[1024px]:[&_a>div]:bg-none min-[1024px]:[&_a>div]:mx-0",
    "min-[1024px]:[&_a>div]:my-3.75 min-[1024px]:[&_a>div]:rounded-[10px] min-[1024px]:[&_img]:object-contain",
    "min-[1024px]:[&_strong]:text-[#092b35] min-[1024px]:[&_strong]:bg-[#bfe49d] min-[1024px]:[&_strong]:bg-none",
    "min-[1024px]:[&_strong]:text-[17px] min-[1024px]:[&_strong]:leading-[1.2] min-[1024px]:[&_strong]:px-3",
    "min-[1024px]:[&_strong]:py-2 min-[1024px]:[&_strong]:rounded-[10px]",
  ].join(" "),
  floating_tools: [
    "rf-floating-tools fixed right-3.5 bottom-5.5 z-35 flex flex-col gap-2.25 [&>*]:grid [&>*]:place-items-center",
    "[&>*]:w-10.75 [&>*]:h-10.75 [&>*]:bg-[#087d60] [&>*]:bg-none [&>*]:text-white [&>*]:shadow-[0_2px_10px_#17373c23]",
    "[&>*]:border-white [&>*]:border-solid [&>*]:border-3 [&>*]:rounded-full max-[768px]:bottom-20 max-[768px]:right-2",
    "max-[768px]:gap-1.75 max-[768px]:[&>*]:w-9 max-[768px]:[&>*]:h-9 max-[768px]:[&>*]:border-2",
    "max-[768px]:[&_svg]:w-4.25 [&>*:nth-child(2)]:bg-[#123743] [&>*:nth-child(2)]:bg-none [&>*:last-child]:bg-[#728a94]",
    "[&>*:last-child]:bg-none max-[768px]:[&>*:nth-child(2)]:hidden",
  ].join(" "),
};

export function FloatingSupport() {
  return (
    <>
      <Link href="/support" className={tw.floating_consult}>
        <span>
          <Headphones size={25} />
        </span>
        <div>
          TƯ VẤN CẤU HÌNH<strong>RIGFORGE HỖ TRỢ</strong>
        </div>
      </Link>
      <aside className={tw.side_ad_side_ad_left}>
        <Link href="/products?category=pc">
          <small>RIGFORGE</small>
          <b>
            PC
            <br />
            QUỐC
            <br />
            DÂN
          </b>
          <span>
            CHẤT GAME
            <br />
            GIÁ TỐT
          </span>
          <div>
            <Image src="/images/catalog/pc-1.webp" alt="" fill sizes="80px" />
          </div>
          <strong>
            BUILD
            <br />
            NGAY
          </strong>
        </Link>
      </aside>
      <aside className={tw.side_ad_side_ad_right}>
        <Link href="/products?category=laptop">
          <small>RIGFORGE</small>
          <b>
            LAPTOP
            <br />
            CHÍNH
            <br />
            HÃNG
          </b>
          <span>
            HỌC TẬP
            <br />
            LÀM VIỆC
          </span>
          <div>
            <Image
              src="/images/catalog/laptop-1.webp"
              alt=""
              fill
              sizes="80px"
            />
          </div>
          <strong>
            KHÁM
            <br />
            PHÁ
          </strong>
        </Link>
      </aside>
      <div className={tw.floating_tools}>
        <Link href="/support" aria-label="Trung tâm hỗ trợ">
          <Headphones size={21} />
        </Link>
        <Link href="/account/support/new" aria-label="Tạo yêu cầu hỗ trợ">
          <MessageCircle size={22} />
        </Link>
        <button
          aria-label="Về đầu trang"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
            })
          }
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </>
  );
}
