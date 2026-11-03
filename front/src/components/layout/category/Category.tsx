"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Armchair,
  Briefcase,
  Cable,
  ChevronDown,
  ChevronRight,
  Cpu,
  Gamepad2,
  Laptop,
  Menu,
  Monitor,
  Package,
  Tags,
} from "lucide-react";

import Button from "../../ui/Button/Button";
import Image from "next/image";

// ========================================
// CATEGORY TYPES
// ========================================

const categoryIcons = {
  pc: Monitor,
  office: Briefcase,
  laptop: Laptop,
  parts: Cpu,
  monitor: Monitor,
  gear: Gamepad2,
  accessory: Cable,
  furniture: Armchair,
  used: Package,
  outlet: Tags,
  package: Package,
};

type CategoryIcon = keyof typeof categoryIcons;

type CategoryNode = {
  id: string;
  name: string;
  icon?: CategoryIcon;
  image?: string;
  href?: string;
  children?: CategoryNode[];
};

// ========================================
// DEMO CATEGORY DATA
// ========================================

const categories: CategoryNode[] = [
  {
    id: "pc-gaming",
    name: "PC Gaming",
    icon: "pc",
    children: [
      {
        id: "pc-type",
        name: "Loại PC",
        children: [
          { id: "pc-star", name: "PC đồng bộ STAR" },
          { id: "pc-intel", name: "PC Intel" },
          { id: "pc-amd", name: "PC AMD" },
          { id: "agent-pc", name: "Agent Computer" },
        ],
      },
      {
        id: "pc-brand",
        name: "PC theo hãng",
        children: [
          { id: "pc-brand-star", name: "PC STAR" },
          { id: "pc-asus", name: "Powered by ASUS" },
          { id: "pc-gigabyte", name: "PC Gigabyte" },
          { id: "pc-msi", name: "PC MSI" },
        ],
      },
      {
        id: "pc-demand",
        name: "PC theo nhu cầu",
        children: [
          { id: "gaming", name: "PC Gaming" },
          { id: "graphics", name: "PC Đồ họa" },
          { id: "ai-pc", name: "PC AI" },
          { id: "white-pc", name: "White Edition" },
        ],
      },
      {
        id: "pc-price",
        name: "PC theo giá",
        children: [
          { id: "price-10-20", name: "10 - 20 triệu" },
          { id: "price-20-30", name: "20 - 30 triệu" },
          { id: "price-30-50", name: "30 - 50 triệu" },
          { id: "price-50-80", name: "50 - 80 triệu" },
          { id: "price-80", name: "Trên 80 triệu" },
        ],
      },
      {
        id: "pc-vga",
        name: "PC theo VGA",
        children: [
          { id: "rtx-5070", name: "PC RTX 5070" },
          { id: "rtx-5060ti", name: "PC RTX 5060 Ti" },
          { id: "rtx-5060", name: "PC RTX 5060" },
          { id: "rtx-5050", name: "PC RTX 5050" },
        ],
      },
      {
        id: "pc-cpu",
        name: "PC theo CPU",
        children: [
          { id: "core-ultra", name: "PC Core Ultra" },
          { id: "core-i9", name: "PC Core i9" },
          { id: "core-i7", name: "PC Core i7" },
          { id: "ryzen-7", name: "PC Ryzen 7" },
        ],
      },
    ],
  },

  // Danh mục cấp 2: Không có nhóm con
  {
    id: "pc-office",
    name: "PC Văn phòng",
    icon: "office",
    children: [
      { id: "office-basic", name: "PC văn phòng cơ bản" },
      { id: "office-advanced", name: "PC văn phòng nâng cao" },
      { id: "mini-pc", name: "Mini PC" },
      { id: "all-in-one", name: "PC All-in-One" },
    ],
  },

  {
    id: "laptop",
    name: "Laptop",
    icon: "laptop",
    children: [
      { id: "laptop-gaming", name: "Laptop Gaming" },
      { id: "laptop-office", name: "Laptop văn phòng" },
      { id: "laptop-graphics", name: "Laptop đồ họa" },
      { id: "laptop-student", name: "Laptop sinh viên" },
    ],
  },

  // Danh mục có 3 cấp
  {
    id: "components",
    name: "Linh kiện",
    icon: "parts",
    children: [
      {
        id: "cpu",
        name: "Bộ vi xử lý CPU",
        children: [
          { id: "cpu-intel", name: "CPU Intel" },
          { id: "cpu-amd", name: "CPU AMD" },
        ],
      },
      {
        id: "vga",
        name: "Card đồ họa VGA",
        children: [
          { id: "vga-nvidia", name: "NVIDIA GeForce" },
          { id: "vga-amd", name: "AMD Radeon" },
        ],
      },
      {
        id: "ram",
        name: "RAM",
        children: [
          { id: "ram-ddr4", name: "RAM DDR4" },
          { id: "ram-ddr5", name: "RAM DDR5" },
        ],
      },
    ],
  },

  {
    id: "monitor",
    name: "Màn hình",
    icon: "monitor",
    children: [
      { id: "monitor-gaming", name: "Màn hình Gaming" },
      { id: "monitor-office", name: "Màn hình văn phòng" },
      { id: "monitor-4k", name: "Màn hình 4K" },
      { id: "monitor-curved", name: "Màn hình cong" },
    ],
  },

  {
    id: "gaming-gear",
    name: "Gaming Gear",
    icon: "gear",
    children: [
      { id: "keyboard", name: "Bàn phím Gaming" },
      { id: "mouse", name: "Chuột Gaming" },
      { id: "headset", name: "Tai nghe Gaming" },
      { id: "mousepad", name: "Lót chuột" },
    ],
  },

  {
    id: "accessories",
    name: "Phụ kiện",
    icon: "accessory",
    children: [
      { id: "cable", name: "Cáp kết nối" },
      { id: "usb", name: "USB và Hub" },
      { id: "adapter", name: "Adapter" },
    ],
  },

  {
    id: "furniture",
    name: "Bàn, ghế",
    icon: "furniture",
    children: [
      { id: "gaming-chair", name: "Ghế Gaming" },
      { id: "office-chair", name: "Ghế văn phòng" },
      { id: "gaming-desk", name: "Bàn Gaming" },
    ],
  },

  {
    id: "used",
    name: "Linh kiện cũ",
    icon: "used",
    children: [
      { id: "used-cpu", name: "CPU cũ" },
      { id: "used-vga", name: "VGA cũ" },
      { id: "used-ram", name: "RAM cũ" },
    ],
  },

  {
    id: "outlet",
    name: "Hàng Outlet",
    icon: "outlet",
    children: [
      { id: "outlet-pc", name: "PC Outlet" },
      { id: "outlet-laptop", name: "Laptop Outlet" },
      { id: "outlet-accessory", name: "Phụ kiện Outlet" },
    ],
  },
];

// ========================================
// CATEGORY MENU COMPONENT
// ========================================

export default function CategoryMenu() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(categories[0].id);

  const activeCategory =
    categories.find((item) => item.id === activeId) ?? categories[0];

  // ESC để đóng menu
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Tự nhận diện danh mục có cấp 2 hoặc cấp 3
  const categoryChildren = activeCategory.children ?? [];

  const hasGroups = categoryChildren.some(
    (item) => item.children && item.children.length > 0,
  );

  const groups = hasGroups
    ? categoryChildren
        .filter((item) => item.children && item.children.length > 0)
        .map((item) => ({
          id: item.id,
          name: item.name,
          items: item.children ?? [],
        }))
    : [
        {
          id: activeCategory.id,
          name: "Danh mục",
          items: categoryChildren,
        },
      ];

  return (
    <>
      {/* TRIGGER */}
      <Button
        variant="outline"
        size="lg"
        rounded="lg"
        leftIcon={<Menu size={20} />}
        rightIcon={
          <ChevronDown
            size={17}
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
        className="
          h-12 min-w-[165px]
          justify-between
          border-zinc-200
          bg-white
          px-5
          font-semibold text-zinc-900
          shadow-sm
          hover:border-emerald-500
          hover:bg-emerald-50
          hover:text-emerald-800
        "
      >
        Danh mục
      </Button>

      {open && (
        <>
          {/* BACKDROP */}
          <button
            type="button"
            aria-label="Đóng menu danh mục"
            onClick={() => setOpen(false)}
            className="
              fixed inset-0 z-[60]
              cursor-default bg-black/40
            "
          />

          {/* MEGA MENU */}
          <div
            className="
              absolute left-0 right-0 top-full z-[70]
              mt-3
              flex h-[min(72vh,620px)] min-h-[360px]
              flex-col overflow-hidden
              rounded-xl border border-zinc-100
              bg-white
              shadow-[0_12px_40px_rgba(0,0,0,0.18)]
              md:flex-row
            "
          >
            {/* LEVEL 1: SIDEBAR */}
            <aside
              className="
                flex w-full shrink-0 gap-1
                overflow-x-auto border-b border-zinc-100 p-2
                md:w-[245px] md:flex-col
                md:overflow-x-hidden md:overflow-y-auto
                md:border-b-0 md:border-r md:p-3
              "
            >
              {categories.map((category) => {
                const Icon = categoryIcons[category.icon ?? "package"];
                const active = activeId === category.id;

                return (
                  <Button
                    key={category.id}
                    variant={active ? "soft" : "ghost"}
                    size="md"
                    rounded="lg"
                    leftIcon={<Icon size={20} />}
                    rightIcon={<ChevronRight size={17} />}
                    aria-pressed={active}
                    onMouseEnter={() => setActiveId(category.id)}
                    onClick={() => setActiveId(category.id)}
                    className={`
                      h-11 w-max shrink-0
                      justify-between
                      px-3 text-left text-sm
                      md:w-full
                      ${
                        active
                          ? "bg-emerald-50 text-emerald-800"
                          : "text-zinc-700"
                      }
                    `}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {category.name}
                    </span>
                  </Button>
                );
              })}
            </aside>

            {/* LEVEL 2 + 3: CONTENT */}
            <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-5">
              {/* TITLE */}
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-zinc-900">
                  {activeCategory.name}
                </h2>

                <Link
                  href={`/category/${activeCategory.id}`}
                  onClick={() => setOpen(false)}
                  className="
                    flex shrink-0 items-center gap-1
                    text-sm font-medium text-emerald-700
                    transition-colors hover:text-emerald-900
                  "
                >
                  Xem tất cả
                  <ChevronRight size={16} />
                </Link>
              </div>

              {/* CATEGORY GROUPS */}
              <div
                className="
                  grid grid-cols-1 gap-x-5 gap-y-6
                  sm:grid-cols-2 2xl:grid-cols-3
                "
              >
                {groups.map((group) => (
                  <section key={group.id} className="min-w-0">
                    <h3 className="mb-2 text-base font-semibold text-zinc-800">
                      {group.name}
                    </h3>

                    {/* LEVEL 3 ITEMS */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.items.map((item) => {
                        const ItemIcon = categoryIcons[item.icon ?? "package"];

                        return (
                          <Link
                            key={item.id}
                            href={item.href ?? `/category/${item.id}`}
                            onClick={() => setOpen(false)}
                            className="
                              flex min-h-[52px] min-w-0
                              items-center gap-2
                              rounded-lg border border-zinc-200
                              px-2 py-1.5
                              text-sm text-zinc-700
                              transition-all duration-150

                              hover:border-emerald-500
                              hover:bg-emerald-50
                              hover:text-emerald-800
                            "
                          >
                            {/* THUMBNAIL */}
                            <div
                              className="
                                flex h-9 w-9 shrink-0
                                items-center justify-center
                                overflow-hidden rounded-md
                                bg-zinc-50
                              "
                            >
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <ItemIcon
                                  size={21}
                                  strokeWidth={1.6}
                                  className="text-emerald-700"
                                />
                              )}
                            </div>

                            {/* NAME */}
                            <span className="min-w-0 flex-1 text-center leading-5">
                              {item.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              {groups.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Danh mục này chưa có sản phẩm.
                </p>
              )}
            </main>
          </div>
        </>
      )}
    </>
  );
}
