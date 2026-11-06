import type { Product } from "./model";
// Contract nội dung public từ database, không chứa bản ghi mẫu runtime.
export type Presentation = {
  heroCampaigns: Array<{
    id: string;
    eyebrow: string;
    heading: string;
    highlight: string;
    description: string;
    category: string;
    href: string;
    action: string;
    price: string;
  }>;
  featuredDeals: Product[];
  upgradeProducts: Product[];
  collectionTabs: Array<{ id: string; label: string }>;
  partnerBrands: Array<string>;
  bannerCampaigns: Array<{
    id: string;
    title: string;
    subtitle: string;
    image: string;
    alt: string;
    href: string;
  }>;
  shelves: Array<{
    id: string;
    label: string;
    headline: string;
    imageCategory: string;
    tone: "mint" | "ice";
    tabs: Array<{
      id: string;
      label: string;
      categories: Array<string>;
      ids?: Array<string>;
      match?: string;
    }>;
  }>;
  storeMenu: Array<{
    id: string;
    label: string;
    icon: string;
    href: string;
    groups: Array<{
      label: string;
      links: Array<{ label: string; href: string }>;
    }>;
  }>;
  informationPages: {
    installments: { title: string; paragraphs: Array<string> };
    about: { title: string; paragraphs: Array<string> };
    shipping: { title: string; paragraphs: Array<string> };
    returns: { title: string; paragraphs: Array<string> };
    warranty: { title: string; paragraphs: Array<string> };
    privacy: { title: string; paragraphs: Array<string> };
  };
  showrooms: Array<{
    name: string;
    location: string;
    region: string;
    city: string;
  }>;
  starterBuild: {
    cpu: string;
    mainboard: string;
    ram: string;
    gpu: string;
    ssd: string;
    psu: string;
    case: string;
    cooler: string;
  };
  shipping: { standard: string; express: string; freeAbove: string };
  paymentMethods: string[];
};
