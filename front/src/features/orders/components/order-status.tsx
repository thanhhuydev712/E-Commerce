"use client";
import type { Order } from "@/src/providers/shop-provider";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  status: [
    "inline-flex bg-[#e6f3e8] bg-none text-[#37784a] text-[10px] px-2 py-1 rounded-[4px] [&.warn]:bg-[#faf1da]",
    "[&.warn]:bg-none [&.warn]:text-[#8e7332] [&.neutral]:bg-[#eceded] [&.neutral]:bg-none [&.neutral]:text-[#748077]",
  ].join(" "),
};

// Dữ liệu nghiệp vụ từ CatalogProvider/ShopProvider kết nối API.
export function OrderStatus({ order }: { order: Order }) {
  return (
    <div className="rf-status-row flex flex-wrap my-3 gap-1.75">
      <span
        className={
          `rf-status ${order.status === "cancelled" ? "neutral" : ""}` +
          " " +
          tw.status
        }
      >
        {order.status === "cancelled" ? "Đã hủy" : "Đang xử lý"}
      </span>
      <span
        className={
          `rf-status ${order.payment === "paid" ? "" : "warn"}` +
          " " +
          tw.status
        }
      >
        {order.payment === "paid"
          ? "Đã thanh toán"
          : order.payment === "failed"
            ? "Thanh toán thất bại"
            : "Chờ thanh toán"}
      </span>
    </div>
  );
}
