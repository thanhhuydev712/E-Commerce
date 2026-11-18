"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Gift,
  Headphones,
  Menu,
  MonitorCog,
  ShoppingCart,
  Store,
  UserRound,
  X,
} from "lucide-react";

import { BrandLogo, CategoryIcon } from "@/src/components/storefront";
import { useShop } from "@/src/providers/shop-provider";
import { StoreSearch } from "./store-search";
import { motion } from "@/src/components/ui/motion";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_utility: [
    "rf-reference-utility bg-rf-ink text-[#f6f3ed] [&_nav]:min-h-9 [&_a:hover]:text-rf-ember",
    "[&_nav]:flex [&_nav]:justify-center [&_nav]:items-center [&_nav]:gap-7 [&_a]:inline-flex [&_a]:items-center",
    "[&_a]:text-rf-caption [&_a]:gap-1.5 [&_a]:whitespace-nowrap max-[1024px]:[&_nav]:gap-4",
    "max-[768px]:[&_nav]:min-h-9 max-[768px]:[&_nav]:gap-4",
    "max-[768px]:[&_a:nth-child(2)]:hidden max-[768px]:[&_a:nth-child(3)]:hidden max-[768px]:[&_a:nth-child(5)]:hidden",
  ].join(" "),
  container_reference_header_main: [
    "rf-container rf-reference-header-main max-w-none w-full flex items-center min-h-24 px-[50px] mx-auto",
    "gap-5.5 max-[768px]:min-h-28.25 max-[768px]:grid max-[768px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
    "max-[768px]:px-4 max-[768px]:py-2.5 max-[768px]:gap-2.75",
    "print:p-0 max-[1024px]:min-h-22.5 max-[1024px]:gap-3.75 [&_.rf-logo]:w-35",
    "[&_.rf-menu-button]:w-auto",
    "[&_.rf-menu-button]:min-w-36.25 [&_.rf-menu-button]:h-11.75 [&_.rf-menu-button]:bg-rf-accent-soft [&_.rf-menu-button]:bg-none",
    "[&_.rf-menu-button]:text-rf-ink [&_.rf-menu-button]:shadow-[0_4px_12px_#60351f0a] [&_.rf-menu-button]:text-rf-small",
    "[&_.rf-menu-button.active]:bg-rf-accent [&_.rf-menu-button.active]:text-white",
    "[&_.rf-menu-button]:border-rf-border [&_.rf-menu-button]:border-solid [&_.rf-menu-button]:border",
    "[&_.rf-menu-button]:rounded-[12px] [&_.rf-menu-button]:gap-2.25 [&_.rf-search]:h-11.5 [&_.rf-search]:bg-white",
    "[&_.rf-search]:bg-none [&_.rf-search]:border-rf-border [&_.rf-search]:shadow-[0_2px_8px_#60351f08] [&_.rf-search]:p-0 [&_.rf-search]:rounded-[10px]",
    "[&_.rf-search]:overflow-hidden [&_.rf-search_input]:text-[16px] [&_.rf-search_input]:px-4.25",
    "[&_.rf-search_input]:py-3 [&_.rf-search_button]:flex [&_.rf-search_button]:items-center",
    "[&_.rf-search_button]:bg-rf-accent [&_.rf-search_button]:bg-none [&_.rf-search_button]:text-white [&_.rf-search_button:hover]:bg-rf-accent-hover",
    "[&_.rf-search_button]:text-rf-small [&_.rf-search_button]:px-3.75 [&_.rf-search_button]:py-0",
    "[&_.rf-search_button]:gap-1.5 [&_.rf-header-action>span]:text-rf-caption [&_.rf-header-action_strong]:flex",
    "[&_.rf-header-action_strong]:items-center [&_.rf-header-action_strong]:text-rf-small",
    "[&_.rf-header-action_strong]:gap-1 [&_.rf-header-cart]:text-rf-small [&_.rf-header-cart]:gap-2.5",
    "max-[1024px]:[&_.rf-menu-button]:min-w-12.5 max-[1024px]:[&_.rf-menu-button]:px-3",
    "max-[1024px]:[&_.rf-menu-button>span]:hidden max-[1024px]:[&_.rf-search]:order-[initial]",
    "max-[1024px]:[&_.rf-search]:basis-auto max-[1024px]:[&_.rf-header-action>span]:hidden",
    "max-[1024px]:[&_.rf-logo]:w-31.25 max-[768px]:[&_.rf-menu-button]:-order-1 max-[768px]:[&_.rf-menu-button]:h-8.5",
    "max-[768px]:[&_.rf-menu-button]:min-w-8 max-[768px]:[&_.rf-menu-button]:shadow-none",
    "max-[768px]:[&_.rf-menu-button]:p-1.25 max-[768px]:[&_.rf-menu-button]:border-current",
    "max-[768px]:[&_.rf-menu-button]:border-none max-[768px]:[&_.rf-menu-button]:[border-width:0]",
    "max-[768px]:[&_.rf-logo]:w-32.5 max-[768px]:[&_.rf-logo]:col-start-2 max-[768px]:[&_.rf-logo]:row-start-1",
    "max-[768px]:[&_.rf-logo]:items-center",
    "max-[768px]:[&_.rf-menu-button]:col-start-1 max-[768px]:[&_.rf-menu-button]:row-start-1",
    "max-[768px]:[&_.rf-menu-button]:justify-self-start max-[768px]:[&_.rf-header-action]:ml-auto max-[768px]:[&_.rf-search]:order-5",
    "max-[768px]:[&_.rf-search]:basis-full max-[768px]:[&_.rf-search]:h-11",
    "max-[768px]:[&_.rf-search-wrap]:order-5",
    "max-[768px]:[&_.rf-search-wrap]:basis-full max-[768px]:[&_.rf-search-wrap]:col-span-full",
    "max-[768px]:[&_.rf-search-wrap]:row-start-2 max-[1024px]:[&_.rf-menu-button>svg:last-child]:hidden",
  ].join(" "),
  menu_button: [
    "flex items-center w-55.5 shrink-0 bg-rf-accent-soft bg-none [border-top-width:0] [border-top-style:none] border-t-current",
    "border-r [border-right-style:solid] border-r-rf-border [border-bottom-width:0] [border-bottom-style:none]",
    "border-b-current border-l [border-left-style:solid] border-l-rf-border text-rf-ink text-rf-small font-semibold px-4",
    "py-0 gap-2.75 max-[1024px]:w-auto max-[768px]:px-2.5",
    "max-[768px]:py-0 max-[768px]:gap-1.5 [&>svg:last-child]:ml-auto max-[768px]:[&>svg:last-child]:hidden",
  ].join(" "),
  header_action_account_action: [
    "rf-header-action rf-account-action flex items-center gap-2.5 hover:text-rf-accent [&>span]:flex [&>span]:flex-col [&>span]:text-rf-caption",
    "[&>span]:text-rf-muted [&_strong]:text-rf-text [&_strong]:text-rf-small [&_strong]:font-semibold max-[1024px]:ml-auto",
    "max-[1024px]:[&>span]:hidden",
  ].join(" "),
  header_cart: [
    "rf-header-cart flex items-center text-rf-small hover:text-rf-accent gap-3 [&>span]:relative [&_b]:absolute [&_b]:right-[-7px]",
    "[&_b]:top-[-7px] [&_b]:min-w-5 [&_b]:min-h-5 [&_b]:bg-rf-accent [&_b]:bg-none [&_b]:text-white [&_b]:text-[0.75rem]",
    "[&_b]:text-center [&_b]:px-0.75 [&_b]:py-0.25 [&_b]:rounded-[5px] max-[1024px]:[&_strong]:hidden",
  ].join(" "),
  mega_menu: [
    motion.enter,
    "rf-mega-menu flex relative z-2 w-full bg-[#fffcf7] bg-none shadow-[0_20px_40px_#20242220] rounded-tl-[0] rounded-tr-[0]",
    "rounded-br-[12px] rounded-bl-[12px] border-rf-border border-solid border [&>nav]:w-62.5 [&>nav]:shrink-0",
    "[&>nav]:border-r [&>nav]:[border-right-style:solid] [&>nav]:border-r-rf-border [&>nav]:max-h-[70dvh]",
    "[&>nav]:overflow-y-auto [&>nav]:p-2.25 [&>nav_a]:flex [&>nav_a]:items-center [&>nav_a]:min-h-9.75",
    "[&>nav_a]:text-rf-small [&>nav_a]:px-3 [&>nav_a]:py-1.75 [&>nav_a]:rounded-[5px] [&>nav_a]:gap-2.5",
    "max-[768px]:[&>nav]:w-full max-[768px]:max-h-[60dvh] max-[768px]:overflow-y-auto [&>nav_a:hover]:bg-rf-accent-soft",
    "[&>nav_a:hover]:bg-none [&>nav_a:hover]:text-rf-accent [&>nav_a:focus]:bg-rf-accent-soft [&>nav_a:focus]:bg-none",
    "[&>nav_a:focus]:text-rf-accent [&>nav_a_svg:last-child]:ml-auto [&>nav_a.active]:bg-rf-accent-soft",
    "[&>nav_a.active]:bg-none [&>nav_a.active]:text-rf-accent",
  ].join(" "),
  mega_content_mega_groups: [
    "rf-mega-content rf-mega-groups grid grid-cols-[repeat(3,_minmax(0,_1fr))] flex-1 gap-y-5 gap-x-6.25 max-h-[70dvh]",
    "overflow-y-auto content-start min-w-0 px-7 py-5.5 [&_h3]:text-[23px] [&_h3]:mt-3 [&_h4]:text-rf-small [&_h4]:mb-2.5",
    "[&_h4]:text-rf-accent [&_h4]:border-b [&_h4]:[border-bottom-style:solid] [&_h4]:border-b-rf-border [&_h4]:pb-2",
    "[&_a]:flex [&_a]:items-center [&_a]:text-rf-muted [&_a:hover]:text-rf-accent [&_a]:text-rf-small [&_a]:mx-0 [&_a]:my-2.5 [&_a]:gap-1.25",
    "max-[1024px]:grid-cols-[1fr_1fr] max-[1024px]:p-6.25 max-[1024px]:gap-4.5 max-[768px]:hidden",
    "max-[1024px]:[&>div:first-child]:hidden [&_.rf-mega-title]:col-span-full [&_.rf-mega-title]:flex",
    "[&_.rf-mega-title]:justify-between [&_.rf-mega-title]:items-center [&_.rf-mega-title]:border-b",
    "[&_.rf-mega-title]:[border-bottom-style:solid] [&_.rf-mega-title]:border-b-rf-border [&_.rf-mega-title]:pb-2.5",
  ].join(" "),
  reference_pills_container: [
    "rf-reference-pills rf-container group/marquee relative max-w-none w-auto overflow-hidden py-3 mx-[50px]",
    "max-[768px]:mx-4 max-[768px]:py-2.25 print:p-0",
  ].join(" "),
  reference_pills_track: [
    "rf-marquee-track flex w-max animate-[rf-marquee-left_40s_linear_infinite]",
    "group-hover/marquee:[animation-play-state:paused]",
    "group-has-[a:focus-visible]/marquee:[animation-play-state:paused] print:animate-none",
  ].join(" "),
  reference_pills_group: [
    "flex w-max shrink-0 items-center gap-5 pr-5 max-[768px]:gap-1.25 max-[768px]:pr-1.25",
    "[&>a]:inline-flex [&>a]:shrink-0 [&>a]:items-center [&>a]:text-rf-caption [&>a]:font-semibold",
    "[&>a]:text-rf-accent-hover [&>a]:bg-linear-to-r [&>a]:from-rf-accent-soft [&>a]:to-rf-cyan/25",
    "[&>a]:whitespace-nowrap [&>a]:px-3.75 [&>a]:py-1.5 [&>a_svg]:text-rf-accent",
    "[&>a]:border-rf-accent/25 [&>a]:border [&>a]:rounded-[30px] [&>a]:gap-2",
    "[&>a:hover]:text-rf-accent-hover [&>a:hover]:border-rf-accent/60 [&>a:hover]:shadow-[0_2px_8px_#6334e31a]",
    "max-[768px]:[&>a]:px-2.5 max-[768px]:[&>a]:py-1.25",
  ].join(" "),
};

const topLinks = [
  { label: "Khuyến mãi", href: "/promotions", icon: Gift },
  { label: "Trả góp", href: "/pages/installments", icon: CreditCard },
  { label: "Hệ thống showroom", href: "/showrooms", icon: Store },
  { label: "Xây dựng cấu hình", href: "/pc-builder", icon: MonitorCog },
  { label: "Thông tin hỗ trợ", href: "/support", icon: Headphones },
];
const promotionLinks = [
  {
    href: "/products?category=pc",
    label: "PC Gaming quốc dân · Giá tốt mỗi ngày",
    icon: MonitorCog,
  },
  {
    href: "/products?category=laptop",
    label: "Laptop ưu đãi khủng · Quà tặng hấp dẫn",
    icon: CreditCard,
  },
  {
    href: "/promotions",
    label: "Mở cấu hình mới · Khám phá ưu đãi",
    icon: Gift,
  },
  {
    href: "/products?category=monitor",
    label: "Lên đời màn hình · Đón ưu đãi mới",
    icon: Gift,
  },
  {
    href: "/pages/installments",
    label: "Thông tin trả góp PC / Laptop",
    icon: CreditCard,
  },
];
/** Header ba lớp theo ảnh: utility bar → logo/danh mục/search → pill khuyến mãi. */
export function StoreHeader() {
  const { storeMenu } = useCatalog().presentation;

  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState("pc");
  const [marqueeRepeats, setMarqueeRepeats] = useState(2);
  const marquee = useRef<HTMLDivElement>(null);
  const marqueeLinks = Array.from(
    { length: marqueeRepeats },
    () => promotionLinks,
  ).flat();
  const trigger = useRef<HTMLButtonElement>(null);
  const selection =
    storeMenu.find((group) => group.id === active) ?? storeMenu[0];
  const shop = useShop();
  const quantity = shop.cart.reduce((sum, line) => sum + line.quantity, 0);
  const close = () => setMenu(false);
  useEffect(() => {
    const track = marquee.current;
    const viewport = track?.parentElement;
    const group = track?.firstElementChild;
    if (!viewport || !(group instanceof HTMLElement)) return;
    const fit = () => {
      const first = group.children[0];
      const last = group.children[promotionLinks.length - 1];
      if (!first || !last) return;
      const gap = parseFloat(getComputedStyle(group).columnGap) || 0;
      const sequenceWidth =
        last.getBoundingClientRect().right -
        first.getBoundingClientRect().left +
        gap;
      if (sequenceWidth <= 0) return;
      // Phủ ít nhất một khung bằng nội dung thật, không dùng min-width tạo phần rỗng.
      setMarqueeRepeats(
        Math.max(2, Math.ceil(viewport.clientWidth / sequenceWidth)),
      );
    };
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    observer.observe(group);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!menu) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [menu]);
  return (
    <>
      <a
        href="#main-content"
        className="rf-skip fixed top-[-80px] left-5 bg-white bg-none z-1000 px-5.5 py-3 border-rf-accent border-solid border-2 focus:top-2.5"
      >
        Đến nội dung chính
      </a>
      <div className={tw.reference_utility}>
        <nav
          className="rf-container max-w-none w-full px-[50px] mx-auto max-[768px]:px-4 print:p-0"
          aria-label="Thông tin cửa hàng"
        >
          {topLinks.map(({ label, href, icon: Icon }) => (
            <Link href={href} key={href}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <header className="rf-header rf-reference-header sticky top-0 z-40 w-full bg-[#fffcf7] bg-none shadow-none border-b border-rf-border print:hidden!">
        <div className={tw.container_reference_header_main}>
          <BrandLogo />
          <button
            ref={trigger}
            className={
              `rf-menu-button ${menu ? "active" : ""}` + " " + tw.menu_button
            }
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-controls="rf-menu"
            aria-label="Danh mục sản phẩm"
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
            <span>Danh mục</span>
            <ChevronDown size={13} />
          </button>
          <StoreSearch />
          <div className="contents max-[768px]:col-start-3 max-[768px]:row-start-1 max-[768px]:flex max-[768px]:items-center max-[768px]:justify-self-end max-[768px]:gap-2.75">
            <Link
              className={tw.header_action_account_action}
              aria-label="Tài khoản"
              href={shop.user ? "/account" : "/login"}
            >
              <UserRound size={29} />
              <span>
                {shop.user ? "Xin chào," : "Đăng nhập/Đăng ký"}
                <strong>
                  {shop.user?.name ?? "Tài khoản"}
                  <ChevronDown size={12} />
                </strong>
              </span>
            </Link>
            <Link
              className={tw.header_cart}
              href="/cart"
              aria-label={`Giỏ hàng ${quantity} sản phẩm`}
            >
              <span>
                <ShoppingCart size={28} />
                <b>{quantity}</b>
              </span>
              <strong>Giỏ hàng</strong>
            </Link>
          </div>
        </div>
        {menu && (
          <div className="rf-container rf-menu-wrap max-w-none w-full absolute top-full left-0 right-0 z-50 px-[50px] mx-auto max-[768px]:px-4 print:p-0">
            <div id="rf-menu" className={tw.mega_menu}>
              <nav aria-label="Danh mục cửa hàng">
                {storeMenu.map((group) => (
                  <Link
                    key={group.id}
                    href={group.href}
                    onMouseEnter={() => setActive(group.id)}
                    onFocus={() => setActive(group.id)}
                    onClick={close}
                    className={active === group.id ? "active" : ""}
                  >
                    <CategoryIcon id={group.icon} size={19} />
                    {group.label}
                    <ChevronRight size={14} />
                  </Link>
                ))}
              </nav>
              <div className={tw.mega_content_mega_groups}>
                <div className="rf-mega-title [&_h3]:text-[21px] [&_h3]:m-0">
                  <h3>{selection.label}</h3>
                  <Link href={selection.href} onClick={close}>
                    Xem tất cả <ArrowRight size={16} />
                  </Link>
                </div>
                {selection.groups.map((group) => (
                  <div key={group.label}>
                    <h4>{group.label}</h4>
                    {group.links.map((link) => (
                      <Link key={link.href} href={link.href} onClick={close}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <button
              className="rf-menu-dismiss fixed top-43.75 right-0 bottom-0 left-0 bg-[#20242255] bg-none z-1 cursor-default border-current border-none [border-width:0]"
              aria-label="Đóng menu"
              onClick={close}
            />
          </div>
        )}
      </header>
      <div className={tw.reference_pills_container} aria-label="Ưu đãi nổi bật">
        <div
          id="rf-promotion-marquee"
          ref={marquee}
          className={tw.reference_pills_track}
          data-continuous-motion
        >
          {[false, true].map((copy) => (
            <div
              key={String(copy)}
              className={`${tw.reference_pills_group}${copy ? " print:hidden" : ""}`}
              aria-hidden={copy || undefined}
            >
              {marqueeLinks.map(({ href, label, icon: Icon }, index) => (
                <Link
                  href={href}
                  key={`${href}-${index}`}
                  aria-hidden={
                    copy || index >= promotionLinks.length || undefined
                  }
                  tabIndex={
                    copy || index >= promotionLinks.length ? -1 : undefined
                  }
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
