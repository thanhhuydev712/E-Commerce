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
    "rf-reference-utility text-white bg-[linear-gradient(100deg,_#006f54,_#0c2631)] bg-transparent [&_nav]:min-h-9",
    "[&_nav]:flex [&_nav]:justify-center [&_nav]:items-center [&_nav]:gap-7 [&_a]:inline-flex [&_a]:items-center",
    "[&_a]:text-[12px] [&_a]:gap-1.5 max-[1024px]:[&_nav]:gap-4 max-[1024px]:[&_a]:text-[10px]",
    "max-[768px]:[&_nav]:min-h-7.5 max-[768px]:[&_nav]:gap-4 max-[768px]:[&_a]:text-[10px]",
    "max-[768px]:[&_a:nth-child(2)]:hidden max-[768px]:[&_a:nth-child(3)]:hidden max-[768px]:[&_a:nth-child(5)]:hidden",
  ].join(" "),
  container_reference_header_main: [
    "rf-container rf-reference-header-main max-w-none w-full flex items-center min-h-26.25 px-[50px] mx-auto",
    "gap-5.5 max-[768px]:min-h-28.25 max-[768px]:grid max-[768px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
    "max-[768px]:px-4 max-[768px]:py-2.5 max-[768px]:gap-2.75",
    "print:p-0 max-[1024px]:min-h-22.5 max-[1024px]:gap-3.75 [&_.rf-logo]:w-35 [&_.rf-logo_img]:w-35",
    "[&_.rf-logo>span]:text-[6px] [&_.rf-logo>span]:tracking-[1.5px] [&_.rf-menu-button]:w-auto",
    "[&_.rf-menu-button]:min-w-36.25 [&_.rf-menu-button]:h-11.75 [&_.rf-menu-button]:bg-white [&_.rf-menu-button]:bg-none",
    "[&_.rf-menu-button]:text-[#172d36] [&_.rf-menu-button]:shadow-[0_4px_12px_#0b283b12] [&_.rf-menu-button]:text-[14px]",
    "[&_.rf-menu-button]:border-[#dce5e6] [&_.rf-menu-button]:border-solid [&_.rf-menu-button]:border",
    "[&_.rf-menu-button]:rounded-[12px] [&_.rf-menu-button]:gap-2.25 [&_.rf-search]:h-11.5 [&_.rf-search]:bg-white",
    "[&_.rf-search]:bg-none [&_.rf-search]:shadow-[0_2px_8px_#0b283b08] [&_.rf-search]:p-0 [&_.rf-search]:rounded-[30px]",
    "[&_.rf-search]:overflow-hidden [&_.rf-search_input]:text-[14px] [&_.rf-search_input]:px-4.25",
    "[&_.rf-search_input]:py-3 [&_.rf-search_button]:flex [&_.rf-search_button]:items-center",
    "[&_.rf-search_button]:bg-rf-green [&_.rf-search_button]:bg-none [&_.rf-search_button]:text-white",
    "[&_.rf-search_button]:text-[13px] [&_.rf-search_button]:px-3.75 [&_.rf-search_button]:py-0",
    "[&_.rf-search_button]:gap-1.5 [&_.rf-header-action>span]:text-[11px] [&_.rf-header-action_strong]:flex",
    "[&_.rf-header-action_strong]:items-center [&_.rf-header-action_strong]:text-[14px]",
    "[&_.rf-header-action_strong]:gap-1 [&_.rf-header-cart]:text-[13px] [&_.rf-header-cart]:gap-2.5",
    "max-[1024px]:[&_.rf-menu-button]:min-w-12.5 max-[1024px]:[&_.rf-menu-button]:px-3",
    "max-[1024px]:[&_.rf-menu-button>span]:hidden max-[1024px]:[&_.rf-search]:order-[initial]",
    "max-[1024px]:[&_.rf-search]:basis-auto max-[1024px]:[&_.rf-header-action>span]:hidden",
    "max-[1024px]:[&_.rf-logo]:w-31.25 max-[768px]:[&_.rf-menu-button]:-order-1 max-[768px]:[&_.rf-menu-button]:h-8.5",
    "max-[768px]:[&_.rf-menu-button]:min-w-8 max-[768px]:[&_.rf-menu-button]:shadow-none",
    "max-[768px]:[&_.rf-menu-button]:p-1.25 max-[768px]:[&_.rf-menu-button]:border-current",
    "max-[768px]:[&_.rf-menu-button]:border-none max-[768px]:[&_.rf-menu-button]:[border-width:0]",
    "max-[768px]:[&_.rf-logo]:w-32.5 max-[768px]:[&_.rf-logo]:col-start-2 max-[768px]:[&_.rf-logo]:row-start-1",
    "max-[768px]:[&_.rf-logo]:items-center max-[768px]:[&_.rf-logo_img]:w-full",
    "max-[768px]:[&_.rf-menu-button]:col-start-1 max-[768px]:[&_.rf-menu-button]:row-start-1",
    "max-[768px]:[&_.rf-menu-button]:justify-self-start max-[768px]:[&_.rf-header-action]:ml-auto max-[768px]:[&_.rf-search]:order-5",
    "max-[768px]:[&_.rf-search]:basis-full max-[768px]:[&_.rf-search]:h-9.75 max-[768px]:[&_.rf-search_input]:text-[12px]",
    "max-[768px]:[&_.rf-search_button]:text-[11px] max-[768px]:[&_.rf-search-wrap]:order-5",
    "max-[768px]:[&_.rf-search-wrap]:basis-full max-[768px]:[&_.rf-search-wrap]:col-span-full",
    "max-[768px]:[&_.rf-search-wrap]:row-start-2 max-[1024px]:[&_.rf-menu-button>svg:last-child]:hidden",
  ].join(" "),
  menu_button: [
    "flex items-center w-55.5 shrink-0 bg-[#edf5ef] bg-none [border-top-width:0] [border-top-style:none] border-t-current",
    "border-r [border-right-style:solid] border-r-[#e3ebe5] [border-bottom-width:0] [border-bottom-style:none]",
    "border-b-current border-l [border-left-style:solid] border-l-[#e3ebe5] text-[#1b4935] text-[12px] font-bold px-4",
    "py-0 gap-2.75 max-[1024px]:w-auto max-[1024px]:text-[11px] max-[768px]:text-[10px] max-[768px]:px-2.5",
    "max-[768px]:py-0 max-[768px]:gap-1.5 [&>svg:last-child]:ml-auto max-[768px]:[&>svg:last-child]:hidden",
  ].join(" "),
  header_action_account_action: [
    "rf-header-action rf-account-action flex items-center gap-2.5 [&>span]:flex [&>span]:flex-col [&>span]:text-[9px]",
    "[&>span]:text-rf-muted [&_strong]:text-rf-text [&_strong]:text-[12px] [&_strong]:font-semibold max-[1024px]:ml-auto",
    "max-[1024px]:[&>span]:hidden",
  ].join(" "),
  header_cart: [
    "rf-header-cart flex items-center text-[12px] gap-3 [&>span]:relative [&_b]:absolute [&_b]:right-[-7px]",
    "[&_b]:top-[-7px] [&_b]:min-w-3.75 [&_b]:h-3.75 [&_b]:bg-rf-green [&_b]:bg-none [&_b]:text-white [&_b]:text-[9px]",
    "[&_b]:text-center [&_b]:px-0.75 [&_b]:py-0.25 [&_b]:rounded-[5px] max-[1024px]:[&_strong]:hidden",
  ].join(" "),
  mega_menu: [
    motion.enter,
    "rf-mega-menu flex relative z-2 w-full bg-white bg-none shadow-[0_20px_40px_#142d2420] rounded-tl-[0] rounded-tr-[0]",
    "rounded-br-[12px] rounded-bl-[12px] border-rf-border border-solid border [&>nav]:w-62.5 [&>nav]:shrink-0",
    "[&>nav]:border-r [&>nav]:[border-right-style:solid] [&>nav]:border-r-rf-border [&>nav]:max-h-[70dvh]",
    "[&>nav]:overflow-y-auto [&>nav]:p-2.25 [&>nav_a]:flex [&>nav_a]:items-center [&>nav_a]:min-h-9.75",
    "[&>nav_a]:text-[12px] [&>nav_a]:px-3 [&>nav_a]:py-1.75 [&>nav_a]:rounded-[5px] [&>nav_a]:gap-2.5",
    "max-[768px]:[&>nav]:w-full max-[768px]:max-h-[60dvh] max-[768px]:overflow-y-auto [&>nav_a:hover]:bg-[#edf6ef]",
    "[&>nav_a:hover]:bg-none [&>nav_a:hover]:text-rf-green [&>nav_a:focus]:bg-[#edf6ef] [&>nav_a:focus]:bg-none",
    "[&>nav_a:focus]:text-rf-green [&>nav_a_svg:last-child]:ml-auto [&>nav_a.active]:bg-[#e9f4ee]",
    "[&>nav_a.active]:bg-none [&>nav_a.active]:text-rf-green",
  ].join(" "),
  mega_content_mega_groups: [
    "rf-mega-content rf-mega-groups grid grid-cols-[repeat(3,_minmax(0,_1fr))] flex-1 gap-y-5 gap-x-6.25 max-h-[70dvh]",
    "overflow-y-auto content-start px-7 py-5.5 [&_h3]:text-[23px] [&_h3]:mt-3 [&_h4]:text-[12px] [&_h4]:mb-2.5",
    "[&_h4]:text-rf-green [&_h4]:border-b [&_h4]:[border-bottom-style:solid] [&_h4]:border-b-rf-border [&_h4]:pb-2",
    "[&_a]:flex [&_a]:items-center [&_a]:text-[#56645a] [&_a]:text-[12px] [&_a]:mx-0 [&_a]:my-2.5 [&_a]:gap-1.25",
    "max-[1024px]:grid-cols-[1fr_1fr] max-[1024px]:p-6.25 max-[1024px]:gap-4.5 max-[768px]:hidden",
    "max-[1024px]:[&>div:first-child]:hidden [&_.rf-mega-title]:col-span-full [&_.rf-mega-title]:flex",
    "[&_.rf-mega-title]:justify-between [&_.rf-mega-title]:items-center [&_.rf-mega-title]:border-b",
    "[&_.rf-mega-title]:[border-bottom-style:solid] [&_.rf-mega-title]:border-b-rf-border [&_.rf-mega-title]:pb-2.5",
  ].join(" "),
  reference_pills_container: [
    "rf-reference-pills rf-container max-w-none w-full flex overflow-x-auto [scrollbar-width:none] px-[50px]",
    "py-3 mx-auto gap-5 max-[768px]:px-4 max-[768px]:py-2.25 max-[768px]:gap-2.5 print:p-0 [&>a]:inline-flex",
    "[&>a]:items-center [&>a]:text-[11px] [&>a]:font-semibold [&>a]:text-[#08745c] [&>a]:bg-[#f3faf6] [&>a]:bg-none",
    "[&>a]:whitespace-nowrap [&>a]:px-3.75 [&>a]:py-1.5 [&>a]:border-[#cee5db] [&>a]:border-solid [&>a]:border",
    "[&>a]:rounded-[30px] [&>a]:gap-2 max-[768px]:[&>a]:text-[9px] max-[768px]:[&>a]:px-2.5 max-[768px]:[&>a]:py-1.25",
  ].join(" "),
};

const topLinks = [
  { label: "Khuyến mãi", href: "/promotions", icon: Gift },
  { label: "Trả góp", href: "/pages/installments", icon: CreditCard },
  { label: "Hệ thống showroom", href: "/showrooms", icon: Store },
  { label: "Xây dựng cấu hình", href: "/pc-builder", icon: MonitorCog },
  { label: "Thông tin hỗ trợ", href: "/support", icon: Headphones },
];
/** Header ba lớp theo ảnh: utility bar → logo/danh mục/search → pill khuyến mãi. */
export function StoreHeader() {
  const { storeMenu } = useCatalog().presentation;

  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState("pc");
  const trigger = useRef<HTMLButtonElement>(null);
  const selection =
    storeMenu.find((group) => group.id === active) ?? storeMenu[0];
  const shop = useShop();
  const quantity = shop.cart.reduce((sum, line) => sum + line.quantity, 0);
  const close = () => setMenu(false);
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
        className="rf-skip fixed top-[-80px] left-5 bg-white bg-none z-1000 px-5.5 py-3 border-rf-green border-solid border-2 focus:top-2.5"
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
      <header className="rf-header rf-reference-header sticky top-0 z-40 w-full bg-white bg-none shadow-none border-current border-none [border-width:0] print:hidden!">
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
              className="rf-menu-dismiss fixed top-43.75 right-0 bottom-0 left-0 bg-[#14291f55] bg-none z-1 cursor-default border-current border-none [border-width:0]"
              aria-label="Đóng menu"
              onClick={close}
            />
          </div>
        )}
      </header>
      <div className={tw.reference_pills_container} aria-label="Ưu đãi nổi bật">
        <Link href="/products?category=pc">
          <MonitorCog size={14} />
          PC Gaming quốc dân · Giá tốt mỗi ngày
        </Link>
        <Link href="/products?category=laptop">
          <CreditCard size={14} />
          Laptop ưu đãi khủng · Quà tặng hấp dẫn
        </Link>
        <Link href="/promotions">
          <Gift size={14} />
          Mở cấu hình mới · Nhận mã RIGFORGE5
        </Link>
        <Link href="/products?category=monitor">
          <Gift size={14} />
          Lên đời màn hình · Đón ưu đãi mới
        </Link>
        <Link href="/pages/installments">
          <CreditCard size={14} />
          Thông tin trả góp PC / Laptop
        </Link>
      </div>
    </>
  );
}
