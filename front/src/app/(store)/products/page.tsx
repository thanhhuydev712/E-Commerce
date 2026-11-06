import { Suspense } from "react";
import { CatalogPage } from "@/src/features/catalog/catalog-page";

export default function ProductsRoute() {
  // Bộ lọc đọc query string ở client, không chặn prerender phần layout tĩnh.
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị sản phẩm…</p>}>
      <CatalogPage />
    </Suspense>
  );
}
