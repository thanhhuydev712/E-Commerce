"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

import Button from "@/src/components/ui/Button/Button";

import HorizontalProductCarousel from "@/src/components/common/HorizontalProductCarousel";

import PromotionProductCard, {
  type PromotionProduct,
} from "@/src/components/product/PromotionProductCard";

// Dữ liệu từng danh mục
export type ProductCategory = {
  id: string;
  label: string;
  description?: string;

  products: PromotionProduct[];

  moreText?: string;
  moreHref?: string;
};

type CategoryProductSectionProps = {
  categories: ProductCategory[];

  // Aside hiện tại của bạn, giữ nguyên JSX
  aside: ReactNode;

  onAddToCart?: (product: PromotionProduct) => void;
  onBuyNow?: (product: PromotionProduct) => void;
};

export default function CategoryProductSection({
  categories,
  aside,
  onAddToCart,
  onBuyNow,
}: CategoryProductSectionProps) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");

  const activeCategory =
    categories.find((item) => item.id === activeId) ?? categories[0];

  if (!categories.length || !activeCategory) return null;

  // Xử lý giỏ hàng
  const handleAddToCart = (product: PromotionProduct) => {
    if (onAddToCart) {
      onAddToCart(product);
      return;
    }

    console.log("Thêm vào giỏ hàng:", product);
  };

  // Xử lý mua ngay
  const handleBuyNow = (product: PromotionProduct) => {
    if (onBuyNow) {
      onBuyNow(product);
      return;
    }

    console.log("Mua ngay:", product);
  };

  return (
    <section
      className="
      w-full min-w-0 overflow-hidden
      rounded-2xl bg-[#fff2e4]
      p-2 sm:p-3 lg:p-4
    "
    >
      {/* 1. Category buttons */}
      <div
        className="
        flex w-full gap-1
        overflow-x-auto overscroll-x-contain
        bg-white
        scrollbar-hide
        lg:grid lg:grid-cols-5
        lg:overflow-visible
      "
      >
        {categories.map((category) => {
          const isActive = activeCategory.id === category.id;

          return (
            <Button
              key={category.id}
              type="button"
              variant="ghost"
              size="lg"
              rounded="md"
              onClick={() => setActiveId(category.id)}
              aria-pressed={isActive}
              className={`
                !h-[70px]
                w-[135px] shrink-0
                px-3
                flex-col gap-1
                rounded-none
                border-b-2
                transition-all duration-200

                lg:w-full lg:min-w-0

                ${
                  isActive
                    ? `
                      border-orange-500
                      bg-orange-50
                      text-red-600
                      hover:bg-orange-50
                      hover:text-red-600
                    `
                    : `
                      border-transparent
                      bg-white
                      text-red-600
                      hover:bg-orange-50
                      hover:text-red-700
                    `
                }
              `}
            >
              <span
                className="
                text-sm sm:text-base
                font-semibold text-center
                whitespace-nowrap
              "
              >
                {category.label}
              </span>

              {category.description && (
                <span
                  className="
                  text-[11px] sm:text-xs
                  font-normal text-gray-700
                  text-center
                "
                >
                  {category.description}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* 2. Aside + Product carousel */}
      <div
        className="
        grid grid-cols-1
        gap-3
        py-3
        lg:grid-cols-[minmax(220px,0.23fr)_minmax(0,0.77fr)]
        lg:gap-3
        lg:items-stretch
      "
      >
        {/* Aside: giữ nguyên nội dung được truyền vào */}
        <aside
          className="
          w-full min-w-0
          overflow-hidden
          rounded-xl
        "
        >
          {aside}
        </aside>

        {/* Product area */}
        <div className="min-w-0">
          {/* View all */}
          {activeCategory.moreHref && (
            <div
              className="
              mb-2 flex justify-end
              px-2
            "
            >
              <Link
                href={activeCategory.moreHref}
                className="
                  text-sm font-medium
                  text-gray-800
                  transition-colors
                  hover:text-red-600
                "
              >
                {activeCategory.moreText ?? "Xem tất cả"} →
              </Link>
            </div>
          )}

          {/* Products */}
          {activeCategory.products.length > 0 ? (
            <HorizontalProductCarousel
              items={activeCategory.products}
              getKey={(product) => product.id}
              ariaLabel={`Sản phẩm ${activeCategory.label}`}
              itemClassName="
                w-[78%] min-w-[220px]
                sm:w-[calc((100%-12px)/2)]
                md:w-[calc((100%-24px)/3)]
                xl:w-[calc((100%-36px)/4)]
                2xl:w-[calc((100%-48px)/5)]
              "
              renderItem={(product) => (
                <PromotionProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                />
              )}
            />
          ) : (
            <div
              className="
              flex min-h-[250px]
              items-center justify-center
              rounded-xl bg-white
              text-sm text-gray-400
            "
            >
              Chưa có sản phẩm trong danh mục này.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
