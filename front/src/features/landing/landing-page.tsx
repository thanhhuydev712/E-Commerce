import { HeroSection } from "./components/hero-section";
import { ServiceHighlights } from "./components/service-highlights";
import { FlashSaleSection } from "./components/flash-sale-section";
import { CampaignSection } from "./components/campaign-section";
import { CategoryShelves } from "./components/category-shelves";

import { CatalogDirectory } from "./components/catalog-directory";
import { PartnerBrands } from "./components/partner-brands";
import { PromotionsOverview } from "./components/promotions-overview";
import { ReferenceJournal } from "./components/reference-journal";
import { FloatingSupport } from "./components/floating-support";

/** Ghép đúng thứ tự các vùng của ảnh; nội dung và sản phẩm lấy từ CatalogProvider/API. */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ServiceHighlights />
      <FlashSaleSection />
      <CampaignSection />
      <CategoryShelves />
      <CatalogDirectory />
      <PartnerBrands />
      <PromotionsOverview />
      <ReferenceJournal />
      <FloatingSupport />
    </>
  );
}
