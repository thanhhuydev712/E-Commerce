import type { Product, CategoryId } from "@/src/catalog/model";

export type ShelfTab = {
  id: string;
  label: string;
  categories: CategoryId[];
  match?: string;
  ids?: string[];
};
export type ShelfDefinition = {
  id: string;
  label: string;
  headline: string;
  imageCategory: CategoryId;
  tone: "mint" | "ice";
  tabs: ShelfTab[];
};

export function productsForTab(tab: ShelfTab, products: Product[]) {
  if (tab.ids)
    return tab.ids.flatMap((id) => {
      const product = products.find((item) => item.id === id);
      return product ? [product] : [];
    });
  const matcher = tab.match ? new RegExp(tab.match, "i") : null;
  const matches = products.filter(
    (product) =>
      tab.categories.includes(product.category) &&
      (!matcher || matcher.test(`${product.name} ${product.specs.join(" ")}`)),
  );
  // Ảnh catalogue local lên trước; sản phẩm kỹ thuật dùng cho tab chuyên biệt.
  return [
    ...matches.filter((product) => product.id.startsWith("demo-")),
    ...matches.filter((product) => !product.id.startsWith("demo-")),
  ].slice(0, 12);
}
