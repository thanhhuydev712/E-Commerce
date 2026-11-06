"use client";
import { money } from "@/src/catalog/model";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  summary_list: [
    "rf-summary-list mx-0 my-5 [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:text-[12px] [&>div]:mx-0",
    "[&>div]:my-3.5 [&>div]:gap-3.75 [&_dt]:text-rf-muted [&_dd]:font-semibold [&_dd]:text-right [&_dd]:m-0",
    "[&>small]:text-[#8d988f] [&>small]:text-[10px] [&>.rf-summary-total]:border-t",
    "[&>.rf-summary-total]:[border-top-style:solid] [&>.rf-summary-total]:border-t-rf-border [&>.rf-summary-total]:pt-4.5",
    "[&>.rf-summary-total]:mt-4.5",
  ].join(" "),
};

// Dữ liệu nghiệp vụ từ CatalogProvider/ShopProvider kết nối API.
export function OrderSummary({
  subtotal,
  discount,
  shipping,
  total,
  shippingLabel,
}: {
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  shippingLabel?: string;
}) {
  return (
    <dl className={tw.summary_list}>
      <div>
        <dt>Tạm tính</dt>
        <dd>{money(subtotal)}</dd>
      </div>
      <div>
        <dt>Giảm giá</dt>
        <dd>-{money(discount)}</dd>
      </div>
      <div>
        <dt>Giao hàng</dt>
        <dd>
          {shippingLabel ?? (shipping === "0" ? "Miễn phí" : money(shipping))}
        </dd>
      </div>
      <div className="rf-summary-total [&_dd]:text-rf-sale [&_dd]:text-[22px]">
        <dt>Tổng cộng</dt>
        <dd>{money(total)}</dd>
      </div>
      <small>Giá demo · Không phát sinh giao dịch thật</small>
    </dl>
  );
}
