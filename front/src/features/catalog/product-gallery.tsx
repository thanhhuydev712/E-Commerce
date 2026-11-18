"use client";

import { useState } from "react";
import { Expand } from "lucide-react";
import { Dialog, ProductImage } from "@/src/components/storefront";
import { PhotoTilt } from "@/src/components/storefront/photo-tilt";
import type { Product } from "@/src/catalog/model";
import { STORE_IDENTITY } from "@/src/config/store-identity";

export function ProductGallery({ product }: { product: Product }) {
  const [zoom, setZoom] = useState(false);
  return (
    <>
      <div className="rf-detail-gallery flex w-full flex-col items-center gap-4 rounded-2xl border border-rf-border bg-white p-5">
        <span className="self-start rounded-full bg-rf-accent-soft px-3 py-1.5 text-xs font-semibold text-rf-accent">
          Ảnh catalog minh họa
        </span>
        <PhotoTilt>
          <div className="w-full [&>.rf-product-photo]:h-80 max-md:[&>.rf-product-photo]:h-64">
            <ProductImage product={product} />
          </div>
        </PhotoTilt>
        <p className="m-0 text-center text-xs leading-relaxed text-rf-muted">
          Rê chuột hoặc kéo để nghiêng ảnh nhẹ. Phím mũi tên để chỉnh góc, Home
          để đặt lại.
        </p>
        {product.variants.length > 1 && (
          <p className="m-0 text-center text-xs leading-relaxed text-rf-muted">
            Ảnh catalog hiện dùng chung cho các biến thể; cần đối chiếu ngoại
            hình thực tế.
          </p>
        )}
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label="Phóng to ảnh sản phẩm"
          className="rf-gallery-zoom inline-flex min-h-11 items-center gap-2 rounded-lg border border-rf-border bg-rf-bg px-4 py-2 text-rf-caption text-rf-accent hover:bg-rf-accent-soft"
        >
          <Expand size={18} aria-hidden="true" /> Xem ảnh lớn
        </button>
        <p className="m-0 text-center text-xs tracking-[0.1em] text-rf-muted">
          {STORE_IDENTITY.name} · PC, LAPTOP & GEAR
        </p>
      </div>
      {zoom && (
        <Dialog title="Ảnh minh họa sản phẩm" onClose={() => setZoom(false)}>
          <div className="rf-product-lightbox [&_.rf-product-photo]:h-[min(55vh,_500px)] [&_.rf-product-photo]:w-full">
            <ProductImage product={product} />
          </div>
          <p>{product.name}</p>
        </Dialog>
      )}
    </>
  );
}
