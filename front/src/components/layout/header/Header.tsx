"use client";

import { useEffect, useRef, useState } from "react";

import {
  Gift,
  CreditCard,
  Store,
  SlidersHorizontal,
  Phone,
  Search,
  UserRound,
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";

import Button from "../../ui/Button/Button";
import CategoryMenu from "../category/Category";
import PromoMarquee from "./marquee/PromoMarquee";

const topLinks = [
  { label: "Khuyến mãi", icon: Gift },
  { label: "Trả góp", icon: CreditCard },
  { label: "Hệ thống showroom", icon: Store },
  { label: "Xây dựng cấu hình", icon: SlidersHorizontal },
  { label: "Thông tin hỗ trợ", icon: Phone },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tự động focus input khi mở tìm kiếm
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  // Mở menu
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    setIsSearchOpen(false);
  };

  // Mở tìm kiếm
  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
    setIsMenuOpen(false);
  };

  // Đóng các thành phần mobile
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  };

  return (
    <header
      className="
        sticky top-0 z-[100]
        w-full overflow-visible
        bg-white
        shadow-[0_2px_10px_rgba(0,0,0,0.04)]
        transition-shadow duration-300
      "
    >
      {/* ========================================
          1. TOP BAR - DESKTOP
      ======================================== */}
      <div
        className="
          hidden lg:flex
          h-12 w-full
          items-center justify-center
          bg-linear-to-r
          from-green-500 via-green-400 to-black
        "
      >
        <div
          className="
            flex w-full max-w-[1620px]
            items-center justify-center
            gap-7 px-5
          "
        >
          {topLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                href="/"
                key={item.label}
                className="
                  flex items-center gap-2
                  whitespace-nowrap
                  text-[16px] font-medium text-white
                  transition-opacity hover:opacity-80
                "
              >
                <Icon size={23} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ========================================
          2. MOBILE HEADER
      ======================================== */}
      <div className="w-full bg-white px-4 py-3 lg:hidden">
        {/* Main navigation */}
        <div
          className="
            grid w-full
            grid-cols-[1fr_auto_1fr]
            items-center
          "
        >
          {/* LEFT: MENU + SEARCH */}
          <div className="flex items-center justify-start gap-3">
            {/* Menu button */}
            <button
              type="button"
              aria-label="Mở danh mục"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-category-drawer"
              onClick={toggleMenu}
              className="
                flex h-10 w-9
                items-center justify-center
                text-gray-700
                transition-colors
                hover:text-emerald-600
              "
            >
              {isMenuOpen ? (
                <X size={25} strokeWidth={1.8} />
              ) : (
                <Menu size={25} strokeWidth={1.8} />
              )}
            </button>

            {/* Search button */}
            <button
              type="button"
              aria-label="Tìm kiếm"
              aria-expanded={isSearchOpen}
              aria-controls="mobile-search-form"
              onClick={toggleSearch}
              className="
                flex h-10 w-9
                items-center justify-center
                text-gray-700
                transition-colors
                hover:text-emerald-600
              "
            >
              {isSearchOpen ? (
                <X size={23} strokeWidth={1.8} />
              ) : (
                <Search size={24} strokeWidth={1.8} />
              )}
            </button>
          </div>

          {/* CENTER: LOGO */}
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex w-[105px] justify-self-center sm:w-[115px]"
          >
            <Image
              src="/images/rigforge-website-logo.png"
              alt="Rigforge"
              width={1310}
              height={308}
              priority
              className="h-auto w-full"
            />
          </Link>

          {/* RIGHT: ACCOUNT + CART */}
          <div className="flex items-center justify-end gap-3">
            {/* Account */}
            <Link
              href="/login"
              aria-label="Tài khoản"
              className="
                flex h-10 w-9
                items-center justify-center
                text-gray-600
                transition-colors hover:text-emerald-600
              "
            >
              <UserRound size={25} strokeWidth={1.7} />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label="Giỏ hàng"
              className="
                relative flex h-10 w-9
                items-center justify-center
                text-gray-600
                transition-colors hover:text-red-600
              "
            >
              <ShoppingCart size={25} strokeWidth={1.7} />

              <span
                className="
                  absolute right-0 top-0
                  flex h-[19px] w-[19px]
                  items-center justify-center
                  rounded-full bg-[#e91c2b]
                  text-[11px] font-bold text-white
                "
              >
                0
              </span>
            </Link>
          </div>
        </div>

        {/* ========================================
            MOBILE SEARCH INPUT
        ======================================== */}
        {isSearchOpen && (
          <form
            id="mobile-search-form"
            action="/search"
            method="GET"
            className="
              mt-3 flex h-[46px] w-full
              animate-in fade-in slide-in-from-top-1
              duration-200
            "
          >
            <div
              className="
                flex min-w-0 flex-1
                items-center overflow-hidden
                rounded-l-full
                border border-r-0 border-gray-300
                transition-colors
                focus-within:border-emerald-500
              "
            >
              <input
                ref={searchInputRef}
                type="text"
                name="q"
                placeholder="Bạn tìm gì..."
                className="
                  h-full w-full min-w-0
                  border-none bg-transparent
                  px-5 text-sm text-gray-800
                  outline-none
                  placeholder:text-gray-400
                "
              />
            </div>

            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="
                flex h-full w-[52px] shrink-0
                items-center justify-center
                rounded-r-full
                bg-emerald-500
                text-white
                transition-colors hover:bg-emerald-600
              "
            >
              <Search size={21} />
            </button>
          </form>
        )}
      </div>

      {/* ========================================
          3. DESKTOP MAIN HEADER
      ======================================== */}
      <div className="hidden w-full bg-white px-5 py-4 lg:block">
        <div
          className="
            mx-auto flex w-full max-w-[1620px]
            items-center gap-6 xl:gap-9
          "
        >
          {/* LOGO */}
          <Link href="/" className="w-[130px] shrink-0 xl:w-[150px]">
            <Image
              src="/images/rigforge-website-logo.png"
              alt="Rigforge"
              width={1310}
              height={308}
              priority
              className="h-auto w-full"
            />
          </Link>

          {/* CATEGORY */}
          <div className="shrink-0">
            <CategoryMenu />
          </div>

          {/* SEARCH */}
          <form
            action="/search"
            method="GET"
            className="
              flex h-[48px] min-w-0 flex-1
            "
          >
            <div
              className="
                flex min-w-0 flex-1
                items-center overflow-hidden
                rounded-l-full
                border border-r-0 border-gray-500
                transition-colors
                focus-within:border-red-600
              "
            >
              <input
                type="text"
                name="q"
                placeholder="Bạn tìm gì..."
                className="
                  h-full w-full min-w-0
                  border-none bg-transparent
                  px-6 text-base text-gray-800
                  outline-none
                  placeholder:text-gray-400
                "
              />
            </div>

            <button
              type="submit"
              className="
                flex h-full min-w-[120px]
                shrink-0 items-center justify-center gap-2
                rounded-r-full
                bg-emerald-500
                px-5 text-base font-medium text-white
                transition-colors hover:bg-emerald-400
              "
            >
              <Search size={19} />
              <span>Tìm kiếm</span>
            </button>
          </form>

          {/* ACCOUNT */}
          <div
            className="
              group relative
              flex shrink-0 items-center
              whitespace-nowrap
            "
          >
            <Link
              href="/login"
              className="
                flex items-center gap-2
                text-gray-600
                transition-colors duration-200
                hover:text-emerald-600
              "
            >
              <UserRound size={30} strokeWidth={1.5} className="shrink-0" />

              <div className="hidden flex-col gap-1 xl:flex">
                <span className="text-sm text-gray-500">Đăng nhập/Đăng ký</span>

                <strong
                  className="
                    flex items-center gap-1
                    text-base text-gray-800
                  "
                >
                  Tài khoản
                  <ChevronDown
                    size={15}
                    className="
                      transition-transform duration-200
                      group-hover:rotate-180
                      group-focus-within:rotate-180
                    "
                  />
                </strong>
              </div>
            </Link>

            {/* ACCOUNT DROPDOWN */}
            <div
              className="
                invisible absolute right-0 top-full z-[100]
                w-[300px] pt-2
                translate-y-2 opacity-0
                transition-all duration-200 ease-out
                group-hover:visible
                group-hover:translate-y-0
                group-hover:opacity-100
                group-focus-within:visible
                group-focus-within:translate-y-0
                group-focus-within:opacity-100
              "
            >
              <div
                className="
                  overflow-hidden rounded-xl
                  border border-gray-100
                  bg-white p-3
                  shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                "
              >
                {/* LOGIN */}
                <Button
                  fullWidth
                  size="lg"
                  rounded="lg"
                  className="
                    mb-2 h-12 min-w-0
                    border-emerald-500
                    bg-emerald-500
                    text-zinc-950 shadow-none
                    hover:border-emerald-400
                    hover:bg-emerald-400 hover:text-zinc-950
                  "
                  onClick={() => {}}
                >
                  Đăng nhập
                </Button>

                {/* REGISTER */}
                <Button
                  fullWidth
                  size="lg"
                  variant="secondary"
                  rounded="lg"
                  className="
                    mb-3 h-12 min-w-0
                    border-zinc-900
                    bg-zinc-900 text-white shadow-none
                    hover:border-zinc-800
                    hover:bg-zinc-800 hover:text-white
                  "
                  onClick={() => {}}
                >
                  Tạo tài khoản
                </Button>

                {/* FACEBOOK */}
                <Button
                  fullWidth
                  size="lg"
                  variant="secondary"
                  rounded="lg"
                  leftIcon={
                    <span
                      className="
                        flex h-12 w-11 shrink-0
                        items-center justify-center
                        border-r border-white/30
                        text-2xl font-bold
                      "
                    >
                      f
                    </span>
                  }
                  className="
                    mb-2 h-12 min-w-0 gap-0
                    overflow-hidden p-0
                    border-[#3b5998]
                    bg-[#3b5998] text-white shadow-none
                    hover:border-[#304b80]
                    hover:bg-[#304b80] hover:text-white
                  "
                  onClick={() => {}}
                >
                  <span className="flex-1 text-center text-sm">
                    Đăng nhập bằng Facebook
                  </span>
                </Button>

                {/* GOOGLE */}
                <Button
                  fullWidth
                  size="lg"
                  variant="secondary"
                  rounded="lg"
                  leftIcon={
                    <span
                      className="
                        flex h-12 w-11 shrink-0
                        items-center justify-center
                        border-r border-white/30
                        text-xl font-bold
                      "
                    >
                      G
                    </span>
                  }
                  className="
                    h-12 min-w-0 gap-0
                    overflow-hidden p-0
                    border-[#e74732]
                    bg-[#e74732] text-white shadow-none
                    hover:border-[#cf3928]
                    hover:bg-[#cf3928] hover:text-white
                  "
                  onClick={() => {}}
                >
                  <span className="flex-1 text-center text-sm">
                    Đăng nhập bằng Google
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* CART */}
          <Link
            href="/cart"
            className="
              flex shrink-0 items-center gap-2
              whitespace-nowrap text-gray-600
              transition-colors hover:text-red-600
            "
          >
            <div className="relative flex items-center">
              <ShoppingCart size={28} strokeWidth={1.7} />

              <span
                className="
                  absolute -right-2 -top-2
                  flex h-5 w-5 items-center justify-center
                  rounded-full bg-[#e91c2b]
                  text-xs font-bold text-white
                "
              >
                0
              </span>
            </div>

            <strong className="hidden text-base xl:block">Giỏ hàng</strong>
          </Link>
        </div>
      </div>

      {/* ========================================
          4. PROMO MARQUEE
          Ẩn trên mobile
      ======================================== */}
      <div className="hidden md:block">
        <PromoMarquee />
      </div>

      {/* ========================================
          5. MOBILE CATEGORY DRAWER
      ======================================== */}
      <div
        className={`
          fixed inset-0 z-[200] lg:hidden
          ${isMenuOpen ? "visible" : "invisible pointer-events-none"}
        `}
      >
        {/* Overlay */}
        <button
          type="button"
          aria-label="Đóng danh mục"
          onClick={() => setIsMenuOpen(false)}
          className={`
            absolute inset-0
            bg-black/45
            transition-opacity duration-300
            ${isMenuOpen ? "opacity-100" : "opacity-0"}
          `}
        />

        {/* Drawer */}
        <aside
          id="mobile-category-drawer"
          aria-label="Danh mục sản phẩm"
          aria-hidden={!isMenuOpen}
          className={`
            absolute left-0 top-0
            flex h-dvh
            w-[min(86vw,360px)]
            flex-col overflow-y-auto
            bg-white shadow-2xl
            transition-transform duration-300 ease-out
            ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Drawer header */}
          <div
            className="
              sticky top-0 z-10
              flex h-16 shrink-0
              items-center justify-between
              border-b border-gray-100
              bg-white px-4
            "
          >
            <span className="text-base font-bold text-gray-900">
              Danh mục & tiện ích
            </span>

            <button
              type="button"
              aria-label="Đóng menu"
              onClick={() => setIsMenuOpen(false)}
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-full bg-gray-100
                text-gray-700
                hover:bg-gray-200
              "
            >
              <X size={21} />
            </button>
          </div>

          {/* Existing category menu */}
          <div className="p-4">
            <CategoryMenu />
          </div>

          {/* Other navigation links */}
          <div className="border-t border-gray-100 px-4 py-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              Tiện ích
            </p>

            <div className="flex flex-col">
              {topLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="
                      flex min-h-[48px]
                      items-center gap-3
                      border-b border-gray-50
                      text-sm font-medium text-gray-700
                      transition-colors
                      hover:text-emerald-600
                    "
                  >
                    <Icon
                      size={19}
                      strokeWidth={1.8}
                      className="text-gray-500"
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Drawer footer */}
          <div className="mt-auto border-t border-gray-100 p-4">
            <p className="text-center text-xs text-gray-400">
              RIGFORGE - PC & Technology
            </p>
          </div>
        </aside>
      </div>
    </header>
  );
}
