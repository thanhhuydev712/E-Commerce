"use client";

import ProductPromotionSection, {
  type PromotionCampaign,
} from "./ProductPromotionSection";

import type { PromotionProduct } from "@/src/components/product/PromotionProductCard";

type Props = {
  campaigns: PromotionCampaign[];
};

export default function ProductPromotionSectionClient({ campaigns }: Props) {
  // Thêm vào giỏ hàng
  const handleAddToCart = (product: PromotionProduct) => {
    console.log("Thêm vào giỏ hàng:", product);

    // TODO: Kết nối với Cart Context / Zustand / API giỏ hàng.
  };

  // Mua ngay
  const handleBuyNow = (product: PromotionProduct) => {
    console.log("Mua ngay:", product);

    // TODO: Kết nối với logic chuyển đến trang thanh toán.
  };

  return (
    <ProductPromotionSection
      campaigns={campaigns}
      onAddToCart={handleAddToCart}
      onBuyNow={handleBuyNow}
    />
  );
}
