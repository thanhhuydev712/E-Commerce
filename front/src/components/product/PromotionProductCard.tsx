"use client";

import Image from "next/image";
import { ShoppingCart, Rocket } from "lucide-react";

import Button from "@/src/components/ui/Button/Button";

export type PromotionProduct = {
  id: number | string;
  name: string;
  image: string;
  alt: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  giftLabel?: string;
  specs?: string[];
};

type PromotionProductCardProps = {
  product: PromotionProduct;
  onAddToCart: (product: PromotionProduct) => void;
  onBuyNow: (product: PromotionProduct) => void;
};

const formatPrice = (price: number) => `${price.toLocaleString("vi-VN")}₫`;

export default function PromotionProductCard({
  product,
  onAddToCart,
  onBuyNow,
}: PromotionProductCardProps) {
  return (
    <article
      className="
        group flex h-full min-w-0 flex-col
        overflow-hidden rounded-xl
        border border-gray-200
        bg-white p-2.5 sm:p-3
        transition-all duration-300
        hover:border-red-200
        hover:shadow-[0_5px_18px_rgba(0,0,0,0.08)]
      "
    >
      {/* Product image */}
      <div
        className="
        relative w-full
        aspect-[1.1/1]
        overflow-hidden bg-white
      "
      >
        {product.discount && (
          <span
            className="
            absolute left-0 top-2 z-10
            rounded-r-md bg-red-600
            px-2.5 py-1.5
            text-xs font-bold text-white
          "
          >
            Giảm -{product.discount}%
          </span>
        )}

        {/* Gift badge */}
        {product.giftLabel && (
          <span
            className="
              absolute right-0 top-2 z-10
              rounded-full bg-sky-600
              px-2 py-1
              text-[9px] sm:text-[10px]
              font-bold text-white
              shadow-sm
            "
          >
            🎁 {product.giftLabel}
          </span>
        )}

        <Image
          src={product.image}
          alt={product.alt}
          fill
          sizes="
            (max-width: 639px) 78vw,
            (max-width: 767px) 48vw,
            (max-width: 1023px) 32vw,
            (max-width: 1535px) 24vw,
            16vw
          "
          loading="lazy"
          className="
            object-contain p-2
            transition-transform duration-300
            group-hover:scale-105
          "
        />
      </div>

      {/* Product name */}
      <h3
        className="
        mt-2 min-h-[44px]
        line-clamp-2
        text-center
        text-[13px] sm:text-sm
        font-semibold leading-5
        text-neutral-800
      "
      >
        {product.name}
      </h3>

      {/* Product price */}
      <div
        className="
        mt-2 flex flex-wrap
        items-center justify-center gap-2
      "
      >
        <span
          className="
          text-lg sm:text-xl
          font-extrabold text-red-600
        "
        >
          {formatPrice(product.price)}
        </span>

        {product.oldPrice && (
          <span
            className="
            text-[10px] sm:text-xs
            text-gray-400 line-through
          "
          >
            {formatPrice(product.oldPrice)}
          </span>
        )}
      </div>

      {/* Product specifications */}
      <div
        className="
        mt-2 min-h-[58px]
        grid grid-cols-2 content-start
        gap-x-1 gap-y-1
        rounded-lg bg-gray-100
        px-2 py-2
      "
      >
        {product.specs?.map((spec, index) => (
          <span
            key={index}
            className="
              min-w-0 truncate
              text-[10px] sm:text-xs
              leading-5 text-gray-600
            "
            title={spec}
          >
            {spec}
          </span>
        ))}
      </div>

      {/* Purchase actions */}
      <div
        className="
        mt-auto flex gap-2
        pt-4
      "
      >
        <Button
          type="button"
          variant="outline"
          size="md"
          rounded="md"
          iconOnly
          leftIcon={<ShoppingCart size={23} />}
          aria-label="Thêm vào giỏ hàng"
          onClick={() => onAddToCart(product)}
          className="
    !h-10 !w-10 shrink-0
    !border-red-500
    !bg-white !text-red-500
    hover:!bg-red-50
  "
        >
          <span className="sr-only">Thêm vào giỏ hàng</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="md"
          rounded="md"
          leftIcon={<Rocket size={19} />}
          onClick={() => onBuyNow(product)}
          className="
            !h-10 min-w-0 flex-1
            !bg-red-600
            !text-white
            text-xs sm:text-sm
            font-bold
            hover:!bg-red-700
            hover:!text-white
          "
        >
          MUA NGAY
        </Button>
      </div>
    </article>
  );
}
