import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getStorefront } from "@/src/catalog/server";
import { ArticlesPage } from "@/src/features/content/content-page";

async function ArticleRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { articles } = await getStorefront();
  if (!articles.some((article) => article.id === slug)) notFound();
  return <ArticlesPage slug={slug} />;
}

// params chỉ được đọc trong component con của Suspense để giữ instant navigation của Next.js.
export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị nội dung…</p>}>
      <ArticleRoute {...props} />
    </Suspense>
  );
}
