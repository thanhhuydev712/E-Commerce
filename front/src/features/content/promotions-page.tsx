"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb, ProductCard } from "@/src/components/storefront";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  promotions_page: [
    "rf-promotions-page [&>section]:[scroll-margin-top:130px] [&>section]:px-0 [&>section]:py-6.25",
    "[&>section]:mx-auto bg-rf-dark bg-none pb-6.25 rounded-[10px] overflow-hidden [&>header]:text-center",
    "[&>header]:text-white [&>header]:bg-[radial-gradient(ellipse_at_50%_10%,_#176b57,_#071e29_75%)]",
    "[&>header]:bg-transparent [&>header]:px-5 [&>header]:py-15 [&_header>span]:text-[#a7e5ca]",
    "[&_header>span]:tracking-[3px] [&_header>span]:text-[13px] [&_h1]:text-[52px] [&_h1]:font-black",
    "[&_h1]:leading-[1.25] [&_h1]:mx-0 [&_h1]:my-5 [&_h1_em]:text-[#c5f0b7] [&_header>strong]:inline-block",
    "[&_header>strong]:bg-[#bff5d6] [&_header>strong]:bg-none [&_header>strong]:text-[#07392d]",
    "[&_header>strong]:text-[15px] [&_header>strong]:px-6 [&_header>strong]:py-3 [&_header>strong]:rounded-[24px]",
    "[&>nav]:flex [&>nav]:justify-center [&>nav]:flex-wrap [&>nav]:border-t [&>nav]:[border-top-style:solid]",
    "[&>nav]:border-t-[#6aa69355] [&>nav]:border-b [&>nav]:[border-bottom-style:solid] [&>nav]:border-b-[#6aa69355]",
    "[&>nav]:px-3.75 [&>nav]:py-6.25 [&>nav]:gap-3.5 [&>nav_a]:bg-[linear-gradient(#1c745b,_#0b3c32)]",
    "[&>nav_a]:bg-transparent [&>nav_a]:text-white [&>nav_a]:text-[20px] [&>nav_a]:font-extrabold [&>nav_a]:px-6.25",
    "[&>nav_a]:py-3.75 [&>nav_a]:border-[#80c3a7] [&>nav_a]:border-solid [&>nav_a]:border [&>nav_a]:rounded-[9px]",
    "[&_section_h2]:text-white [&_section_h2]:text-center [&_section_h2]:text-[30px] max-[768px]:[&>header]:px-3.75",
    "max-[768px]:[&>header]:py-8.75 max-[768px]:[&_h1]:text-[30px] max-[768px]:[&_header>span]:text-[10px]",
    "max-[768px]:[&_header>strong]:text-[11px] max-[768px]:[&_header>strong]:px-3.5 max-[768px]:[&>nav]:px-2.5",
    "max-[768px]:[&>nav]:gap-2 max-[768px]:[&>nav_a]:text-[13px] max-[768px]:[&>nav_a]:px-3.25",
    "max-[768px]:[&>nav_a]:py-2.5 max-[768px]:[&>section]:py-5",
    "max-[768px]:[&_section_h2]:text-[24px]",
  ].join(" "),
  promotion_group_banner: [
    "rf-promotion-group-banner block relative h-50 mb-5 rounded-[12px] overflow-hidden [&_img]:object-cover",
    "[&>span]:relative [&>span]:h-full [&>span]:w-[65%] [&>span]:flex [&>span]:flex-col [&>span]:justify-center",
    "[&>span]:bg-[linear-gradient(90deg,_#052b22_65%,_transparent)] [&>span]:bg-transparent [&>span]:text-white",
    "[&>span]:p-6.25 [&>span]:gap-4.5 [&_strong]:text-[28px] [&_strong]:leading-[1.3] [&_small]:text-[14px]",
    "[&_small]:text-[#bff5d6] max-[768px]:h-37.5 max-[768px]:[&>span]:w-[80%] max-[768px]:[&>span]:p-3.75",
    "max-[768px]:[&_strong]:text-[20px] max-[768px]:[&_small]:text-[11px]",
  ].join(" "),
  product_grid_catalog_grid: [
    "rf-product-grid rf-catalog-grid grid grid-cols-[repeat(5,_minmax(0,_1fr))] gap-3",
    "max-[1024px]:grid-cols-[repeat(4,_minmax(0,_1fr))] max-[768px]:grid-cols-[repeat(2,_minmax(0,_1fr))]",
    "max-[768px]:gap-2",
  ].join(" "),
};

const groups = [
  {
    id: "pc",
    title: "MÁY BỘ",
    subtitle: "Cấu hình cho mọi trận đấu",
    image: 1,
  },
  {
    id: "laptop",
    title: "LAPTOP",
    subtitle: "Học tập, làm việc và giải trí",
    image: 3,
  },
  {
    id: "monitor",
    title: "MÀN HÌNH",
    subtitle: "Mở rộng góc nhìn của bạn",
    image: 2,
  },
  {
    id: "gear",
    title: "GAMING GEAR",
    subtitle: "Hoàn thiện góc máy",
    image: 4,
  },
];

/** Trang chiến dịch riêng: hero → điều hướng neo → từng nhóm ưu đãi. */
export function PromotionsPage() {
  const { products } = useCatalog();

  return (
    <>
      <Breadcrumb current="Tổng hợp khuyến mãi" />
      <div className={tw.promotions_page}>
        <header>
          <span>RIGFORGE · ƯU ĐÃI MẪU</span>
          <h1>
            BUILD CẤU HÌNH MỚI
            <br />
            <em>ĐÓN ƯU ĐÃI MỚI</em>
          </h1>
          <p>Tổng hợp chương trình trong bản trải nghiệm</p>
          <strong>MÃ RIGFORGE5 · GIẢM 5% ĐƠN MẪU</strong>
        </header>
        <nav aria-label="Nhóm khuyến mãi">
          {groups.map((g) => (
            <a key={g.id} href={`#promotion-${g.id}`}>
              {g.title}
            </a>
          ))}
        </nav>
        {groups.map((g) => (
          <section key={g.id} id={`promotion-${g.id}`}>
            <h2>{g.title}</h2>
            <Link
              href={`/products?category=${g.id}`}
              className={tw.promotion_group_banner}
            >
              <Image
                src={`/images/banners/banner-slider${g.image}.webp`}
                alt="Thiết bị công nghệ minh họa"
                fill
                sizes="(max-width: 1023px) calc(100vw - 32px), (max-width: 1668px) calc(100vw - 128px), 1540px"
              />
              <span>
                <strong>{g.subtitle}</strong>
                <small>Khám phá sản phẩm →</small>
              </span>
            </Link>
            <div className={tw.product_grid_catalog_grid}>
              {products
                .filter((p) => p.category === g.id)
                .slice(0, 5)
                .map((p) => (
                  <ProductCard key={p.id} product={p} variant="catalog" />
                ))}
            </div>
            <Link
              className="rf-promotion-group-more block text-center text-[#d5fce6] mt-5"
              href={`/products?category=${g.id}`}
            >
              Xem tất cả {g.title.toLowerCase()} →
            </Link>
          </section>
        ))}
      </div>
    </>
  );
}
