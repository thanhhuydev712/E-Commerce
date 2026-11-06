import { Suspense } from "react";
import { CheckoutPage } from "@/src/features/checkout/checkout-page";
export default function CheckoutRoute() {
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị đơn hàng…</p>}>
      <CheckoutPage />
    </Suspense>
  );
}
