import Header from "../../components/layout/header/Header";
import Footer from "../../components/layout/footer/Footer";
import BannerSlider, { type BannerSlide } from "./bannerslider/BannerSlider";
import ServicePromoImages from "@/src/components/common/ServicePromoImages";
import FlashSale from "@/src/components/sections/FlashSale/FlashSale";
import { monitorCampaigns } from "@/src/components/data/promotionData";
import ProductPromotionSectionClient from "@/src/components/sections/ProductPromotionSection/ProductPromotionSectionClient";
import CategoryProductSection from "@/src/components/sections/CategoryProductSection/CategoryProductSection";
import { pcCategories } from "@/src/components/data/categoryProductData";

// Import component aside hiện tại của bạn
import PcPromoAside from "@/src/components/sections/CategoryProductSection/PcPromoAside";

const banners: BannerSlide[] = [
  {
    id: 1,
    image: "/images/banners/banner-slider1.webp",
    alt: "Khuyến mãi gaming gear",
    tabTitle: "KHUYẾN MÃI GAMING GEAR",
    tabDescription: "Giảm giá lên đến 1.1 triệu!!!",
  },
  {
    id: 2,
    image: "/images/banners/banner-slider2.webp",
    alt: "Trả góp PC Laptop",
    tabTitle: "TRẢ GÓP PC - LAPTOP",
    tabDescription: "Trả trước 0Đ, trợ giá đến 500.000đ!!!",
  },
  {
    id: 3,
    image: "/images/banners/banner-slider3.webp",
    alt: "Ưu đãi thẻ Sacombank",
    tabTitle: "ƯU ĐÃI THẺ SACOMBANK",
    tabDescription: "Giảm thêm đến 500.000đ khi mua hàng!!!",
  },
  {
    id: 4,
    image: "/images/banners/banner-slider4.webp",
    alt: "PC STAR Powered by ASUS",
    tabTitle: "PC STAR Powered by ASUS",
    tabDescription: "Bứt phá giới hạn cùng AI!!!",
  },
  {
    id: 5,
    image: "/images/banners/banner-slider5.webp",
    alt: "GeForce RTX AI PCs",
    tabTitle: "GeForce RTX AI PCs",
    tabDescription: "Trải nghiệm AI tiên tiến nhất hiện nay!!!",
  },
  {
    id: 6,
    image: "/images/banners/banner-slider6.webp",
    alt: "Khuyến mãi công nghệ",
    tabTitle: "ƯU ĐÃI CÔNG NGHỆ",
    tabDescription: "Nhiều ưu đãi hấp dẫn!!!",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1620px] px-4">
        <BannerSlider slides={banners} autoPlay interval={5000} />
        <div className="mt-6">
          <ServicePromoImages />
          <FlashSale />
        </div>

        <ProductPromotionSectionClient campaigns={monitorCampaigns} />

        <CategoryProductSection
          categories={pcCategories}
          aside={<PcPromoAside />}
        />
      </main>
      <Footer />
    </>
  );
}
