"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/src/catalog/api-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { money } from "@/src/catalog/model";
import { useShop } from "@/src/providers/shop-provider";
import { Breadcrumb, Empty, ProductImage } from "@/src/components/storefront";
import { OrderSummary } from "./components/order-summary";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  empty: [
    "rf-empty flex items-center flex-col text-center bg-white bg-none px-6 py-17.5 border-[#d5e1db] border-dashed border",
    "rounded-[12px] [&>svg]:mb-5.5 [&>svg]:text-rf-green [&_h2]:mb-2.5 [&_h2]:text-[22px] [&_p]:text-rf-muted",
    "[&_p]:max-w-112.5 [&_p]:mb-6.25",
  ].join(" "),
  checkout_reference: [
    "rf-checkout-reference [&_h2]:text-[17px] [&_h2]:mb-4.5 [&_.rf-panel]:shadow-[0_2px_3px_#092a3008]",
    "[&_.rf-panel]:p-5.5 [&_.rf-panel]:rounded-[18px] [&_.rf-checkout-login]:flex [&_.rf-checkout-login]:items-center",
    "[&_.rf-checkout-login]:justify-between [&_.rf-checkout-login]:text-[13px] [&_.rf-checkout-login]:gap-3.75",
    "[&_.rf-form]:gap-3 [&_.rf-form_h2]:mb-0 [&_.rf-form>label]:font-normal [&_.rf-form>label]:text-[11px]",
    "[&_.rf-form>label]:text-rf-muted [&_.rf-form_input]:min-h-11.5 [&_.rf-form_input]:text-[13px]",
    "[&_.rf-form_input]:rounded-[9px] [&_.rf-form_select]:min-h-11.5 [&_.rf-form_select]:text-[13px]",
    "[&_.rf-form_select]:rounded-[9px] [&_.rf-radio-cards]:m-0 [&_.rf-radio-cards_label]:px-3",
    "[&_.rf-radio-cards_label]:py-3.5 [&_.rf-radio-cards_strong]:text-[13px] [&_.rf-form-hint]:mt-3.75",
    "[&_.rf-form-hint]:mb-0 [&_.rf-form-hint]:mx-0 [&_.rf-summary]:static max-[768px]:[&_.rf-panel]:p-4.25",
    "max-[768px]:[&_.rf-panel]:rounded-[12px] max-[768px]:[&_.rf-checkout-login]:flex-wrap [&_.rf-form_.rf-form-hint]:m-0",
  ].join(" "),
  panel_checkout_login: [
    "rf-panel rf-checkout-login bg-rf-surface bg-none mb-5 p-6.5 border-rf-border border-solid border",
    "rounded-[var(--rf-radius)] [&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
    "[&_.rf-btn]:whitespace-nowrap [&_.rf-btn]:text-[12px] [&_.rf-btn]:p-2.5",
  ].join(" "),
  btn_btn_outline: [
    "rf-btn rf-btn-outline inline-flex items-center justify-center min-h-11 bg-transparent bg-none text-rf-text",
    "text-[12px] font-bold leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-rf-border",
    "border-solid border rounded-[6px] gap-2.5 print:hidden hover:bg-[#edf4ef] hover:bg-none hover:border-[#9ccab5]",
  ].join(" "),
  panel_form: [
    "rf-panel rf-form rf-checkout-delivery bg-rf-surface bg-none mb-5 grid p-6.5 border-rf-border border-solid border",
    "rounded-[var(--rf-radius)] gap-4.5 [&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
    "[&>label]:grid [&>label]:text-[12px] [&>label]:font-semibold [&>label]:gap-1.75 [&_select]:w-full",
    "[&_select]:bg-white [&_select]:bg-none [&_select]:min-h-10.75 [&_select]:text-[12px] [&_select]:px-3",
    "[&_select]:py-2.75 [&_select]:border-[#dce4dd] [&_select]:border-solid [&_select]:border [&_select]:rounded-[5px]",
    "[&_textarea]:w-full [&_textarea]:bg-white [&_textarea]:bg-none [&_textarea]:min-h-27.5 [&_textarea]:text-[12px]",
    "[&_textarea]:resize-y [&_textarea]:px-3 [&_textarea]:py-2.75 [&_textarea]:border-[#dce4dd] [&_textarea]:border-solid",
    "[&_textarea]:border [&_textarea]:rounded-[5px] [&_p]:text-[12px] [&_p]:text-rf-muted [&_.rf-btn]:justify-self-start",
    "[&_.rf-full]:justify-self-stretch [&_.rf-check-label]:flex [&_.rf-check-label]:items-center",
    "[&_.rf-check-label]:text-[12px] [&_.rf-check-label]:font-normal [&_.rf-check-label]:gap-2.25",
    '[&_input:not([type="radio"]):not([type="checkbox"])]:w-full',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:bg-white',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:bg-none',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:min-h-10.75',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:text-[12px]',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:px-3',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:py-2.75',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:border-[#dce4dd]',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:border-solid',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:border',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:rounded-[5px]',
  ].join(" "),
  panel: [
    "rf-panel bg-rf-surface bg-none mb-5 p-6.5 border-rf-border border-solid border rounded-[var(--rf-radius)]",
    "[&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
  ].join(" "),
  radio_cards: [
    "[&>label:has(input:checked)]:bg-[#f2f8f2] [&>label:has(input:checked)]:border-[#82b294]",
    "rf-radio-cards grid p-0 border-current border-none [border-width:0] gap-2.5 [&_legend]:font-semibold [&_legend]:mb-3",
    "[&>label]:flex [&>label]:items-start [&>label]:p-4.25 [&>label]:border-rf-border [&>label]:border-solid",
    "[&>label]:border [&>label]:rounded-[7px] [&>label]:gap-3 [&_strong]:block [&_strong]:text-[12px] [&_small]:block",
    "[&_small]:text-[10px] [&_small]:text-rf-muted [&_small]:mt-1",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
  checkout_cart_line: [
    "rf-checkout-cart-line grid grid-cols-[60px_minmax(0,_1fr)_25px] items-start pt-2 pb-4 px-0 gap-2.5 [&_small]:block",
    "[&_small]:text-rf-muted [&_small]:mt-1.5 [&_strong]:block [&_strong]:text-[15px] [&_strong]:mt-2.5",
    "[&>a_.rf-product-photo]:w-15 [&>a_.rf-product-photo]:h-15 [&>a_.rf-product-art]:w-15 [&>a_.rf-product-art]:h-15",
    "[&>div:nth-child(2)]:text-[13px] [&_.rf-quantity]:[grid-column:2/4] [&_.rf-quantity]:justify-self-end",
    "[&_.rf-quantity]:mt-[-6px]",
  ].join(" "),
  icon_btn: [
    "rf-icon-btn inline-flex items-center justify-center bg-transparent bg-none min-w-9 min-h-9 p-2 border-current",
    "border-none [border-width:medium] rounded-[6px] print:hidden! hover:bg-[#edf4f0] hover:bg-none",
  ].join(" "),
  quantity: [
    "rf-quantity inline-flex items-center h-10 shrink-0 border-[#dce4dd] border-solid border rounded-[5px]",
    "overflow-hidden [&_button]:grid [&_button]:place-items-center [&_button]:bg-[#f5f7f4] [&_button]:bg-none",
    "[&_button]:w-7.25 [&_button]:h-full [&_button]:border-current [&_button]:border-none [&_button]:[border-width:0]",
    "[&_span]:min-w-7.75 [&_span]:text-center [&_span]:text-[12px]",
  ].join(" "),
  panel_checkout_coupon: [
    "rf-panel rf-checkout-coupon bg-rf-surface bg-none mb-5 p-6.5 border-rf-border border-solid border",
    "rounded-[var(--rf-radius)] [&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
    "[&>div]:flex [&>div]:gap-2.5 [&_input]:w-full [&_input]:min-w-0 [&_input]:text-[13px] [&_input]:px-3",
    "[&_input]:py-2.5 [&_input]:border-rf-border [&_input]:border-solid [&_input]:border [&_input]:rounded-[7px]",
    "[&_p]:text-[12px] [&_p]:text-rf-green [&_p]:mt-3 [&_p]:mb-0 [&_p]:mx-0 [&_.rf-btn]:shrink-0 [&_.rf-btn]:px-3.75",
  ].join(" "),
  btn_btn_dark: [
    "rf-btn rf-btn-dark inline-flex items-center justify-center min-h-11 bg-rf-dark bg-none text-white text-[12px]",
    "font-bold leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-transparent border-solid",
    "border rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
  panel_summary: [
    "rf-panel rf-summary bg-rf-surface bg-none mb-5 p-6.5 border-rf-border border-solid border rounded-[var(--rf-radius)]",
    "[&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
  ].join(" "),
  btn_full: [
    "rf-btn rf-full inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-[12px] font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] w-full px-5.25 py-2.75 border-transparent border-solid",
    "border rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
};

/** Chờ khôi phục phiên để dùng giỏ và thông tin tài khoản từ server. */
export function CheckoutPage() {
  const shop = useShop();
  if (!shop.ready)
    return (
      <div className={tw.empty} role="status">
        Đang mở đơn hàng…
      </div>
    );
  return <CheckoutForm />;
}

function CheckoutForm() {
  const { totalOf, variantById, presentation } = useCatalog();

  const shop = useShop();
  const router = useRouter();
  const query = useSearchParams();
  const [customer, setCustomer] = useState(shop.user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("TP. Hồ Chí Minh");
  const [method, setMethod] = useState("standard");
  const [payment, setPayment] = useState<"COD" | "STRIPE">("COD");
  const [coupon, setCoupon] = useState(query.get("coupon") ?? "");
  const [appliedCoupon, setAppliedCoupon] = useState(query.get("coupon") ?? "");
  const [quoted, setQuoted] = useState<{
    fingerprint: string;
    subtotal: string;
    discount: string;
    shipping: string;
    total: string;
    methods: string[];
  } | null>(null);
  const [quoteError, setQuoteError] = useState<{
    fingerprint: string;
    message: string;
  } | null>(null);
  const submitting = useRef(false);
  const [placing, setPlacing] = useState(false);
  const input = useMemo(
    () => ({
      customer: customer.trim(),
      phone,
      address: [address.trim(), district.trim(), city]
        .filter(Boolean)
        .join(", "),
      express: method === "express",
      couponCode: appliedCoupon || undefined,
    }),
    [customer, phone, address, district, city, method, appliedCoupon],
  );
  const fingerprint = JSON.stringify([input, shop.cart]);
  useEffect(() => {
    if (
      !shop.user ||
      input.customer.length < 2 ||
      !/^0[0-9]{9}$/.test(phone) ||
      address.trim().length < 5
    )
      return;
    let active = true;
    const timer = setTimeout(() => {
      api<{
        subtotal: string;
        discount: string;
        shipping: string;
        total: string;
        methods: string[];
      }>("/me/checkout/quote", { method: "POST", body: input })
        .then((data) => {
          if (active) {
            setQuoted({ fingerprint, ...data });
            setQuoteError(null);
          }
        })
        .catch((error) => {
          if (active)
            setQuoteError({
              fingerprint,
              message:
                error instanceof Error
                  ? error.message
                  : "Chưa lấy được báo giá",
            });
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fingerprint, input, shop.user, phone, address]);
  const confirmed = quoted?.fingerprint === fingerprint ? quoted : null;
  const subtotal = confirmed ? BigInt(confirmed.subtotal) : totalOf(shop.cart);
  const discount = confirmed ? BigInt(confirmed.discount) : BigInt(0);
  const shipping = confirmed
    ? BigInt(confirmed.shipping)
    : (subtotal >= BigInt(presentation.shipping.freeAbove)
        ? BigInt(0)
        : BigInt(presentation.shipping.standard)) +
      (method === "express"
        ? BigInt(presentation.shipping.express) -
          BigInt(presentation.shipping.standard)
        : BigInt(0));
  const couponMessage =
    quoteError?.fingerprint === fingerprint
      ? quoteError.message
      : confirmed && appliedCoupon
        ? "Server đã xác nhận mã ưu đãi."
        : appliedCoupon
          ? "Nhập đủ thông tin giao hàng để kiểm tra mã với cửa hàng."
          : "";
  const login =
    "/login?next=" +
    encodeURIComponent(
      "/checkout" +
        (appliedCoupon ? "?coupon=" + encodeURIComponent(appliedCoupon) : ""),
    );
  const applyCoupon = () => {
    setAppliedCoupon(coupon.trim().toUpperCase());
  };
  if (shop.cart.some((line) => !variantById(line.variantId)))
    return (
      <section className="my-8 rounded-lg border bg-white p-6">
        <h1>Kiểm tra lại giỏ hàng</h1>
        <p role="alert">
          Một số sản phẩm không còn khả dụng. Vui lòng xóa hoặc thay sản phẩm
          trước khi đặt hàng.
        </p>
        <Link className={tw.btn_btn_outline} href="/cart">
          Quay lại giỏ hàng
        </Link>
      </section>
    );
  if (!shop.cart.length)
    return (
      <>
        <Breadcrumb current="Đặt hàng" />
        <Empty title="Chưa có sản phẩm để đặt hàng" />
      </>
    );

  return (
    <div className={tw.checkout_reference}>
      <h1 className="rf-visually-hidden absolute w-0.25 h-0.25 [clip:rect(0,_0,_0,_0)] whitespace-nowrap p-0 m-[-1px] border-current border-none [border-width:0] overflow-hidden">
        Đặt hàng
      </h1>
      <form
        aria-busy={placing}
        className="rf-checkout-reference-layout grid grid-cols-[minmax(0,_1.25fr)_minmax(0,_0.9fr)] items-start gap-7.5 max-[768px]:grid-cols-[minmax(0,_1fr)] max-[768px]:gap-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!shop.user) {
            router.push(login);
            return;
          }
          if (submitting.current || shop.cartPending) return;
          submitting.current = true;
          setPlacing(true);
          try {
            const id = await shop.placeOrder({
              phone,
              customer: customer.trim(),
              address: input.address,
              payment,
              couponCode: appliedCoupon,
              express: method === "express",
            });
            if (id) router.push("/checkout/result/" + id);
          } finally {
            submitting.current = false;
            setPlacing(false);
          }
        }}
      >
        <div className="rf-checkout-left grid min-w-0 gap-4">
          <div className={tw.panel_checkout_login}>
            <span>
              {shop.user
                ? "Đang dùng tài khoản: " + shop.user.name
                : "Đăng nhập để lưu và theo dõi đơn hàng."}
            </span>
            <Link
              className={tw.btn_btn_outline}
              href={shop.user ? "/account" : login}
            >
              {shop.user ? "Tài khoản" : "Đăng nhập"}
            </Link>
          </div>
          <section className={tw.panel_form}>
            <h2>Thông tin giao hàng</h2>
            <label>
              Họ và tên
              <input
                required
                minLength={2}
                maxLength={60}
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Nguyễn Văn Demo"
                autoComplete="name"
              />
            </label>
            <label>
              Số điện thoại
              <input
                required
                pattern="0[0-9]{9}"
                title="10 chữ số bắt đầu bằng 0"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0900000000"
                autoComplete="tel"
              />
            </label>
            <label>
              Email tài khoản
              <input
                type="email"
                maxLength={100}
                value={shop.user?.email ?? ""}
                readOnly
                autoComplete="email"
              />
            </label>
            <label>
              Quốc gia
              <select value="VN" onChange={() => {}}>
                <option value="VN">Việt Nam</option>
              </select>
            </label>
            <label>
              Địa chỉ
              <input
                required
                minLength={5}
                maxLength={160}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Đường Demo"
                autoComplete="street-address"
              />
            </label>
            <label>
              Tỉnh / Thành phố
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option>TP. Hồ Chí Minh</option>
                <option>Hà Nội</option>
                <option>Đà Nẵng</option>
              </select>
            </label>
            <label>
              Quận/Huyện, Phường/Xã (không bắt buộc)
              <input
                maxLength={120}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Quận Demo, Phường Minh Họa"
                autoComplete="off"
              />
            </label>
            <p className="rf-form-hint text-[12px] text-rf-muted">
              Môi trường development: chỉ dùng thông tin giả. Thông tin giao
              hàng được gửi đến server và lưu cùng đơn hàng.
            </p>
          </section>
          <section className={tw.panel}>
            <h2>Phương thức giao hàng</h2>
            <fieldset className={tw.radio_cards}>
              <legend className="rf-visually-hidden absolute w-0.25 h-0.25 [clip:rect(0,_0,_0,_0)] whitespace-nowrap p-0 m-[-1px] border-current border-none [border-width:0] overflow-hidden">
                Chọn giao hàng
              </legend>
              <label>
                <input
                  type="radio"
                  name="shipping"
                  checked={method === "standard"}
                  onChange={() => setMethod("standard")}
                />
                <span>
                  <strong>Giao tiêu chuẩn</strong>
                  <small>
                    Thời gian dự kiến 3–5 ngày ·{" "}
                    {subtotal >= BigInt(presentation.shipping.freeAbove)
                      ? "Miễn phí"
                      : money(presentation.shipping.standard)}
                  </small>
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="shipping"
                  checked={method === "express"}
                  onChange={() => setMethod("express")}
                />
                <span>
                  <strong>Giao nhanh</strong>
                  <small>
                    Phí cộng thêm{" "}
                    {money(
                      BigInt(presentation.shipping.express) -
                        BigInt(presentation.shipping.standard),
                    )}
                  </small>
                </span>
              </label>
            </fieldset>
          </section>
          <section className={tw.panel}>
            <h2>Phương thức thanh toán</h2>
            <fieldset className={tw.radio_cards}>
              <legend className="rf-visually-hidden absolute w-0.25 h-0.25 [clip:rect(0,_0,_0,_0)] whitespace-nowrap p-0 m-[-1px] border-current border-none [border-width:0] overflow-hidden">
                Chọn thanh toán
              </legend>
              {(
                [
                  [
                    "COD",
                    "Thanh toán khi giao hàng (COD)",
                    "Đơn chờ xác nhận, chưa ghi nhận đã thu tiền.",
                  ],
                  ...(confirmed?.methods.includes("STRIPE") ? [[
                    "STRIPE",
                    "Thanh toán thẻ qua Stripe (thử nghiệm)",
                    "Đặt đơn rồi tiếp tục nhập thẻ thử nghiệm trên trang Stripe.",
                  ] as const] : []),
                ] as const
              ).map(([id, label, description]) => (
                <label key={id}>
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === id}
                    onChange={() => setPayment(id)}
                  />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <p className="rf-form-hint text-[12px] text-rf-muted">
              Chỉ dùng thẻ thử nghiệm khi thanh toán Stripe. Phương thức khả dụng được xác nhận trong báo giá.
            </p>
          </section>
          <Link className={tw.text_link} href="/cart">
            ← Quay lại giỏ hàng
          </Link>
        </div>
        <aside className="rf-checkout-right grid min-w-0 gap-4">
          <section className={tw.panel}>
            <h2>Giỏ hàng</h2>
            {shop.cart.map((line) => {
              const found = variantById(line.variantId)!;
              return (
                <article className={tw.checkout_cart_line} key={line.variantId}>
                  <Link href={"/products/" + found.product.slug}>
                    <ProductImage product={found.product} />
                  </Link>
                  <div>
                    <Link href={"/products/" + found.product.slug}>
                      {found.product.name}
                    </Link>
                    <small>{found.variant.label}</small>
                    <strong>
                      {money(
                        BigInt(found.variant.price) * BigInt(line.quantity),
                      )}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className={tw.icon_btn}
                    aria-label={"Xóa " + found.product.name}
                    onClick={() => shop.setQuantity(line.variantId, 0)}
                  >
                    <Trash2 size={15} />
                  </button>
                  <div className={tw.quantity}>
                    <button
                      type="button"
                      aria-label={"Giảm " + found.product.name}
                      disabled={line.quantity <= 1}
                      onClick={() =>
                        shop.setQuantity(line.variantId, line.quantity - 1)
                      }
                    >
                      <Minus size={13} />
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      aria-label={"Tăng " + found.product.name}
                      disabled={line.quantity >= found.variant.stock}
                      onClick={() =>
                        shop.setQuantity(line.variantId, line.quantity + 1)
                      }
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
          <section className={tw.panel_checkout_coupon}>
            <h2>Mã khuyến mãi</h2>
            <div>
              <label
                className="rf-visually-hidden absolute w-0.25 h-0.25 [clip:rect(0,_0,_0,_0)] whitespace-nowrap p-0 m-[-1px] border-current border-none [border-width:0] overflow-hidden"
                htmlFor="checkout-coupon"
              >
                Mã khuyến mãi
              </label>
              <input
                id="checkout-coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCoupon();
                  }
                }}
                placeholder="RIGFORGE5"
              />
              <button
                type="button"
                className={tw.btn_btn_dark}
                onClick={applyCoupon}
              >
                Áp dụng
              </button>
            </div>
            <p role="status">{couponMessage}</p>
          </section>
          <section className={tw.panel_summary}>
            <h2>Tóm tắt đơn hàng</h2>
            <OrderSummary
              subtotal={String(subtotal)}
              discount={String(discount)}
              shipping={String(shipping)}
              total={String(subtotal - discount + shipping)}
            />
            {shop.user ? (
              <button
                className={tw.btn_full}
                disabled={placing || shop.cartPending > 0}
              >
                {placing ? "Đang tạo đơn hàng…" : payment === "STRIPE" ? "Tạo đơn và tiếp tục thanh toán" : "Tạo đơn hàng COD"}
              </button>
            ) : (
              <Link className={tw.btn_full} href={login}>
                Đăng nhập để đặt hàng
              </Link>
            )}
            <div className="rf-cart-note flex items-start text-[11px] text-[#748178] pt-4.5 gap-2.25">
              <ShieldCheck size={18} />
              <span>
                {confirmed
                  ? "Đã nhận báo giá từ cửa hàng. "
                  : "Tổng hiện tại là ước tính. "}
                Server kiểm tra lại giá, phí và tồn khi xác nhận. COD chưa ghi
                nhận thu tiền.
              </span>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
