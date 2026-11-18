"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductRail } from "./product-rail";

export function FlashSaleSection() {
  const { featuredDeals } = useCatalog().presentation;
  const products = featuredDeals.slice(0, 6);
  return (
    <section
      className="rf-reference-flash rounded-3xl bg-[linear-gradient(145deg,#ece5ff,#f9efff_55%,#e3faff)] p-4 md:p-7"
      aria-labelledby="flash-title"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-rf-caption font-semibold tracking-[0.2em] text-rf-accent">
            THE HARDWARE EDIT
          </p>
          <h2
            id="flash-title"
            className="m-0 text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Đáng để nâng cấp.
          </h2>
        </div>
        <Link
          href="/products"
          className="inline-flex min-h-11 items-center gap-2 text-rf-body font-semibold text-rf-accent hover:text-rf-accent-hover"
        >
          Tất cả sản phẩm <ArrowUpRight size={17} />
        </Link>
      </div>
      {products.length ? (
        <div className="rf-flash-products [&_.rf-reference-card]:border [&_.rf-reference-card]:border-rf-border [&_.rf-reference-card]:bg-rf-surface [&_.rf-reference-card-flash]:min-h-0 [&_.rf-reference-card-flash]:p-3 [&_.rf-reference-card-flash_.rf-product-photo]:h-40 [&_.rf-reference-card-flash_.rf-reference-card-price_del]:mt-1 md:[&_.rf-reference-card-flash_.rf-product-photo]:h-48">
          <ProductRail products={products} variant="flash" />
        </div>
      ) : (
        <div className="rounded-xl border border-rf-border bg-rf-surface p-8 text-center">
          <p className="mb-3 text-rf-muted">
            Sản phẩm nổi bật đang được cập nhật.
          </p>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center text-rf-body font-semibold text-rf-accent"
          >
            Khám phá cửa hàng <ArrowUpRight size={17} />
          </Link>
        </div>
      )}
    </section>
  );
}
