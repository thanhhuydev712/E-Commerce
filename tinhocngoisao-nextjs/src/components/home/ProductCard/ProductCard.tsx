import { Heart, ShoppingCart, Star } from "lucide-react";
import type { Product } from "../types";
type ProductCardProps = { product: Product; onAddToCart?: (product: Product) => void };
const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(price) + "₫";
export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg">
    <div className="relative aspect-square overflow-hidden bg-slate-50 p-4">
      {product.badge && <span className="absolute left-3 top-3 z-10 rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white">{product.badge}</span>}
      {product.discount && <span className="absolute right-3 top-3 z-10 rounded bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">-{product.discount}%</span>}
      <button type="button" aria-label={`Thêm ${product.name} vào yêu thích`} className="absolute right-3 bottom-3 z-10 grid size-9 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition hover:text-red-600"><Heart size={17}/></button>
      <a href={`/products/${product.slug}`} className="block size-full"><img src={product.image} alt={product.name} loading="lazy" className="size-full object-contain transition duration-500 group-hover:scale-105" /></a>
    </div>
    <div className="flex flex-1 flex-col p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-1 text-xs"><Star size={13} fill="currentColor" className="text-amber-400"/><span className="font-semibold text-slate-700">{product.rating ?? 4.8}</span><span className="ml-auto text-[10px] text-slate-400">Đã bán {product.sold ?? 0}</span></div>
      <a href={`/products/${product.slug}`} className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-800 hover:text-red-600">{product.name}</a>
      <ul className="mt-2 space-y-1 text-[11px] text-slate-500">{product.specs.slice(0,3).map((spec) => <li key={spec} className="truncate">• {spec}</li>)}</ul>
      <div className="mt-auto pt-4"><div className="flex flex-wrap items-baseline gap-2"><strong className="text-base font-black text-red-600">{formatPrice(product.price)}</strong>{product.originalPrice && <del className="text-xs text-slate-400">{formatPrice(product.originalPrice)}</del>}</div>
      <button type="button" onClick={() => onAddToCart?.(product)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-600 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white"><ShoppingCart size={15}/> Thêm vào giỏ</button></div>
    </div>
  </article>;
}
