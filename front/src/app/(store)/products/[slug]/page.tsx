import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getStorefront } from "@/src/catalog/server";
import { ProductDetail } from "@/src/features/catalog/product-detail";

// Fixture hữu hạn nên có thể dựng sẵn trang sản phẩm; không truy vấn backend.

async function ProductRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products } = await getStorefront();
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  return <ProductDetail key={product.id} product={product} />;
}

// params chỉ được đọc trong component con của Suspense để giữ instant navigation của Next.js.
export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị nội dung…</p>}>
      <ProductRoute {...props} />
    </Suspense>
  );
}
