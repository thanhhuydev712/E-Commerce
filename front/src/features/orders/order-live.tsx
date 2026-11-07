"use client";
import Link from "next/link";
import { useApiResource } from "@/src/hooks/use-api-resource";
import { useShop, type Order } from "@/src/providers/shop-provider";
import { money } from "@/src/catalog/model";
import { StripePaymentActions } from "@/src/features/checkout/stripe-payment-actions";
type OrderDetailData = Order & {
  history: {
    id: string;
    toStatus: string;
    reason: string | null;
    createdAt: string;
  }[];
  documents: {
    id: string;
    number: string | null;
    status: string;
    totalAmount: string;
  }[];
};
export function OrderDetail({ id, section }: { id: string; section?: string }) {
  const shop = useShop(),
    {
      data: order,
      error,
      reload,
    } = useApiResource<OrderDetailData>(`/me/orders/${id}`);
  if (error) return <p role="alert">{error}</p>;
  if (!order) return <p role="status">Đang tải đơn hàng…</p>;
  return (
    <section className="rf-panel rounded-lg border bg-white p-6">
      <h1>Đơn hàng {order.number}</h1>
      <nav className="my-4 flex flex-wrap gap-4">
        <Link href={`/account/orders/${id}`}>Thông tin đơn</Link>
        <Link href={`/account/orders/${id}/tracking`}>Theo dõi</Link>
        <Link href={`/account/orders/${id}/payment`}>Thanh toán</Link>
        <Link href={`/account/orders/${id}/documents`}>Chứng từ</Link>
      </nav>
      {section === "tracking" ? (
        <>
          <h2>Lịch sử xử lý</h2>
          {order.history.map((event) => (
            <article key={event.id}>
              <strong>{event.toStatus}</strong>
              <p>
                {new Date(event.createdAt).toLocaleString("vi-VN")} ·{" "}
                {event.reason}
              </p>
            </article>
          ))}
        </>
      ) : section === "documents" ? (
        <>
          <h2>Chứng từ</h2>
          {order.documents.length ? (
            order.documents.map((doc) => (
              <p key={doc.id}>
                {doc.number ?? "Chưa đánh số"} · {doc.status} ·{" "}
                {money(doc.totalAmount)}
              </p>
            ))
          ) : (
            <p>Chưa có chứng từ được phát hành.</p>
          )}
        </>
      ) : section === "payment" ? (
        <>
          <h2>{order.paymentMethod === "STRIPE" ? "Thanh toán Stripe test" : "Thanh toán COD"}</h2>
          <p>
            {order.payment === "paid"
              ? "Đã thanh toán"
              : order.paymentMethod === "STRIPE" ? "Chưa được xác nhận thanh toán Stripe." : "Chưa thanh toán; thu khi giao hàng."}
          </p>
          <p>Tổng tiền: {money(order.total)}</p>
          <StripePaymentActions order={order} reload={reload} />
        </>
      ) : (
        <>
          <p>Trạng thái: {order.backendStatus}</p>
          <p>
            Người nhận: {order.customer} · {order.address}
          </p>
          <div className="my-6 grid gap-4">
            {order.lines.map((line) => (
              <article key={line.id} className="border-b pb-3">
                <strong>{line.name}</strong>
                <p>
                  {line.quantity} × {money(line.price)}
                </p>
              </article>
            ))}
          </div>
          <dl>
            <div>Tạm tính: {money(order.subtotal)}</div>
            <div>Giảm giá: {money(order.discount)}</div>
            <div>Phí giao hàng: {money(order.shipping)}</div>
            <div>
              Tổng cộng: <strong>{money(order.total)}</strong>
            </div>
          </dl>
          {order.canCancel && (
            <button
              className="mt-5 rounded bg-red-700 px-5 py-3 text-white"
              onClick={async () => {
                await shop.cancelOrder(id);
                reload();
              }}
            >
              Hủy đơn hàng
            </button>
          )}
        </>
      )}
      <Link href="/account/orders" className="mt-6 block">
        Quay lại danh sách đơn
      </Link>
    </section>
  );
}
