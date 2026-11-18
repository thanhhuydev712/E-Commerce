"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  Scale,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useShop } from "@/src/providers/shop-provider";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  mobile_nav: [
    "rf-mobile-nav hidden max-[768px]:grid max-[768px]:grid-cols-[repeat(4,_1fr)] max-[768px]:fixed max-[768px]:bottom-0",
    "max-[768px]:left-0 max-[768px]:right-0 max-[768px]:z-45 max-[768px]:pt-2.5",
    "max-[768px]:pb-[calc(10px_+_env(safe-area-inset-bottom))] max-[768px]:bg-[#fffcf7f5] max-[768px]:bg-none",
    "max-[768px]:[backdrop-filter:blur(15px)] max-[768px]:border-t max-[768px]:[border-top-style:solid]",
    "max-[768px]:border-t-rf-border max-[768px]:px-2.5 max-[768px]:[&_a]:flex max-[768px]:[&_a]:items-center",
    "max-[768px]:[&_a]:flex-col max-[768px]:[&_a]:text-rf-caption max-[768px]:[&_a]:text-rf-muted max-[768px]:[&_a]:gap-0.75",
    "[&_a]:rounded-lg [&_a]:py-1 [&_a[aria-current=page]]:bg-rf-accent-soft [&_a[aria-current=page]]:text-rf-accent [&_a[aria-current=page]]:font-semibold",
    "print:hidden!",
  ].join(" "),
  compare_float: [
    "rf-compare-float fixed bottom-6 right-6.25 flex items-center bg-rf-accent bg-none text-white text-rf-small hover:bg-rf-accent-hover",
    "shadow-[0_6px_20px_#60351f26] z-30 px-4.5 py-3 rounded-[30px] gap-2.25 max-[768px]:bottom-20 max-[768px]:right-4",
    "max-[768px]:text-rf-caption max-[768px]:px-3.25 max-[768px]:py-2.25 print:hidden!",
  ].join(" "),
};

/** Chỉ vùng số lượng so sánh cần đọc state; footer còn lại vẫn render ở server. */
export function StoreQuickNav() {
  const { compare } = useShop();
  const pathname = usePathname();
  const isWishlist = pathname === "/account/wishlist";
  return (
    <>
      <nav className={tw.mobile_nav} aria-label="Điều hướng nhanh">
        <Link
          href="/products"
          aria-current={
            pathname === "/products" || pathname.startsWith("/products/")
              ? "page"
              : undefined
          }
        >
          <Search size={20} />
          Sản phẩm
        </Link>
        <Link
          href="/pc-builder"
          aria-current={pathname === "/pc-builder" ? "page" : undefined}
        >
          <SlidersHorizontal size={20} />
          Ráp PC
        </Link>
        <Link
          href="/account/wishlist"
          aria-current={isWishlist ? "page" : undefined}
        >
          <Heart size={20} />
          Yêu thích
        </Link>
        <Link
          href="/account"
          aria-current={
            !isWishlist &&
            (pathname === "/account" || pathname.startsWith("/account/"))
              ? "page"
              : undefined
          }
        >
          <UserRound size={20} />
          Tài khoản
        </Link>
      </nav>
      {compare.length > 0 && (
        <Link className={tw.compare_float} href="/compare">
          <Scale size={18} />
          So sánh ({compare.length})
        </Link>
      )}
    </>
  );
}
