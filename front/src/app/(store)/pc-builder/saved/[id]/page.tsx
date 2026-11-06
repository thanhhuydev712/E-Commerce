import { Suspense } from "react";
import BuilderPage from "@/src/features/pc-builder/pc-builder-page";
async function SavedBuildRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BuilderPage key={id} savedId={id} />;
}

// params chỉ được đọc trong component con của Suspense để giữ instant navigation của Next.js.
export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị nội dung…</p>}>
      <SavedBuildRoute {...props} />
    </Suspense>
  );
}
