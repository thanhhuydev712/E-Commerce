"use client";
import Link from "next/link";
import { Heart, Star, Check, Plus } from "lucide-react";
import { money, type Product } from "@/src/catalog/model";
import { useShop } from "@/src/providers/shop-provider";
import { ProductImage } from "./product-art";
import { motion } from "@/src/components/ui/motion";
import { useRouter } from "next/navigation";
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Rocket,
  ShoppingCart,
} from "lucide-react";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_card_reference_card_flash_reference_card_catalog_product_card: [
    motion.card,
    "relative flex flex-col bg-white bg-none min-w-0 pt-3 pb-4 px-2.75 overflow-hidden max-[768px]:pt-2.5",
    "max-[768px]:pb-3.25 max-[768px]:px-2.25 [&_.rf-product-photo]:h-47.5 [&_.rf-product-photo-img]:pt-3.25",
    "[&_.rf-product-photo-img]:pb-0 [&_.rf-product-photo-img]:px-1.75 max-[768px]:[&_.rf-product-photo]:h-35.75",
    "[&.rf-reference-card-flash]:pt-3.75 [&.rf-reference-card-flash]:pb-7 [&.rf-reference-card-flash]:min-h-97.5",
    "[&.rf-reference-card-flash]:text-center [&.rf-reference-card-flash]:px-3.25",
    "[&.rf-reference-card-flash]:rounded-[13px] max-[768px]:[&.rf-reference-card-flash]:pt-2.5",
    "max-[768px]:[&.rf-reference-card-flash]:pb-4.5 max-[768px]:[&.rf-reference-card-flash]:min-h-73.75",
    "max-[768px]:[&.rf-reference-card-flash]:px-2.5 [&.rf-reference-card-flash_.rf-product-photo]:h-58.75",
    "[&.rf-reference-card-flash_.rf-reference-card-name]:h-10.5",
    "[&.rf-reference-card-flash_.rf-reference-card-name]:min-h-10.5",
    "[&.rf-reference-card-flash_.rf-reference-card-name]:text-[15px]",
    "[&.rf-reference-card-flash_.rf-reference-card-name]:mt-2.25",
    "[&.rf-reference-card-flash_.rf-reference-card-price_strong]:text-[18px]",
    "[&.rf-reference-card-flash_.rf-reference-card-price_del]:mt-2",
    "max-[768px]:[&.rf-reference-card-flash_.rf-product-photo]:h-41.25",
    "max-[768px]:[&.rf-reference-card-flash_.rf-reference-card-name]:text-[12px]",
    "max-[768px]:[&.rf-reference-card-flash_.rf-reference-card-name]:h-9",
    "max-[768px]:[&.rf-reference-card-flash_.rf-reference-card-name]:min-h-9",
    "max-[768px]:[&.rf-reference-card-flash_.rf-reference-card-name]:leading-[18px]",
    "max-[768px]:[&.rf-reference-card-flash_.rf-reference-card-price_strong]:text-[15px]",
    "[&.rf-reference-card-catalog]:w-auto [&.rf-reference-card-catalog]:p-3 [&.rf-reference-card-catalog]:rounded-[5px]",
    "max-[768px]:[&.rf-reference-card-catalog]:pt-2.5 max-[768px]:[&.rf-reference-card-catalog]:pb-3.25",
    "max-[768px]:[&.rf-reference-card-catalog]:px-2.25 max-[1024px]:[&.rf-reference-card-catalog]:p-2.5",
    "[&.rf-reference-card-catalog_.rf-reference-card-name]:text-[13px]",
    "[&.rf-reference-card-catalog_.rf-reference-card-name]:min-h-14.75",
    "[&.rf-reference-card-catalog_.rf-reference-card-name]:[-webkit-line-clamp:3]",
    "[&.rf-reference-card-catalog_.rf-reference-card-price_strong]:text-[18px]",
    "[&.rf-reference-card-catalog_.rf-reference-card-image]:h-45",
    "[&.rf-reference-card-catalog_.rf-reference-card-specs]:min-h-28.75",
    "[&.rf-reference-card-catalog_.rf-card-buy_br]:hidden [&.rf-reference-card-catalog_.rf-card-buy_span]:text-[11px]",
    "max-[768px]:[&.rf-reference-card-catalog_.rf-reference-card-image]:h-36.25",
    "max-[768px]:[&.rf-reference-card-catalog_.rf-reference-card-name]:text-[12px]",
    "max-[768px]:[&.rf-reference-card-catalog_.rf-reference-card-name]:min-h-13.75",
    "max-[768px]:[&.rf-reference-card-catalog_.rf-reference-card-price_strong]:text-[16px]",
    "max-[768px]:[&.rf-reference-card-catalog_.rf-card-add]:w-8.75",
    "max-[768px]:[&.rf-reference-card-catalog_.rf-card-buy]:gap-0.75",
    "max-[768px]:[&.rf-reference-card-catalog_.rf-card-buy_svg]:w-3.5",
    "max-[768px]:[&.rf-reference-card-catalog_.rf-card-buy_span]:text-[10px]",
    "max-[768px]:[&.rf-reference-card-catalog_.rf-reference-card-specs]:p-1.75",
    "max-[768px]:[&.rf-reference-card-catalog_.rf-reference-card-specs>span]:text-[10px]",
    "[&.rf-product-card]:[transition:border-color_0.2s,_box-shadow_0.2s] [&.rf-product-card]:border-rf-border",
    "[&.rf-product-card]:border-solid [&.rf-product-card]:border [&.rf-product-card]:rounded-[9px]",
    "[&.rf-product-card:hover]:shadow-[0_7px_20px_#17362309] [&.rf-product-card:hover]:border-[#a8c9b5]",
    "[&.rf-product-card:hover_.rf-card-art>.rf-product-art]:[transform:translateY(-3px)]",
    "[&.rf-product-card:hover_.rf-card-art>.rf-component-art]:[transform:translateY(-3px)]",
  ].join(" "),
  ribbon: [
    "rf-ribbon absolute top-3.25 left-2 z-1 pr-3.25 pl-4.5",
    "bg-[linear-gradient(_120deg,_#172f38_0_8%,_#c8d4d4_8%_12%,_#008468_12%_)] bg-transparent text-white text-[11px]",
    "font-semibold [clip-path:polygon(10%_0,_100%_0,_100%_100%,_0_100%)] py-1.25 max-[768px]:top-2.25",
    "max-[768px]:left-0.75 max-[768px]:pr-2.25 max-[768px]:pl-3.75 max-[768px]:text-[9px] max-[768px]:py-1",
  ].join(" "),
  reference_card_name: [
    "rf-reference-card-name [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] min-h-10.5",
    "text-[14px] font-bold leading-[21px] mt-0.75 h-10.5 overflow-hidden max-[768px]:text-[12px] max-[768px]:min-h-9.5",
  ].join(" "),
  reference_card_price: [
    "rf-reference-card-price mt-2.5 [&_strong]:block [&_strong]:text-[17px] [&_strong]:text-rf-sale",
    "[&_strong]:font-extrabold [&_strong]:whitespace-nowrap [&_del]:block [&_del]:text-[11px] [&_del]:text-[#a0a5a7]",
    "[&_del]:italic [&_del]:mt-1 max-[768px]:[&_strong]:text-[15px] max-[768px]:[&_del]:text-[9px]",
  ].join(" "),
  reference_card_specs: [
    "rf-reference-card-specs grid bg-[#f3f4f5] bg-none mt-2.25 mb-4.5 min-h-28.75 content-start px-1.75 py-2.25",
    "rounded-[6px] gap-1.25 [&>span]:flex [&>span]:items-center [&>span]:text-[11px] [&>span]:text-[#5b6266]",
    "[&>span]:leading-[1.5] [&>span]:[overflow-wrap:anywhere] [&>span]:gap-1.25 [&>span]:overflow-hidden",
    "[&_svg]:text-[#7c8488] max-[768px]:min-h-26.25 max-[768px]:px-1.25 max-[768px]:py-1.75",
    "max-[768px]:[&>span]:text-[9px] max-[768px]:[&>span]:gap-1",
  ].join(" "),
  reference_card_actions: [
    "rf-reference-card-actions flex items-stretch mt-auto gap-2 [&>button]:min-h-10.75 [&>button]:border-rf-green",
    "[&>button]:border-solid [&>button]:border [&>button]:rounded-[4px]",
  ].join(" "),
  card_buy: [
    "rf-card-buy flex items-center justify-center flex-1 bg-rf-green bg-none text-white p-1 gap-1.5 [&_span]:text-[12px]",
    "[&_span]:font-black [&_span]:leading-[1.2] max-[768px]:gap-0.75 max-[768px]:[&_span]:text-[10px]",
    "max-[768px]:[&_svg]:w-3.5",
  ].join(" "),
  product_card: [
    motion.card,
    "rf-product-card relative min-w-0 bg-white bg-none [transition:border-color_0.2s,_box-shadow_0.2s] border-rf-border",
    "border-solid border rounded-[9px] overflow-hidden hover:shadow-[0_7px_20px_#17362309] hover:border-[#a8c9b5]",
    "[&:hover_.rf-card-art>.rf-product-art]:[transform:translateY(-3px)]",
    "[&:hover_.rf-card-art>.rf-component-art]:[transform:translateY(-3px)]",
  ].join(" "),
  card_top: [
    "rf-card-top absolute flex items-center justify-between top-2.25 left-2.75 right-2 z-1 pointer-events-none",
    "max-[768px]:top-1.5 max-[768px]:left-2.25 max-[768px]:right-1.25 [&_.rf-icon-btn]:pointer-events-auto",
    "[&_.rf-icon-btn]:text-[#8b958e] [&_.rf-icon-btn]:w-7 [&_.rf-icon-btn]:h-7 [&_.rf-icon-btn]:min-w-7",
    "[&_.rf-icon-btn]:min-h-7 [&_.rf-icon-btn]:p-1.25 [&_.rf-icon-btn.is-liked]:text-[#bf3c48]",
  ].join(" "),
  icon_btn: [
    "inline-flex items-center justify-center bg-transparent bg-none min-w-9 min-h-9 p-2 border-current border-none",
    "[border-width:medium] rounded-[6px] print:hidden! hover:bg-[#edf4f0] hover:bg-none",
  ].join(" "),
  card_art: [
    "rf-card-art block pt-6 pb-0 px-2.5 overflow-hidden max-[768px]:pt-6.5 max-[768px]:px-0.75 [&>.rf-product-art]:h-43.5",
    "[&>.rf-product-art]:[transition:transform_0.3s] [&>.rf-component-art]:h-43.5",
    "[&>.rf-component-art]:[transition:transform_0.3s] max-[1200px]:[&>.rf-product-art]:h-36.25",
    "max-[1200px]:[&>.rf-product-art]:min-h-36.25 max-[1200px]:[&>.rf-component-art]:h-36.25",
    "max-[1200px]:[&>.rf-component-art]:min-h-36.25 max-[1024px]:[&>.rf-product-art]:h-43",
    "max-[1024px]:[&>.rf-product-art]:min-h-43 max-[1024px]:[&>.rf-component-art]:h-43",
    "max-[1024px]:[&>.rf-component-art]:min-h-43 max-[768px]:[&>.rf-product-art]:min-h-30",
    "max-[768px]:[&>.rf-product-art]:h-30 max-[768px]:[&>.rf-component-art]:min-h-30",
    "max-[768px]:[&>.rf-component-art]:h-30",
  ].join(" "),
  card_brand: [
    "rf-card-brand flex items-center justify-between text-[8px] font-bold text-[#8e9991] uppercase tracking-[0.7px]",
    "[&>span]:inline-flex [&>span]:items-center [&>span]:text-[8px] [&>span]:text-[#a88b45] [&>span]:font-medium",
    "[&>span]:tracking-[0] [&>span]:gap-0.75 max-[768px]:text-[7px]",
  ].join(" "),
  card_name: [
    "rf-card-name [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] min-h-9.5 text-[12px]",
    "font-semibold leading-[1.6] mt-1.25 overflow-hidden max-[768px]:text-[11px] max-[768px]:min-h-9 max-[768px]:mt-1.25",
    "hover:text-rf-green",
  ].join(" "),
  card_specs: [
    "rf-card-specs grid grid-cols-[1fr_1fr] gap-y-1.25 gap-x-1.5 mt-2.5 mb-3.25 bg-[#f5f7f5] bg-none px-1.75 py-2.25 mx-0",
    "rounded-[4px] [&>span]:text-[8px] [&>span]:text-[#6b7a70] [&>span]:whitespace-nowrap [&>span]:text-ellipsis",
    "[&>span]:overflow-hidden max-[1200px]:[&>span]:text-[7px] max-[1024px]:[&>span]:text-[8px] max-[768px]:mt-2",
    "max-[768px]:mb-2.25 max-[768px]:px-1.25 max-[768px]:py-1.75 max-[768px]:gap-1 max-[768px]:[&>span]:text-[7px]",
  ].join(" "),
  price: [
    "rf-price flex flex-wrap items-baseline gap-x-1.75 [&_strong]:text-[18px] [&_strong]:leading-[1.6]",
    "[&_strong]:tracking-[-0.6px] [&_strong]:text-rf-sale [&_del]:text-[9px] [&_del]:text-[#a0a8a2]",
    "max-[1200px]:[&_strong]:text-[16px] max-[768px]:[&_strong]:text-[15px] max-[768px]:[&_del]:text-[8px]",
  ].join(" "),
  card_bottom: [
    "rf-card-bottom flex items-center justify-between mt-2.25 [&>span]:inline-flex [&>span]:items-center",
    "[&>span]:text-[9px] [&>span]:text-[#568365] [&>span]:gap-0.75 max-[768px]:mt-1.25 max-[768px]:[&>span]:text-[8px]",
  ].join(" "),
  add_btn: [
    "rf-add-btn grid place-items-center text-rf-green bg-[#f1f7f2] bg-none w-7.75 h-7.5 border-[#d6e6db] border-solid",
    "border rounded-[6px] max-[768px]:w-7.75 max-[768px]:h-7.75 hover:bg-rf-green hover:bg-none hover:text-white",
  ].join(" "),
};

// Component độc lập; nhận dữ liệu qua props, không truy cập API thật.
export function ProductCard({
  product,
  variant = "default",
}: {
  product: Product;
  variant?: "default" | "shelf" | "flash" | "catalog";
}) {
  const shop = useShop();
  const router = useRouter();
  // Tính từ tiền nguyên: không dùng float cho tiền. % chỉ phục vụ badge hiển thị.
  const discount =
    BigInt(product.oldPrice) === BigInt(0)
      ? 0
      : Number(
          ((BigInt(product.oldPrice) - BigInt(product.price)) * BigInt(100)) /
            BigInt(product.oldPrice),
        );
  // Biến thể compact dùng chung dữ liệu và action; chỉ thay bố cục theo ảnh tham khảo.
  if (variant !== "default")
    return (
      <article
        className={
          `rf-reference-card rf-reference-card-${variant} ${variant === "catalog" ? "rf-product-card" : ""}` +
          " " +
          tw.reference_card_reference_card_flash_reference_card_catalog_product_card
        }
      >
        <span className={tw.ribbon}>Giảm {discount}%</span>
        <Link
          className="rf-reference-card-image block mb-2.25"
          href={`/products/${product.slug}`}
        >
          <ProductImage product={product} />
        </Link>
        <Link
          className={tw.reference_card_name}
          href={`/products/${product.slug}`}
        >
          {product.name}
        </Link>
        <div className={tw.reference_card_price}>
          <strong>{money(product.price)}</strong>
          <del>{money(product.oldPrice)}</del>
        </div>
        {variant !== "flash" && (
          <>
            <div className={tw.reference_card_specs}>
              {product.specs.slice(0, 5).map((spec, index) => {
                const Icon = [Cpu, MemoryStick, HardDrive, Cpu, HardDrive][
                  index
                ];
                return (
                  <span key={`${spec}-${index}`}>
                    <Icon size={13} />
                    {spec}
                  </span>
                );
              })}
            </div>
            <div className={tw.reference_card_actions}>
              <button
                className="rf-card-add grid place-items-center w-10.75 shrink-0 bg-white bg-none text-rf-green max-[768px]:w-8.5"
                disabled={!product.variants[0].stock}
                aria-label={`Thêm ${product.name} vào giỏ`}
                onClick={() => shop.add(product.variants[0].id)}
              >
                <ShoppingCart size={20} />
              </button>
              <button
                className={tw.card_buy}
                disabled={!product.variants[0].stock}
                onClick={() => {
                  const selected = product.variants[0];
                  if (
                    (shop.cart.find((line) => line.variantId === selected.id)
                      ?.quantity ?? 0) >= selected.stock
                  ) {
                    shop.notify("Số lượng vượt tồn khả dụng.");
                    return;
                  }
                  shop.add(selected.id);
                  router.push("/cart");
                }}
              >
                <Rocket size={17} />
                <span>
                  MUA
                  <br />
                  NGAY
                </span>
              </button>
            </div>
          </>
        )}
      </article>
    );
  return (
    <article className={tw.product_card}>
      <div className={tw.card_top}>
        <span className="rf-discount text-[9px] font-bold text-[#aa3439] bg-[#fceef0] bg-none px-1.5 py-0.75 rounded-[3px] max-[768px]:text-[8px]">
          -{discount}%
        </span>
        <button
          onClick={() => shop.toggle("wishlist", product.id)}
          className={
            `rf-icon-btn ${shop.wishlist.includes(product.id) ? "is-liked" : ""}` +
            " " +
            tw.icon_btn
          }
          aria-label={`Yêu thích ${product.name}`}
          aria-pressed={shop.wishlist.includes(product.id)}
        >
          <Heart
            size={17}
            fill={shop.wishlist.includes(product.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <Link href={`/products/${product.slug}`} className={tw.card_art}>
        <ProductImage product={product} />
      </Link>
      <div className="rf-card-content pt-2.25 pb-3.25 px-3.5 max-[1200px]:pt-2.25 max-[1200px]:pb-3 max-[1200px]:px-2.5 max-[768px]:pt-1.5 max-[768px]:pb-2.5 max-[768px]:px-2.5">
        <div className={tw.card_brand}>
          {product.brand}{" "}
          <span>
            <Star size={10} /> Xem đánh giá
          </span>
        </div>
        <Link className={tw.card_name} href={`/products/${product.slug}`}>
          {product.name}
        </Link>
        <div className={tw.card_specs}>
          {product.specs.slice(0, 4).map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        <div className={tw.price}>
          <strong>{money(product.price)}</strong>
          <del>{money(product.oldPrice)}</del>
        </div>
        <div className={tw.card_bottom}>
          <span>
            <Check size={12} /> Có sẵn
          </span>
          <button
            className={tw.add_btn}
            onClick={() => shop.add(product.variants[0].id)}
            aria-label={`Thêm ${product.name} vào giỏ`}
          >
            <Plus size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}
