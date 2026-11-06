"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/src/components/storefront";
import type { Product } from "@/src/catalog/model";
import { motion } from "@/src/components/ui/motion";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_rail_rail_columns_6: [
    "relative min-w-0",
    "[&.rf-rail-columns-6_.rf-reference-rail-viewport>.rf-reference-card]:basis-[calc((100%_-_60px)_/_6)]",
    "max-[1024px]:[&.rf-rail-columns-6_.rf-reference-rail-viewport>.rf-reference-card]:basis-[calc((100%_-_24px)_/_3)]",
    "max-[768px]:[&.rf-rail-columns-6_.rf-reference-rail-viewport>.rf-reference-card]:basis-[calc((100%_-_9px)_/_2)]",
  ].join(" "),
  reference_rail_viewport: [
    "rf-reference-rail-viewport flex overflow-x-auto [scrollbar-width:none] [scroll-snap-type:x_proximity] gap-3",
    "max-[768px]:gap-2.25 [&::-webkit-scrollbar]:hidden [&>.rf-reference-card]:flex-[0_0_calc((100%_-_48px)_/_5)]",
    "[&>.rf-reference-card]:[scroll-snap-align:start] max-[1024px]:[&>.rf-reference-card]:basis-[calc((100%_-_24px)_/_3)]",
    "max-[768px]:[&>.rf-reference-card]:basis-[calc((100%_-_9px)_/_2)]",
  ].join(" "),
  rail_arrow: [
    "rf-rail-arrow previous absolute top-[45%] [transform:translateY(-50%)] w-10.5 h-10.5 bg-[#142c34a3] bg-none",
    "text-white grid place-items-center z-2 border-current border-none [border-width:0] rounded-full max-[768px]:w-8",
    "max-[768px]:h-9 [&.previous]:left-0.75 [&.next]:right-0.75",
  ].join(" "),
  rail_arrow2: [
    "rf-rail-arrow next absolute top-[45%] [transform:translateY(-50%)] w-10.5 h-10.5 bg-[#142c34a3] bg-none text-white",
    "grid place-items-center z-2 border-current border-none [border-width:0] rounded-full max-[768px]:w-8 max-[768px]:h-9",
    "[&.previous]:left-0.75 [&.next]:right-0.75",
  ].join(" "),
};

/** Cuộn rail theo chiều rộng card thực tế; CSS quyết định 2/3/5/6 card theo thiết bị. */
export function ProductRail({
  products,
  columns = 5,
  variant = "shelf",
}: {
  products: Product[];
  columns?: 5 | 6;
  variant?: "shelf" | "flash";
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const sync = () => {
    const el = viewport.current;
    if (el) {
      setCanBack(el.scrollLeft > 3);
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 3);
    }
  };
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    el.scrollLeft = 0;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [products]);
  const move = (direction: number) => {
    const el = viewport.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    el.scrollBy({
      left: direction * ((card?.offsetWidth ?? el.clientWidth / 2) + 12),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  return (
    <div
      key={products.map((product) => product.id).join(",")}
      className={
        `rf-reference-rail rf-rail-columns-${columns}` +
        " " +
        tw.reference_rail_rail_columns_6 +
        " " +
        motion.enter
      }
    >
      <div
        className={tw.reference_rail_viewport}
        ref={viewport}
        onScroll={sync}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variant={variant} />
        ))}
      </div>
      {canBack && (
        <button
          className={tw.rail_arrow}
          aria-label="Sản phẩm trước"
          onClick={() => move(-1)}
        >
          <ChevronLeft size={23} />
        </button>
      )}
      {canNext && (
        <button
          className={tw.rail_arrow2}
          aria-label="Sản phẩm tiếp theo"
          onClick={() => move(1)}
        >
          <ChevronRight size={23} />
        </button>
      )}
    </div>
  );
}
