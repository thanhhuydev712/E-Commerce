import { getStorefront } from "@/src/catalog/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { InformationPage } from "@/src/features/content/content-page";

async function InformationRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { pages } = await getStorefront();
  if (!pages.some((page) => page.slug === slug)) notFound();
  return <InformationPage slug={slug} />;
}

// params chỉ được đọc trong component con của Suspense để giữ instant navigation của Next.js.
export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị nội dung…</p>}>
      <InformationRoute {...props} />
    </Suspense>
  );
}
