"use client";
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
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";
import Button from "../../ui/Button/Button";

const topLinks = [
  { label: "Khuyến mãi", icon: Gift },
  { label: "Trả góp", icon: CreditCard },
  { label: "Hệ thống showroom", icon: Store },
  { label: "Xây dựng cấu hình", icon: SlidersHorizontal },
  { label: "Thông tin hỗ trợ", icon: Phone },
];

export default function Header() {
  return (
    <header className="relative z-50 w-full bg-white">
      {/* TOP BAR */}
      <div className="hidden h-12 w-full items-center justify-center bg-linear-to-r from-green-500 via-white-500 to-black lg:flex">
        <div className="flex w-full max-w-[1620px] items-center justify-center gap-7 px-5">
          {topLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                href="/"
                key={item.label}
                className="flex items-center gap-2 whitespace-nowrap text-[16px] font-medium text-white transition-opacity hover:opacity-80"
              >
                <Icon size={23} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* MAIN HEADER */}
      <div className="w-full bg-white !p-4">
        <div
          className="mx-auto grid w-full max-w-[1620px]
                      grid-cols-[auto_auto_1fr_auto]
                      items-center gap-x-5 gap-y-5 px-4
                      lg:flex lg:gap-9"
        >
          {/* LOGO */}
          <Link
            href="/"
            className="col-start-1 row-start-1 w-[95px] shrink-0 sm:w-[110px] lg:w-[150px]"
          >
            <Image
              src="/images/rigforge-website-logo.png"
              alt="Reigforge-Logo"
              width={150}
              height={50}
              priority
              className="h-auto w-[150px] object-contain"
            />
          </Link>

          {/* CATEGORY */}

          <Button
            variant="primary"
            size="lg"
            leftIcon={<ShoppingCart size={23} />}
            onClick={() => {}}
          >
            <span>Danh mục</span>
          </Button>

          {/* SEARCH */}
          <form
            action="/search"
            method="GET"
            className="
              col-span-4 col-start-1 row-start-2
              flex h-[48px] min-w-0 w-full
              lg:col-span-1 lg:col-start-auto
              lg:row-start-auto lg:flex-1
            "
          >
            {/* INPUT WRAPPER */}
            <div
              className="
              flex min-w-0 flex-1 items-center
              overflow-hidden rounded-l-full
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
                  px-6 text-sm text-gray-800
                  outline-none placeholder:text-gray-400
                  sm:px-6 sm:text-base
                 
                "
              />
            </div>

            {/* SEARCH BUTTON */}
            <button
              type="submit"
              className="
                flex h-full min-w-[48px] shrink-0
                items-center justify-center gap-2
                rounded-r-full bg-emerald-500
                px-3 text-sm font-medium text-white
                transition-colors hover:bg-emerald-400
                sm:px-5 lg:min-w-[120px] lg:text-base
              "
            >
              <Search size={19} />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </button>
          </form>

          {/* ACCOUNT */}
          <div
            className="
    group relative col-start-3 row-start-1
    flex items-center justify-end
    whitespace-nowrap
  "
          >
            {/* ACCOUNT TRIGGER */}
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

                <strong className="flex items-center gap-1 text-base text-gray-800">
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
                  text-zinc-950
                  shadow-none

                  hover:border-emerald-400
                  hover:bg-emerald-400
                  hover:text-zinc-950
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
          bg-zinc-900
          text-white
          shadow-none

          hover:border-zinc-800
          hover:bg-zinc-800
          hover:text-white
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
          bg-[#3b5998]
          text-white
          shadow-none

          hover:border-[#304b80]
          hover:bg-[#304b80]
          hover:text-white
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
          bg-[#e74732]
          text-white
          shadow-none

          hover:border-[#cf3928]
          hover:bg-[#cf3928]
          hover:text-white
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
              col-start-4 row-start-1
              flex items-center justify-end gap-2
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

            <strong className="hidden text-base lg:block">Giỏ hàng</strong>
          </Link>
        </div>
      </div>
    </header>
  );
}
