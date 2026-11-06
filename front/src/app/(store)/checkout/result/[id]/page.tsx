import { Suspense } from "react";
import { PaymentResult } from "@/src/features/checkout/payment-result";
async function PaymentResultRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PaymentResult id={id} />;
}

// params chỉ được đọc trong component con của Suspense để giữ instant navigation của Next.js.
export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị nội dung…</p>}>
      <PaymentResultRoute {...props} />
    </Suspense>
  );
}
