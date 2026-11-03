import { ArrowRight } from "lucide-react";
import type { Product, ProductSectionData } from "../types";
import ProductCard from "../ProductCard/ProductCard";
type ProductSectionProps = { section: ProductSectionData; onAddToCart?: (product: Product) => void };
export default function ProductSection({ section, onAddToCart }: ProductSectionProps) {
  return <section id={section.id} className="scroll-mt-28">
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
      <div>{section.accent && <span className="mb-1 block text-[10px] font-black tracking-[.18em] text-red-600">{section.accent}</span>}<h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{section.title}</h2>{section.subtitle && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{section.subtitle}</p>}</div>
      <a className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 sm:text-sm" href={section.viewAllHref ?? "/products"}>Xem tất cả <ArrowRight size={15}/></a>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">{section.products.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart}/>)}</div>
  </section>;
}
