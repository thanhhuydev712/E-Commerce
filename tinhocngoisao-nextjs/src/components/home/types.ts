export type Product = {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  badge?: string;
  specs: string[];
  rating?: number;
  sold?: number;
  slug: string;
};

export type ProductSectionData = {
  id: string;
  title: string;
  subtitle?: string;
  accent?: string;
  products: Product[];
  viewAllHref?: string;
};

export type HomeCategory = {
  id: string;
  name: string;
  icon: string;
  href: string;
};
