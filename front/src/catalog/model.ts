import type { Presentation } from "./presentation";
export type CategoryId = string;
export type Category = {
  id: string;
  databaseId: string;
  name: string;
  short: string;
  icon: string;
};
export type Variant = {
  id: string;
  sku: string;
  label: string;
  price: string;
  oldPrice: string;
  stock: number;
};
export type Specs = {
  socket?: string;
  ddr?: string;
  form?: string;
  watts?: number;
  length?: number;
  clearance?: number;
  gpuMax?: number;
  coolerMax?: number;
  capacity?: number;
  slots?: number;
  integrated?: boolean;
};
export type Product = {
  id: string;
  databaseId: string;
  slug: string;
  name: string;
  category: CategoryId;
  brand: string;
  price: string;
  oldPrice: string;
  image: string;
  specs: string[];
  technical: Specs;
  builderEligible: boolean;
  variants: Variant[];
  stock: number;
  warranty: string;
  reviews: { id: string; rating: number; title: string | null; body: string }[];
  badge?: string;
};
export type Article = {
  id: string;
  databaseId: string;
  title: string;
  tag: string;
  image: string;
  content: string;
};
export type StorefrontSnapshot = {
  products: Product[];
  categories: Category[];
  articles: Article[];
  pages: { slug: string; title: string; body: { paragraphs: string[] } }[];
  presentation: Omit<Presentation, "featuredDeals" | "upgradeProducts"> & {
    featuredDeals: string[];
    upgradeProducts: string[];
  };
};
export const money = (amount: string | bigint) =>
  `${BigInt(amount).toLocaleString("vi-VN")}₫`;
