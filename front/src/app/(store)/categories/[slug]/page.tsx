import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getStorefront } from "@/src/catalog/server";
import { CatalogPage } from "@/src/features/catalog/catalog-page";

async function CategoryRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { categories } = await getStorefront();
  if (!categories.some((category) => category.id === slug)) notFound();
  return (
    <Suspense fallback={<p>Đang chuẩn bị danh mục…</p>}>
      <CatalogPage category={slug} />
    </Suspense>
  );
}

// params chỉ được đọc trong component con của Suspense để giữ instant navigation của Next.js.
export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị nội dung…</p>}>
      <CategoryRoute {...props} />
    </Suspense>
  );
}
