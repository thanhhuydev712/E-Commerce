"use client";

import { useState } from "react";
import Header from "./Header/Header";
import HeroSection from "./HeroSection/HeroSection";
import PromotionGrid from "./PromotionGrid/PromotionGrid";
import ProductSection from "./ProductSection/ProductSection";
import CategoryGrid from "./CategoryGrid/CategoryGrid";
import NewsSection from "./NewsSection/NewsSection";
import Footer from "./Footer/Footer";
import { productSections } from "@/data/home-data";
import type { Product } from "./types";

export default function HomePage() {
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState("");

  // Demo state only. In production, move cart state to a cart store/API.
  const handleAddToCart = (product: Product) => {
    setCartCount((count) => count + 1);
    setNotice(`Đã thêm “${product.name}” vào giỏ hàng`);
    window.setTimeout(() => setNotice(""), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header cartCount={cartCount} />
      <main className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-5 lg:px-8">
        <HeroSection />
        <PromotionGrid />
        <div className="space-y-10 py-8 sm:space-y-14">
          {productSections.map((section) => (
            <ProductSection key={section.id} section={section} onAddToCart={handleAddToCart} />
          ))}
          <CategoryGrid />
          <NewsSection />
        </div>
      </main>
      <Footer />
      {notice && (
        <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          ✓ {notice}
        </div>
      )}
    </div>
  );
}
