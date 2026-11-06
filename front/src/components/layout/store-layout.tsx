import { Suspense, type ReactNode } from "react";
import { StoreHeader } from "./store-header";
import { StoreFooter } from "./store-footer";
import { StoreQuickNav } from "./store-quick-nav";
import { ShowroomSection } from "@/src/features/landing/components/showroom-section";
import Link from "next/link";
import { BrandLogo } from "@/src/components/storefront";
import { StoreRouteMarker } from "./store-route-marker";
import { motion } from "@/src/components/ui/motion";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  minisite_header: [
    "rf-minisite-header hidden bg-white bg-none [&>div]:min-h-18.75 [&>div]:flex [&>div]:items-center",
    "[&>div]:justify-between [&>div]:gap-7 [&_nav]:flex [&_nav]:items-center [&_nav]:justify-around [&_nav]:flex-1",
    "[&_nav]:text-[17px] [&_nav]:font-[750] [&_nav]:gap-7.5 [&>div>span]:text-rf-green [&>div>span]:text-[12px]",
    "[&>div>span]:px-5 [&>div>span]:py-2.25 [&>div>span]:border-rf-green [&>div>span]:border-solid [&>div>span]:border-2",
    "[&>div>span]:rounded-[25px] max-[768px]:[&>div]:flex-wrap max-[768px]:[&>div]:justify-center",
    "max-[768px]:[&>div]:py-3 max-[768px]:[&>div]:gap-2.5 max-[768px]:[&_nav]:order-2 max-[768px]:[&_nav]:basis-full",
    "max-[768px]:[&_nav]:text-[13px] max-[768px]:[&_nav]:gap-3 max-[768px]:[&>div>span]:hidden [&_.rf-logo]:w-32.5",
    "[&_.rf-logo_img]:w-32.5 [&_.rf-logo>span]:hidden",
  ].join(" "),
};

/** Layout chỉ ghép các vùng dùng chung; state riêng nằm trong từng feature. */
export function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={
        "rf-app [--rf-content:calc(var(--rf-home-width)+var(--rf-content-gutter)*2)] [--rf-content-gutter:16px] min-[1024px]:[--rf-content-gutter:64px] " +
        motion.controls
      }
    >
      <Suspense fallback={<span hidden className="rf-route-marker" />}>
        <StoreRouteMarker />
      </Suspense>
      {/* Header đọc pathname để đánh dấu menu hiện tại; Next cacheComponents cần boundary. */}
      <Suspense
        fallback={
          <div
            className="rf-header-skeleton min-h-35 bg-white bg-none border-b [border-bottom-style:solid] border-b-rf-border"
            aria-hidden="true"
          />
        }
      >
        <StoreHeader />
      </Suspense>
      <div className={tw.minisite_header}>
        <div className="rf-container max-w-[var(--rf-content)] w-full px-[var(--rf-content-gutter)] mx-auto max-[768px]:px-4 print:p-0">
          <BrandLogo />
          <nav aria-label="Điều hướng chiến dịch">
            <Link href="/">Trang chủ</Link>
            <Link href="/promotions">Khuyến mãi</Link>
            <Link href="/support">Liên hệ</Link>
            <Link href="/pages/installments">Trả góp</Link>
          </nav>
          <span>RIGFORGE · BẢN TRẢI NGHIỆM</span>
        </div>
      </div>
      <main
        id="main-content"
        className="rf-container rf-main max-w-[var(--rf-content)] w-full min-h-[55vh] pb-13 px-[var(--rf-content-gutter)] mx-auto max-[768px]:pb-8 max-[768px]:px-4 print:p-0"
      >
        {children}
      </main>
      {/* Clip nền showroom 100vw trong bề rộng trang, kể cả khi scrollbar chiếm chỗ. */}
      <div className="overflow-x-clip">
        <div className="rf-container rf-common-showrooms max-w-[var(--rf-content)] w-full mt-8.75 px-[var(--rf-content-gutter)] mx-auto max-[768px]:px-4 print:p-0">
          <ShowroomSection />
        </div>
      </div>
      <StoreFooter />
      <StoreQuickNav />
    </div>
  );
}
