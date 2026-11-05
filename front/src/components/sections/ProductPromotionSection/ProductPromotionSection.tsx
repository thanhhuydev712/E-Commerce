"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Button from "@/src/components/ui/Button/Button";

import HorizontalProductCarousel from "@/src/components/common/HorizontalProductCarousel";

import PromotionProductCard, {
  type PromotionProduct,
} from "@/src/components/product/PromotionProductCard";

export type PromotionCampaign = {
  id: string;

  eyebrow: string;
  badge: string;

  bannerImage: string;
  mobileBannerImage?: string;
  bannerAlt: string;

  moreText: string;
  moreHref: string;

  products: PromotionProduct[];
};

type ProductPromotionSectionProps = {
  campaigns: PromotionCampaign[];

  onAddToCart: (product: PromotionProduct) => void;
  onBuyNow: (product: PromotionProduct) => void;
};

export default function ProductPromotionSection({
  campaigns,
  onAddToCart,
  onBuyNow,
}: ProductPromotionSectionProps) {
  const [activeId, setActiveId] = useState(campaigns[0]?.id ?? "");

  const activeCampaign =
    campaigns.find((item) => item.id === activeId) ?? campaigns[0];

  if (!activeCampaign) return null;

  return (
    <section
      className="
      w-full min-w-0 overflow-hidden
      rounded-2xl bg-white
      p-3 sm:p-4 lg:p-5
      shadow-[0_5px_20px_rgba(0,0,0,0.06)]
    "
    >
      <div className="space-y-3 sm:space-y-4">
        {/* 1. Campaign tabs */}
        <div
          className="
          flex gap-2
          overflow-x-auto overscroll-x-contain
          pb-1
          scrollbar-hide
          md:grid md:grid-cols-4
          md:overflow-visible
        "
        >
          {campaigns.map((campaign) => {
            const isActive = activeId === campaign.id;

            return (
              <Button
                key={campaign.id}
                type="button"
                variant="ghost"
                size="md"
                rounded="lg"
                onClick={() => setActiveId(campaign.id)}
                aria-pressed={isActive}
                aria-label={`Chọn ${campaign.eyebrow}`}
                className={`
                  !h-[72px] sm:!h-[76px]
                  w-[145px] shrink-0
                  md:w-full md:min-w-0
                  flex-col gap-1
                  border-b-2 rounded-lg
                  transition-all duration-200

                  ${
                    isActive
                      ? `
                        border-orange-400
                        bg-orange-50
                        text-orange-700
                        hover:bg-orange-50
                        hover:text-orange-700
                      `
                      : `
                        border-transparent
                        bg-white
                        text-gray-700
                        hover:bg-orange-50
                        hover:text-orange-700
                      `
                  }
                `}
              >
                <span
                  className="
                  text-[10px] sm:text-xs
                  font-bold uppercase
                  text-red-600
                "
                >
                  {campaign.eyebrow}
                </span>

                <span
                  className="
                  inline-flex items-center
                  rounded-lg bg-[#ed2100]
                  px-4 py-1
                  text-sm sm:text-base
                  font-extrabold text-white
                  shadow-sm
                "
                >
                  {campaign.badge}
                </span>
              </Button>
            );
          })}
        </div>

        {/* 2. Promotion banner */}
        <div
          className="
          relative w-full min-w-0
          overflow-hidden
        "
        >
          {activeCampaign.mobileBannerImage ? (
            <>
              {/* Mobile banner */}
              <Image
                src={activeCampaign.mobileBannerImage}
                alt={activeCampaign.bannerAlt}
                width={800}
                height={200}
                sizes="100vw"
                className="
                  block h-auto w-full
                  md:hidden
                "
              />

              {/* Desktop banner */}
              <Image
                src={activeCampaign.bannerImage}
                alt={activeCampaign.bannerAlt}
                width={1662}
                height={70}
                sizes="100vw"
                className="
                  hidden h-auto w-full
                  md:block
                "
              />
            </>
          ) : (
            <Image
              src={activeCampaign.bannerImage}
              alt={activeCampaign.bannerAlt}
              width={1662}
              height={70}
              sizes="100vw"
              className="block h-auto w-full"
            />
          )}
        </div>

        {/* 3. Product carousel */}
        <HorizontalProductCarousel
          items={activeCampaign.products}
          getKey={(product) => product.id}
          ariaLabel={`Sản phẩm ${activeCampaign.eyebrow}`}
          itemClassName="
            w-[78%] min-w-[230px]
            sm:w-[calc((100%-12px)/2)]
            md:w-[calc((100%-24px)/3)]
            lg:w-[calc((100%-36px)/4)]
            2xl:w-[calc((100%-60px)/6)]
          "
          renderItem={(product) => (
            <PromotionProductCard
              product={product}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
            />
          )}
        />

        {/* 4. View more */}
        <div
          className="
          flex w-full
          items-center justify-center
          py-2 sm:py-3
        "
        >
          <Link
            href={activeCampaign.moreHref}
            className="
              text-center
              text-sm sm:text-base
              font-semibold
              text-blue-500
              transition-colors
              hover:text-blue-700
            "
          >
            {activeCampaign.moreText}
          </Link>
        </div>
      </div>
    </section>
  );
}
