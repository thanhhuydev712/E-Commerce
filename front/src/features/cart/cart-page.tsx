"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { money } from "@/src/catalog/model";
import { useShop } from "@/src/providers/shop-provider";
import { Breadcrumb, Empty, ProductImage } from "@/src/components/storefront";
import { OrderSummary } from "@/src/features/checkout/components/order-summary";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  page_heading: [
    "rf-page-heading flex justify-between items-center mx-0 my-7.5 gap-5 [&_h1]:text-[32px] [&_h1]:tracking-[-1px]",
    "[&_h1]:leading-[1.2] [&_h1]:mt-2 [&_h1]:mb-2.5 [&_h1]:mx-0 [&_h1_small]:text-[20px] [&_h1_small]:text-rf-muted",
    "[&_p]:text-rf-muted [&_p]:text-[13px] [&_p]:mb-0 max-[768px]:flex-wrap max-[768px]:mx-0 max-[768px]:my-6",
    "max-[768px]:[&_h1]:text-[27px]",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
  cart_layout: [
    "rf-cart-layout grid grid-cols-[minmax(0,_1fr)_350px] items-start gap-6.25",
    "max-[1200px]:grid-cols-[minmax(0,_1fr)_300px] max-[1200px]:gap-4.5 max-[1024px]:grid-cols-[1fr]",
  ].join(" "),
  panel_cart_lines: [
    "rf-panel rf-cart-lines bg-rf-surface bg-none mb-5 px-5.5 py-6.5 border-rf-border border-solid border",
    "rounded-[var(--rf-radius)] [&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
  ].join(" "),
  cart_line: [
    "rf-cart-line flex items-center border-b [border-bottom-style:solid] border-b-rf-border py-5 gap-4.5 [&>a]:shrink-0",
    "[&>a]:w-25 [&_h3]:text-[12px] [&_h3]:leading-[1.6] [&_h3]:mx-0 [&_h3]:my-1 [&_small]:text-rf-muted",
    "[&_small]:text-[9px] [&_p]:text-[10px] [&_p]:text-rf-muted [&>strong]:text-[12px] [&>strong]:whitespace-nowrap",
    "max-[1200px]:flex-wrap max-[1200px]:[&>a]:w-18.75 max-[768px]:gap-3.5 max-[768px]:[&>strong]:ml-auto",
    "[&_.rf-product-art]:h-21.25 [&_.rf-product-art]:min-h-21.25 [&_.rf-component-art]:h-21.25",
    "[&_.rf-component-art]:min-h-21.25 [&_.rf-component-art>svg]:max-w-16.25 [&_.rf-component-art>svg]:max-h-16.25",
    "[&_.rf-component-art>span]:hidden [&>div:nth-child(2)]:flex-1 max-[1200px]:[&>div:nth-child(2)]:min-w-37.5",
    "max-[768px]:[&>div:nth-child(2)]:min-w-32.5 [&_.rf-product-photo]:h-21.25 [&_.rf-product-photo]:min-h-21.25",
  ].join(" "),
  quantity: [
    "rf-quantity inline-flex items-center h-10 shrink-0 border-[#dce4dd] border-solid border rounded-[5px]",
    "overflow-hidden [&_button]:grid [&_button]:place-items-center [&_button]:bg-[#f5f7f4] [&_button]:bg-none",
    "[&_button]:w-7.25 [&_button]:h-full [&_button]:border-current [&_button]:border-none [&_button]:[border-width:0]",
    "[&_span]:min-w-7.75 [&_span]:text-center [&_span]:text-[12px]",
  ].join(" "),
  icon_btn: [
    "rf-icon-btn inline-flex items-center justify-center bg-transparent bg-none min-w-9 min-h-9 p-2 border-current",
    "border-none [border-width:medium] rounded-[6px] print:hidden! hover:bg-[#edf4f0] hover:bg-none",
  ].join(" "),
  panel_summary: [
    "rf-panel rf-summary bg-rf-surface bg-none mb-5 p-6.5 border-rf-border border-solid border rounded-[var(--rf-radius)]",
    "[&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
  ].join(" "),
  coupon_form: [
    "rf-coupon-form [&>label]:flex [&>label]:items-center [&>label]:text-[12px] [&>label]:mb-2.25 [&>label]:gap-1.75",
    "[&>div]:flex [&_input]:w-full [&_input]:border-t [&_input]:[border-top-style:solid] [&_input]:border-t-rf-border",
    "[&_input]:[border-right-width:0] [&_input]:[border-right-style:none] [&_input]:border-r-current [&_input]:border-b",
    "[&_input]:[border-bottom-style:solid] [&_input]:border-b-rf-border [&_input]:border-l",
    "[&_input]:[border-left-style:solid] [&_input]:border-l-rf-border [&_input]:rounded-tl-[5px] [&_input]:rounded-tr-[0]",
    "[&_input]:rounded-br-[0] [&_input]:rounded-bl-[5px] [&_input]:text-[11px] [&_input]:p-2.5 [&_button]:bg-[#f1f8f2]",
    "[&_button]:bg-none [&_button]:text-rf-green [&_button]:text-[10px] [&_button]:whitespace-nowrap",
    "[&_button]:rounded-tl-[0] [&_button]:rounded-tr-[5px] [&_button]:rounded-br-[5px] [&_button]:rounded-bl-[0]",
    "[&_button]:px-3 [&_button]:py-2.5 [&_button]:border-[#b2d0bc] [&_button]:border-solid [&_button]:border",
  ].join(" "),
  btn_full: [
    "rf-btn rf-full inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-[12px] font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] w-full px-5.25 py-2.75 border-transparent border-solid",
    "border rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
};

// Dữ liệu nghiệp vụ từ CatalogProvider/ShopProvider kết nối API.
export function CartPage() {
  const { totalOf, variantById } = useCatalog();

  const shop = useShop();
  const [coupon, setCoupon] = useState("");
  const subtotal = totalOf(shop.cart);
  return (
    <>
      <Breadcrumb current="Giỏ hàng" />
      <div className={tw.page_heading}>
        <div>
          <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
            SẮP THÀNH CẤU HÌNH CỦA BẠN
          </span>
          <h1>
            Giỏ hàng của bạn{" "}
            <small>({shop.cart.reduce((s, l) => s + l.quantity, 0)})</small>
          </h1>
        </div>
        <Link href="/products" className={tw.text_link}>
          <ArrowLeft size={16} />
          Tiếp tục chọn sản phẩm
        </Link>
      </div>
      {!shop.cart.length ? (
        <Empty title="Giỏ hàng đang chờ cấu hình của bạn" />
      ) : (
        <div className={tw.cart_layout}>
          <div className={tw.panel_cart_lines}>
            {shop.cart.map((line) => {
              const { product, variant } = variantById(line.variantId)!;
              return (
                <article className={tw.cart_line} key={line.variantId}>
                  <Link href={`/products/${product.slug}`}>
                    <ProductImage product={product} />
                  </Link>
                  <div>
                    <small>{product.brand}</small>
                    <Link href={`/products/${product.slug}`}>
                      <h3>{product.name}</h3>
                    </Link>
                    <p>
                      {variant.label} · Bảo hành {product.warranty}
                    </p>
                    <strong className="rf-price-text text-rf-sale">
                      {money(variant.price)}
                    </strong>
                  </div>
                  <div className={tw.quantity}>
                    <button
                      aria-label={`Giảm ${product.name}`}
                      disabled={line.quantity <= 1}
                      onClick={() =>
                        shop.setQuantity(line.variantId, line.quantity - 1)
                      }
                    >
                      <Minus size={13} />
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      aria-label={`Tăng ${product.name}`}
                      disabled={line.quantity >= variant.stock}
                      onClick={() =>
                        shop.setQuantity(line.variantId, line.quantity + 1)
                      }
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <strong>
                    {money(BigInt(variant.price) * BigInt(line.quantity))}
                  </strong>
                  <button
                    className={tw.icon_btn}
                    aria-label={`Xóa ${product.name}`}
                    onClick={() => shop.setQuantity(line.variantId, 0)}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              );
            })}
            <div className="rf-cart-note flex items-start text-[11px] text-[#748178] pt-4.5 gap-2.25">
              <ShieldCheck size={17} />
              Giá được đọc từ cửa hàng. Giỏ chưa giữ tồn; giá và tồn được kiểm
              tra lại khi bạn xác nhận đặt hàng.
            </div>
          </div>
          <aside className={tw.panel_summary}>
            <h2>Tóm tắt đơn hàng</h2>
            <form
              className={tw.coupon_form}
              onSubmit={(e) => {
                e.preventDefault();
                shop.notify(
                  "Mã được chuyển sang checkout để server kiểm tra điều kiện áp dụng.",
                );
              }}
            >
              <label htmlFor="coupon">
                <Gift size={16} />
                Mã ưu đãi
              </label>
              <div>
                <input
                  id="coupon"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="RIGFORGE5"
                />
                <button>Áp dụng</button>
              </div>
            </form>
            <OrderSummary
              subtotal={String(subtotal)}
              discount="0"
              shipping="0"
              total={String(subtotal)}
              shippingLabel="Tính ở bước tiếp theo"
            />
            <Link
              className={tw.btn_full}
              href={`/checkout${coupon.trim() ? "?coupon=" + encodeURIComponent(coupon.trim().toUpperCase()) : ""}`}
            >
              Tiến hành đặt hàng <ArrowRight size={17} />
            </Link>
            <p className="rf-secure-note flex items-center justify-center text-rf-muted text-[9px] mt-3.75 mb-0 mx-0 gap-1.5">
              <LockKeyhole size={13} />
              Giá và ưu đãi được xác nhận tại checkout
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
