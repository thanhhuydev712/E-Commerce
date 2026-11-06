import { Suspense } from "react";
import { CatalogPage } from "@/src/features/catalog/catalog-page";
async function BrandRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<p>Đang chuẩn bị sản phẩm…</p>}>
      <CatalogPage brand={slug} />
    </Suspense>
  );
}

// params chỉ được đọc trong component con của Suspense để giữ instant navigation của Next.js.
export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị nội dung…</p>}>
      <BrandRoute {...props} />
    </Suspense>
  );
}
