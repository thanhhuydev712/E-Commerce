"use client";
import Link from "next/link";
import { ArrowRight, CircleCheck, CircleX, Clock3 } from "lucide-react";
import { money } from "@/src/catalog/model";
import { useShop } from "@/src/providers/shop-provider";
import type { Order } from "@/src/providers/shop-provider";
import { useApiResource } from "@/src/hooks/use-api-resource";
import { Breadcrumb, Empty } from "@/src/components/storefront";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  result_panel: [
    "rf-result rf-panel bg-rf-surface bg-none w-full text-center px-10 py-15 mx-auto my-13.75 border-rf-border",
    "border-solid border rounded-[var(--rf-radius)] [&_h2]:text-[19px] [&_h1]:text-[30px] [&_h1]:tracking-[-0.7px]",
    "[&_h1]:mt-4.5 max-[768px]:px-5.5 max-[768px]:py-8.75 max-[768px]:my-7.5 [&>svg]:mb-5 [&_p]:text-rf-muted",
    "[&_p]:text-[12px] max-[768px]:[&_h1]:text-[25px] [&>.rf-eyebrow]:flex [&>.rf-eyebrow]:justify-center",
    "[&_.rf-form-actions]:justify-center",
  ].join(" "),
  result_paid_result_pending_result_failed_result_count: [
    "[&.rf-result-paid]:text-rf-green [&.rf-result-pending]:text-[#a07f3a] [&.rf-result-failed]:text-rf-red",
    "[&.rf-result-count]:text-[12px] [&.rf-result-count]:text-rf-muted [&.rf-result-count]:mx-0 [&.rf-result-count]:my-3",
  ].join(" "),
  btn: [
    "rf-btn inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-[12px] font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-transparent border-solid border",
    "rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
  btn_btn_outline: [
    "rf-btn rf-btn-outline inline-flex items-center justify-center min-h-11 bg-transparent bg-none text-rf-text",
    "text-[12px] font-bold leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-rf-border",
    "border-solid border rounded-[6px] gap-2.5 print:hidden hover:bg-[#edf4ef] hover:bg-none hover:border-[#9ccab5]",
  ].join(" "),
};

// Dữ liệu nghiệp vụ từ CatalogProvider/ShopProvider kết nối API.
export function PaymentResult({ id }: { id: string }) {
  const shop = useShop();
  const { data: order, error } = useApiResource<Order>(`/me/orders/${id}`);
  if (!shop.ready) return <p role="status">Đang khôi phục tài khoản…</p>;
  if (!shop.user)
    return (
      <Empty
        title="Đăng nhập để xem đơn hàng"
        href="/login?next=/account/orders"
        label="Đăng nhập"
      />
    );
  if (error) return <p role="alert">{error}</p>;
  if (!order) return <p role="status">Đang tải trạng thái đơn từ backend…</p>;
  const Icon =
    order.payment === "paid"
      ? CircleCheck
      : order.payment === "failed"
        ? CircleX
        : Clock3;
  return (
    <>
      <Breadcrumb current="Kết quả đặt hàng" />
      <section className={tw.result_panel}>
        <Icon
          size={64}
          strokeWidth={1.3}
          className={
            `rf-result-${order.payment}` +
            " " +
            tw.result_paid_result_pending_result_failed_result_count
          }
        />
        <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
          ĐƠN HÀNG CỦA BẠN
        </span>
        <h1>
          {order.payment === "paid"
            ? "Cấu hình mới đã có điểm bắt đầu!"
            : order.payment === "failed"
              ? "Đơn đã tạo, thanh toán chưa thành công."
              : "Đơn đã tạo, đang chờ xác nhận thanh toán."}
        </h1>
        <p>
          Mã đơn <strong>{id}</strong> · Tổng cộng{" "}
          <strong>{money(order.total)}</strong>
        </p>
        <p>Trạng thái được xác minh từ backend. COD chưa ghi nhận thu tiền.</p>
        <div className="rf-form-actions flex items-center flex-wrap mt-5.5 gap-3">
          <Link href={`/account/orders/${id}`} className={tw.btn}>
            Xem chi tiết đơn <ArrowRight size={17} />
          </Link>
          <Link href="/products" className={tw.btn_btn_outline}>
            Tiếp tục khám phá
          </Link>
        </div>
      </section>
    </>
  );
}
