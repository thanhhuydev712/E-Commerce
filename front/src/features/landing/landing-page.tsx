import { FlashSaleSection } from "./components/flash-sale-section";
import { CatalogDirectory } from "./components/catalog-directory";
import { FloatingSupport } from "./components/floating-support";
import { ForgeIntro } from "./components/forge-intro";
import { ForgeStudio } from "./components/forge-studio";
import { ForgeJournal } from "./components/forge-journal";
import { PartnerBrands } from "./components/partner-brands";
import { LandingMotion } from "./components/landing-motion";
import { motion } from "@/src/components/ui/motion";
import { ProductCollections } from "./components/product-collections";

/** Showroom thương hiệu; giá, tồn và chiến dịch vẫn đọc từ CatalogProvider/API. */
export default function LandingPage() {
  return (
    <div
      className={`rf-forge-home space-y-10 pt-4 md:space-y-14 md:pt-5 ${motion.landing}`}
    >
      <ForgeIntro />
      <FlashSaleSection />
      <ProductCollections />
      <ForgeStudio />
      <CatalogDirectory />
      <ForgeJournal />
      <PartnerBrands />
      <FloatingSupport />
      <LandingMotion />
    </div>
  );
}
