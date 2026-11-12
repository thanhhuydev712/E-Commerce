"use client";
import { useRef, useState } from "react";
import { api } from "@/src/catalog/api-client";
import type { Order } from "@/src/providers/shop-provider";

export function StripePaymentActions({
  order,
  reload,
}: {
  order: Order;
  reload: () => void;
}) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (order.paymentMethod !== "STRIPE" || !order.canPay) return null;
  return (
    <div className="my-4 grid justify-items-center gap-3">
      <button
        type="button"
        disabled={pending}
        className="rounded bg-rf-green px-5 py-3 text-white disabled:opacity-60"
        onClick={async () => {
          if (busy.current) return;
          busy.current = true;
          setPending(true);
          setError("");
          try {
            const result = await api<{ url: string | null }>(
              `/me/orders/${order.id}/stripe-checkout`,
              { method: "POST" },
            );
            if (result.url) {
              const url = new URL(result.url);
              if (url.origin !== "https://checkout.stripe.com")
                throw new Error("Địa chỉ thanh toán không hợp lệ");
              window.location.assign(url.href);
            } else reload();
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Chưa mở được trang thanh toán",
            );
          } finally {
            busy.current = false;
            setPending(false);
          }
        }}
      >
        {pending ? "Đang mở Stripe…" : "Tiếp tục thanh toán Stripe test"}
      </button>
      <p className="text-sm">
        Bạn sẽ nhập thẻ thử nghiệm trên trang Stripe. Đơn được xác nhận khi
        backend kiểm tra thanh toán.
      </p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
