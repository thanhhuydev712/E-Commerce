"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import { useState } from "react";
import { ProductCard, SectionTitle } from "@/src/components/storefront";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  tabs: [
    "rf-tabs flex mb-5.5 overflow-x-auto pb-0.5 gap-2.25 [&>button]:whitespace-nowrap [&>button]:text-[11px]",
    "[&>button]:font-semibold [&>button]:bg-white [&>button]:bg-none [&>button]:text-[#5c6b61] [&>button]:px-4.5",
    "[&>button]:py-2.25 [&>button]:border-[#dde4df] [&>button]:border-solid [&>button]:border [&>button]:rounded-[5px]",
    "[&>a]:whitespace-nowrap [&>a]:text-[11px] [&>a]:font-semibold [&>a]:bg-white [&>a]:bg-none [&>a]:text-[#5c6b61]",
    "[&>a]:px-4.5 [&>a]:py-2.25 [&>a]:border-[#dde4df] [&>a]:border-solid [&>a]:border [&>a]:rounded-[5px]",
    "max-[768px]:mb-4.25 max-[768px]:gap-1.75 max-[768px]:[&>button]:text-[10px] max-[768px]:[&>button]:px-3.25",
    "max-[768px]:[&>button]:py-2 max-[768px]:[&>a]:text-[10px] max-[768px]:[&>a]:px-3.25 max-[768px]:[&>a]:py-2",
    "[&>.active]:bg-[#1e5b3c] [&>.active]:bg-none [&>.active]:text-white [&>.active]:border-[#1e5b3c]",
  ].join(" "),
  product_grid_grid_five: [
    "rf-product-grid rf-grid-five grid grid-cols-[repeat(5,_minmax(0,_1fr))] gap-3.25",
    "max-[1200px]:grid-cols-[repeat(5,_minmax(0,_1fr))] max-[1200px]:gap-2.25",
    "max-[1024px]:grid-cols-[repeat(3,_minmax(0,_1fr))] max-[1024px]:gap-3",
    "max-[768px]:grid-cols-[repeat(2,_minmax(0,_1fr))] max-[768px]:gap-2.25",
    "max-[1024px]:[&>.rf-product-card:nth-child(n+4)]:hidden max-[768px]:[&>.rf-product-card:nth-child(n+4)]:block",
    "max-[768px]:[&>.rf-product-card:last-child:nth-child(odd)]:hidden",
  ].join(" "),
};

/** Category ID đồng thời quyết định sản phẩm hiển thị và URL “Xem tất cả”. */
export function FeaturedCollections() {
  const { products } = useCatalog();
  const { collectionTabs } = useCatalog().presentation;

  const [activeTab, setActiveTab] = useState(collectionTabs[0].id);
  const visibleProducts = products
    .filter((product) => product.category === activeTab)
    .slice(0, 5);

  return (
    <section className="rf-section rf-catalog-section mt-11 max-[768px]:mt-8">
      <SectionTitle
        title="Cấu hình nào dành cho bạn?"
        eyebrow="HIỆU NĂNG THEO CÁCH CỦA BẠN"
        href={`/products?category=${activeTab}`}
      />
      <div className={tw.tabs} aria-label="Chọn nhóm sản phẩm">
        {collectionTabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            aria-pressed={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={tw.product_grid_grid_five} aria-live="polite">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
