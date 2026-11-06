"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { motion } from "@/src/components/ui/motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Gift,
  Expand,
  Check,
  Heart,
  Minus,
  Plus,
  Scale,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { money, type Product } from "@/src/catalog/model";
import {
  Breadcrumb,
  ProductCard,
  ProductImage,
  SectionTitle,
  Dialog,
} from "@/src/components/storefront";
import { useShop } from "@/src/providers/shop-provider";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  detail_reference_detail: [
    "rf-detail rf-reference-detail grid grid-cols-[0.8fr_1.3fr] items-start px-0 py-5 gap-7.5 max-[1024px]:gap-5",
    "max-[768px]:grid-cols-[1fr] max-[768px]:gap-4.5 [&_.rf-detail-gallery]:min-h-95 [&_.rf-detail-gallery]:p-5",
    "[&_.rf-detail-gallery]:border-current [&_.rf-detail-gallery]:border-none [&_.rf-detail-gallery]:[border-width:0]",
    "[&_.rf-detail-gallery]:rounded-[4px] [&_.rf-detail-info_h1]:text-[21px] [&_.rf-detail-info_h1]:tracking-[0]",
    "[&_.rf-detail-info_h1]:mt-1 [&_.rf-detail-price]:bg-transparent [&_.rf-detail-price]:bg-none",
    "[&_.rf-detail-price]:p-0 [&_.rf-detail-price]:mx-0 [&_.rf-detail-price]:my-5.5",
    "[&_.rf-detail-price_strong]:text-[30px] max-[1024px]:[&_.rf-purchase-row]:flex-wrap",
    "max-[768px]:[&_.rf-detail-gallery]:min-h-70 max-[768px]:[&_.rf-detail-info_h1]:text-[20px]",
    "max-[768px]:[&_.rf-detail-gallery>.rf-product-photo]:h-62.5",
  ].join(" "),
  detail_gallery: [
    "rf-detail-gallery relative flex flex-col items-center justify-center bg-white bg-none min-h-110 p-7.5",
    "border-rf-border border-solid border rounded-[12px] max-[768px]:min-h-80 [&>.rf-product-art]:max-w-102.5",
    "[&>.rf-product-art]:h-85 [&>.rf-component-art]:min-h-80 [&>.rf-component-art]:w-full [&>.rf-demo-tag]:absolute",
    "[&>.rf-demo-tag]:top-4.5 [&>.rf-demo-tag]:left-4.5 max-[768px]:[&>.rf-product-art]:h-65 [&>.rf-product-photo]:h-85",
    "max-[768px]:[&>.rf-product-photo]:h-67.5",
  ].join(" "),
  gallery_shortcuts: [
    "rf-gallery-shortcuts grid grid-cols-[repeat(2,_1fr)] gap-y-0 gap-x-4 bg-white bg-none mt-3 px-3 py-3.75",
    "[&_a]:border-b [&_a]:[border-bottom-style:solid] [&_a]:border-b-rf-border [&_a]:text-[13px] [&_a]:text-rf-green",
    "[&_a]:px-0 [&_a]:py-3.5",
  ].join(" "),
  detail_info: [
    "rf-detail-info [&_h1]:text-[28px] [&_h1]:leading-[1.4] [&_h1]:tracking-[-0.7px] [&_h1]:mx-0 [&_h1]:my-3",
    "max-[1024px]:[&_h1]:text-[23px] max-[768px]:[&_h1]:text-[25px]",
  ].join(" "),
  rating: [
    "rf-rating flex items-center text-[11px] text-[#a48744] gap-1.5 [&>span]:text-rf-muted [&>span]:ml-1.25",
    "max-[768px]:text-[10px] [&>.rf-in-stock]:text-rf-green [&>.rf-in-stock]:ml-auto [&>.rf-out-stock]:text-rf-red",
    "[&>.rf-out-stock]:ml-auto",
  ].join(" "),
  detail_price: [
    "rf-detail-price bg-[#edf3ed] bg-none p-5 my-5 rounded-[8px] [&_strong]:text-[31px] [&_strong]:text-rf-sale",
    "[&_strong]:tracking-[-1px] [&_del]:text-[#8f9b91] [&_del]:text-[13px] [&_del]:ml-3.5 [&_small]:block",
    "[&_small]:text-[#728575] [&_small]:mt-0.5 max-[1024px]:[&_strong]:text-[26px] max-[768px]:[&_del]:ml-2.5",
  ].join(" "),
  detail_offer: [
    "rf-detail-offer pt-3 pb-4 text-[13px] px-4.25 mx-0 my-4 border-rf-green border-dashed border rounded-[5px]",
    "[&_legend]:flex [&_legend]:items-center [&_legend]:text-rf-green [&_legend]:font-bold [&_legend]:text-[18px]",
    "[&_legend]:px-2 [&_legend]:gap-2 [&_p]:mb-1.75 [&_a]:block [&_a]:mx-0 [&_a]:my-2 [&_small]:text-rf-muted",
    "max-[768px]:[&_legend]:text-[16px] [&_a:hover]:underline",
  ].join(" "),
  detail_availability_text_link: [
    "rf-detail-availability rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px]",
    "font-semibold mt-2.5 mb-5 p-0 mx-0 border-current border-none [border-width:0] gap-1.75 hover:underline",
    "hover:[text-underline-offset:4px]",
  ].join(" "),
  variant_picker: [
    "rf-variant-picker [&>strong]:text-[12px] [&>div]:flex [&>div]:flex-wrap [&>div]:mt-2.5 [&>div]:gap-2.25",
    "[&_button]:bg-white [&_button]:bg-none [&_button]:text-[11px] [&_button]:px-3.25 [&_button]:py-2.25",
    "[&_button]:border-rf-border [&_button]:border-solid [&_button]:border [&_button]:rounded-[5px]",
    "[&_button.active]:bg-[#e8f3ea] [&_button.active]:bg-none [&_button.active]:text-rf-green",
    "[&_button.active]:border-[#6d9b7b]",
  ].join(" "),
  quantity: [
    "rf-quantity inline-flex items-center h-10 shrink-0 border-[#dce4dd] border-solid border rounded-[5px]",
    "overflow-hidden [&_button]:grid [&_button]:place-items-center [&_button]:bg-[#f5f7f4] [&_button]:bg-none",
    "[&_button]:w-7.25 [&_button]:h-full [&_button]:border-current [&_button]:border-none [&_button]:[border-width:0]",
    "[&_span]:min-w-7.75 [&_span]:text-center [&_span]:text-[12px]",
  ].join(" "),
  btn: [
    "rf-btn inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-[12px] font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-transparent border-solid border",
    "rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
  btn_btn_dark: [
    "rf-btn rf-btn-dark inline-flex items-center justify-center min-h-11 bg-rf-dark bg-none text-white text-[12px]",
    "font-bold leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-transparent border-solid",
    "border rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
  secondary_actions: [
    "rf-secondary-actions flex mt-4.5 gap-5.5 [&_button]:flex [&_button]:items-center [&_button]:bg-transparent",
    "[&_button]:bg-none [&_button]:text-[11px] [&_button]:text-[#6c7b70] [&_button]:p-0 [&_button]:border-current",
    '[&_button]:border-none [&_button]:[border-width:0] [&_button]:gap-1.75 [&_button[aria-pressed="true"]]:text-rf-green',
  ].join(" "),
  detail_trust: [
    "rf-detail-trust flex flex-wrap border-t [border-top-style:solid] border-t-rf-border pt-5 mt-6.25 gap-4.5",
    "[&>span]:flex [&>span]:items-center [&>span]:text-[10px] [&>span]:text-[#6b7d70] [&>span]:gap-1.75",
  ].join(" "),
  detail_content: [
    "rf-detail-content grid grid-cols-[1.6fr_1fr] items-start [scroll-margin-top:125px] gap-6",
    "max-[1024px]:grid-cols-[1.3fr_1fr] max-[1024px]:gap-3.5 max-[768px]:grid-cols-[1fr] max-[768px]:gap-0",
    "[&>.rf-section]:mt-5.5 max-[1024px]:[&_.rf-tabs]:flex-wrap max-[1024px]:[&_.rf-tabs]:gap-2.5",
  ].join(" "),
  panel_section: [
    "rf-panel rf-section mt-11 bg-rf-surface bg-none mb-5 p-6.5 border-rf-border border-solid border",
    "rounded-[var(--rf-radius)] [&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:mt-8",
    "max-[768px]:p-4.5",
  ].join(" "),
  tabs: [
    "rf-tabs flex mb-5.5 overflow-x-auto pb-0.5 gap-2.25 [&>button]:whitespace-nowrap [&>button]:text-[11px]",
    "[&>button]:font-semibold [&>button]:bg-white [&>button]:bg-none [&>button]:text-[#5c6b61] [&>button]:px-4.5",
    "[&>button]:py-2.25 [&>button]:border-[#dde4df] [&>button]:border-solid [&>button]:border [&>button]:rounded-[5px]",
    "[&>a]:whitespace-nowrap [&>a]:text-[11px] [&>a]:font-semibold [&>a]:bg-white [&>a]:bg-none [&>a]:text-[#5c6b61]",
    "[&>a]:px-4.5 [&>a]:py-2.25 [&>a]:border-[#dde4df] [&>a]:border-solid [&>a]:border [&>a]:rounded-[5px]",
    "max-[768px]:mb-4.25 max-[768px]:gap-1.75 max-[768px]:[&>button]:text-[10px] max-[768px]:[&>button]:px-3.25",
    "max-[768px]:[&>button]:py-2 max-[768px]:[&>a]:text-[10px] max-[768px]:[&>a]:px-3.25 max-[768px]:[&>a]:py-2",
    "[&>.active]:bg-[#1e5b3c] [&>.active]:bg-none [&>.active]:text-white [&>.active]:border-[#1e5b3c]",
  ].join(" "),
  spec_table: [
    "rf-spec-table max-w-200 [&>div]:grid [&>div]:grid-cols-[180px_1fr] [&>div]:text-[12px] [&>div]:p-3",
    "[&_dt]:text-rf-muted [&_dd]:m-0 max-[768px]:[&>div]:grid-cols-[110px_1fr] max-[768px]:[&>div]:text-[11px]",
    "[&>div:nth-child(odd)]:bg-[#f5f7f4] [&>div:nth-child(odd)]:bg-none",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
  panel_detail_specification: [
    "rf-panel rf-detail-specification bg-rf-surface bg-none mb-5 mt-5.5 p-6.5 border-rf-border border-solid border",
    "rounded-[var(--rf-radius)] [&_h2]:text-[17px] [&_h2]:mb-3.75 [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px]",
    "max-[768px]:mt-0 max-[768px]:p-4.5 [&_.rf-spec-table]:text-[12px] [&_.rf-text-link]:mt-4.5",
    "[&_.rf-text-link]:text-[12px]",
  ].join(" "),
  product_grid_grid_five: [
    "rf-product-grid rf-grid-five grid grid-cols-[repeat(5,_minmax(0,_1fr))] gap-3.25",
    "max-[1200px]:grid-cols-[repeat(5,_minmax(0,_1fr))] max-[1200px]:gap-2.25",
    "max-[1024px]:grid-cols-[repeat(3,_minmax(0,_1fr))] max-[1024px]:gap-3",
    "max-[768px]:grid-cols-[repeat(2,_minmax(0,_1fr))] max-[768px]:gap-2.25",
    "max-[1024px]:[&>.rf-product-card:nth-child(n+4)]:hidden max-[768px]:[&>.rf-product-card:nth-child(n+4)]:block",
    "max-[768px]:[&>.rf-product-card:last-child:nth-child(odd)]:hidden",
  ].join(" "),
};

// Dữ liệu nghiệp vụ từ CatalogProvider/ShopProvider kết nối API.
export function ProductDetail({ product }: { product: Product }) {
  const { categories, products } = useCatalog();

  const shop = useShop();
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("description");
  const [zoom, setZoom] = useState(false);
  const variant = product.variants.find((v) => v.id === variantId)!;
  return (
    <>
      <Breadcrumb
        current={product.name}
        parent={{ label: "Sản phẩm", href: "/products" }}
      />
      <section className={tw.detail_reference_detail}>
        <div className="rf-detail-media min-w-0">
          <div className={tw.detail_gallery}>
            <span className="rf-demo-tag inline-flex items-center bg-[#eff5f1] bg-none text-[#496157] text-[10px] px-2.25 py-1 rounded-[4px]">
              Hình minh họa sản phẩm
            </span>
            <ProductImage product={product} />
            <button
              className="rf-gallery-zoom flex items-center bg-[#f1f6f4] bg-none text-[12px] mb-3 px-3 py-2 border-rf-border border-solid border rounded-[6px] gap-2"
              onClick={() => setZoom(true)}
              aria-label="Phóng to ảnh sản phẩm"
            >
              <Expand size={18} /> Xem ảnh lớn
            </button>
            <span className="rf-gallery-note text-[8px] tracking-[2px] text-[#9ba79e]">
              RIGFORGE · FORGED FOR PERFORMANCE
            </span>
          </div>
          <nav className={tw.gallery_shortcuts} aria-label="Thông tin sản phẩm">
            <a
              href="#product-information"
              onClick={() => setTab("description")}
            >
              Mô tả sản phẩm
            </a>
            <a href="#product-information" onClick={() => setTab("specs")}>
              Thông số kỹ thuật
            </a>
            <Link href="/pages/warranty">Chính sách bảo hành</Link>
            <Link href="/pages/shipping">Giao hàng & thanh toán</Link>
          </nav>
        </div>
        <div className={tw.detail_info}>
          <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
            {product.brand} · SKU {variant.sku}
          </span>
          <h1>{product.name}</h1>
          <div className={tw.rating}>
            <Star size={15} />
            <span>{product.reviews.length} đánh giá gần nhất</span>
            <span className={variant.stock ? "rf-in-stock" : "rf-out-stock"}>
              {variant.stock ? "Có sẵn" : "Hết hàng"}
            </span>
          </div>
          <div className={tw.detail_price}>
            <strong>{money(variant.price)}</strong>
            <del>{money(product.oldPrice)}</del>
            <small>Giá tham khảo trong bản trải nghiệm</small>
          </div>
          <fieldset className={tw.detail_offer}>
            <legend>
              <Gift size={22} /> Khuyến mãi chính
            </legend>
            <p>
              Nhập mã <strong>RIGFORGE5</strong> để giảm 5% tại giỏ hàng.
            </p>
            <small>Điều kiện và lượt sử dụng được kiểm tra khi đặt hàng.</small>
          </fieldset>
          <fieldset className={tw.detail_offer}>
            <legend>
              <Gift size={22} /> Xem thêm ưu đãi
            </legend>
            <Link href="/promotions">Khuyến mãi linh kiện và thiết bị →</Link>
            <Link href="/products?category=monitor">
              Hoàn thiện góc máy với màn hình mới →
            </Link>
          </fieldset>
          <Link className={tw.detail_availability_text_link} href="/showrooms">
            <Truck size={16} /> Xem thông tin showroom
          </Link>
          <div className={tw.variant_picker}>
            <strong>Phiên bản</strong>
            <div>
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  aria-pressed={v.id === variantId}
                  className={v.id === variantId ? "active" : ""}
                  onClick={() => {
                    setVariantId(v.id);
                    setQuantity(1);
                  }}
                >
                  {v.label}
                  {!v.stock && " · Hết hàng"}
                </button>
              ))}
            </div>
          </div>
          <ul className="rf-detail-specs list-none grid grid-cols-[1fr_1fr] text-[12px] p-0 my-6 gap-2.5 [&>li]:flex [&>li]:items-center [&>li]:gap-1.75 [&_svg]:text-rf-green">
            {product.specs.map((s) => (
              <li key={s}>
                <Check size={15} />
                {s}
              </li>
            ))}
          </ul>
          <div className="rf-purchase-row flex flex-wrap gap-2.5">
            <div className={tw.quantity}>
              <button
                disabled={quantity <= 1}
                onClick={() => setQuantity(quantity - 1)}
                aria-label="Giảm số lượng"
              >
                <Minus size={14} />
              </button>
              <span>{quantity}</span>
              <button
                disabled={quantity >= variant.stock}
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Tăng số lượng"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              className={tw.btn}
              disabled={!variant.stock}
              onClick={() => shop.add(variantId, quantity)}
            >
              <Plus size={17} />
              Thêm vào giỏ
            </button>
            <button
              className={tw.btn_btn_dark}
              disabled={!variant.stock}
              onClick={() => {
                if (
                  (shop.cart.find((l) => l.variantId === variantId)?.quantity ??
                    0) +
                    quantity <=
                  variant.stock
                ) {
                  shop.add(variantId, quantity);
                  router.push("/cart");
                } else shop.notify("Số lượng vượt tồn khả dụng.");
              }}
            >
              Mua ngay
            </button>
          </div>
          <div className={tw.secondary_actions}>
            <button
              onClick={() => shop.toggle("wishlist", product.id)}
              aria-pressed={shop.wishlist.includes(product.id)}
            >
              <Heart size={16} />
              {shop.wishlist.includes(product.id)
                ? "Đã yêu thích"
                : "Yêu thích"}
            </button>
            <button
              onClick={() => shop.toggle("compare", product.id)}
              aria-pressed={shop.compare.includes(product.id)}
            >
              <Scale size={16} />
              {shop.compare.includes(product.id)
                ? "Đã thêm so sánh"
                : "Thêm so sánh"}
            </button>
          </div>
          <div className={tw.detail_trust}>
            <span>
              <ShieldCheck size={18} />
              Bảo hành {product.warranty}
            </span>
            <span>
              <Truck size={18} />
              Miễn phí giao tiêu chuẩn từ 5 triệu
            </span>
          </div>
        </div>
      </section>
      {zoom && (
        <Dialog title="Ảnh minh họa sản phẩm" onClose={() => setZoom(false)}>
          <div className="rf-product-lightbox [&_.rf-product-photo]:h-[min(55vh,_500px)] [&_.rf-product-photo]:w-full [&_.rf-product-art]:h-[min(55vh,_500px)] [&_.rf-product-art]:w-full">
            <ProductImage product={product} />
          </div>
          <p>{product.name}</p>
        </Dialog>
      )}
      <div className={tw.detail_content} id="product-information">
        <section className={tw.panel_section}>
          <div className={tw.tabs}>
            {[
              ["specs", "Thông số kỹ thuật"],
              ["description", "Mô tả sản phẩm"],
              ["reviews", "Đánh giá"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={id === tab ? "active" : ""}
                aria-pressed={id === tab}
              >
                {label}
              </button>
            ))}
          </div>
          <div key={tab} className={motion.enter}>
            {tab === "specs" ? (
              <dl className={tw.spec_table}>
                <div>
                  <dt>Thương hiệu</dt>
                  <dd>{product.brand}</dd>
                </div>
                <div>
                  <dt>Danh mục</dt>
                  <dd>
                    {categories.find((c) => c.id === product.category)?.name}
                  </dd>
                </div>
                {product.specs.map((s, i) => (
                  <div key={s}>
                    <dt>Thông số {i + 1}</dt>
                    <dd>{s}</dd>
                  </div>
                ))}
                <div>
                  <dt>Bảo hành</dt>
                  <dd>{product.warranty}</dd>
                </div>
              </dl>
            ) : tab === "description" ? (
              <div className="rf-prose max-w-212.5 leading-[1.9] [&_h1]:text-[34px] [&_h1]:leading-[1.4] [&_p]:text-[#5f7164] max-[768px]:[&_h1]:text-[27px] [&_.rf-eyebrow]:mb-2.5">
                <h2>{product.name}</h2>
                <p>
                  Một lựa chọn cho cấu hình theo nhu cầu của bạn. Hãy đối chiếu
                  thông số, khả năng tương thích và chính sách trước khi mua.
                </p>
                <p>
                  Giá và tồn khả dụng được đọc từ cửa hàng. Giá cuối cùng được
                  xác nhận khi đặt hàng; thông số development cần đối chiếu
                  trước khi kinh doanh.
                </p>
                <Link href="/pc-builder" className={tw.text_link}>
                  Thử trong PC Studio <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="rf-review flex items-center py-3.75 gap-6.25 [&_p]:text-rf-muted [&_p]:mt-2">
                {product.reviews.length ? (
                  product.reviews.map((review) => (
                    <article key={review.id}>
                      <strong>
                        {review.rating}/5 ·{" "}
                        {review.title ?? "Đánh giá người mua"}
                      </strong>
                      <p>{review.body}</p>
                    </article>
                  ))
                ) : (
                  <p>Chưa có đánh giá được công bố cho sản phẩm này.</p>
                )}
              </div>
            )}
          </div>
        </section>
        <aside className={tw.panel_detail_specification}>
          <h2>THÔNG SỐ KỸ THUẬT</h2>
          <dl className={tw.spec_table}>
            <div>
              <dt>Thương hiệu</dt>
              <dd>{product.brand}</dd>
            </div>
            {product.specs.map((spec, index) => (
              <div key={spec}>
                <dt>Thông số {index + 1}</dt>
                <dd>{spec}</dd>
              </div>
            ))}
            <div>
              <dt>Bảo hành</dt>
              <dd>{product.warranty}</dd>
            </div>
          </dl>
          <Link href="/compare" className={tw.text_link}>
            Xem danh sách so sánh →
          </Link>
        </aside>
      </div>
      <section className="rf-section mt-11 max-[768px]:mt-8">
        <SectionTitle title="Có thể bạn cũng thích" href="/products" />
        <div className={tw.product_grid_grid_five}>
          {products
            .filter(
              (p) => p.category === product.category && p.id !== product.id,
            )
            .concat(products.filter((p) => p.category !== product.category))
            .slice(0, 5)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
    </>
  );
}
