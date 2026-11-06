"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { money } from "@/src/catalog/model";
import { Breadcrumb, Empty, ProductCard } from "@/src/components/storefront";
import { normalizeSearch, priceParam } from "./catalog-query";
import { motion } from "@/src/components/ui/motion";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  catalog_reference: [
    "rf-catalog-reference [&>h1]:mt-5.5 [&>h1]:mb-4 [&>h1]:text-[24px] [&>h1]:font-[750] [&>h1]:mx-0",
    "[&>h1_small]:text-[19px] [&>h1_small]:font-semibold max-[768px]:[&>h1]:text-[20px] max-[768px]:[&>h1]:mt-4.5",
    "max-[768px]:[&>h1]:mb-3 max-[768px]:[&>h1_small]:text-[13px]",
  ].join(" "),
  catalog_banner: [
    motion.media,
    "rf-catalog-banner block relative h-64 bg-[#071e29] bg-none overflow-hidden [&>img]:object-cover",
    "[&>img]:[object-position:72%_center] [&>span]:relative [&>span]:flex [&>span]:flex-col [&>span]:justify-center",
    "[&>span]:items-start [&>span]:h-full [&>span]:w-[63%] [&>span]:text-white",
    "[&>span]:bg-[linear-gradient(90deg,_#071e29_65%,_#071e29c9_85%,_transparent)] [&>span]:bg-transparent [&>span]:px-10",
    "[&>span]:py-8 [&_small]:text-[#91dfbf] [&_small]:text-[10px] [&_small]:tracking-[2px]",
    "[&_strong]:text-[clamp(24px,_3.4vw,_44px)] [&_strong]:leading-[1.2] [&_strong]:mt-3.5 [&_strong]:mb-5",
    "[&_span>span]:text-[#c9f8df] [&_span>span]:text-[13px] [&_span>span]:px-3.75 [&_span>span]:py-2",
    "[&_span>span]:border-[#9ae4c1] [&_span>span]:border-solid [&_span>span]:border [&_span>span]:rounded-[24px]",
    "max-[1024px]:h-55 max-[768px]:h-38.75 max-[768px]:[&>span]:w-[75%] max-[768px]:[&>span]:p-3.75",
    "max-[768px]:[&_small]:text-[7px] max-[768px]:[&_small]:tracking-[1px] max-[768px]:[&_strong]:text-[23px]",
    "max-[768px]:[&_strong]:mt-2.5 max-[768px]:[&_strong]:mb-3.5 max-[768px]:[&_span>span]:text-[9px]",
    "max-[768px]:[&_span>span]:px-2.25 max-[768px]:[&_span>span]:py-1.5",
  ].join(" "),
  catalog_categories: [
    "rf-catalog-categories flex flex-wrap mx-0 my-3 gap-2.25 [&_button]:bg-white [&_button]:bg-none",
    "[&_button]:text-[13px] [&_button]:text-rf-text [&_button]:px-4 [&_button]:py-2.25 [&_button]:border-[#dde6e9]",
    '[&_button]:border-solid [&_button]:border [&_button]:rounded-[30px] [&_button[aria-pressed="true"]]:text-rf-green',
    '[&_button[aria-pressed="true"]]:bg-[#eaf6ef] [&_button[aria-pressed="true"]]:bg-none',
    '[&_button[aria-pressed="true"]]:border-rf-green max-[768px]:flex-nowrap max-[768px]:overflow-x-auto',
    "max-[768px]:pb-1.25 max-[768px]:[&_button]:shrink-0 max-[768px]:[&_button]:text-[12px]",
  ].join(" "),
  catalog_brands: [
    "rf-catalog-brands flex flex-wrap mx-0 my-3 gap-2.25 [&_button]:bg-white [&_button]:bg-none [&_button]:text-[18px]",
    "[&_button]:text-[#216486] [&_button]:min-w-25 [&_button]:font-extrabold [&_button]:italic [&_button]:px-4",
    "[&_button]:py-1.25 [&_button]:border-[#dde6e9] [&_button]:border-solid [&_button]:border [&_button]:rounded-[30px]",
    '[&_button[aria-pressed="true"]]:text-rf-green [&_button[aria-pressed="true"]]:bg-[#eaf6ef]',
    '[&_button[aria-pressed="true"]]:bg-none [&_button[aria-pressed="true"]]:border-rf-green max-[768px]:flex-nowrap',
    "max-[768px]:overflow-x-auto max-[768px]:pb-1.25 max-[768px]:[&_button]:shrink-0 max-[768px]:[&_button]:text-[17px]",
  ].join(" "),
  coupon_banner: [
    "rf-coupon-banner flex items-center justify-between bg-[#dfeddf] bg-none mb-7.5 p-7.5 rounded-[10px] gap-5",
    "[&_h2]:my-2 [&_p]:text-[12px] [&_p]:text-[#66806b] [&_p]:m-0 [&>strong]:text-[22px] [&>strong]:tracking-[3px]",
    "[&>strong]:text-[#2d633c] [&>strong]:px-6.25 [&>strong]:py-4 [&>strong]:border-[#94b79a] [&>strong]:border-dashed",
    "[&>strong]:border max-[768px]:flex-wrap max-[768px]:p-5.5 max-[768px]:[&_h2]:text-[22px]",
    "max-[768px]:[&>strong]:text-[18px] max-[768px]:[&>strong]:px-4.5 max-[768px]:[&>strong]:py-2.5",
  ].join(" "),
  btn_btn_outline_filter_mobile: [
    "rf-btn rf-btn-outline rf-filter-mobile hidden items-center justify-center min-h-11 bg-transparent bg-none",
    "text-rf-text text-[12px] font-bold leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75",
    "border-rf-border border-solid border rounded-[6px] gap-2.5 max-[768px]:inline-flex print:hidden hover:bg-[#edf4ef]",
    "hover:bg-none hover:border-[#9ccab5]",
  ].join(" "),
  horizontal_filters: [
    "motion-safe:[&.open]:animate-[rf-enter_200ms_ease-out]",
    "flex flex-wrap items-center mx-0 my-5.5 gap-2 [&_details]:relative [&_summary]:flex [&_summary]:items-center",
    "[&_summary]:bg-[#e9eded] [&_summary]:bg-none [&_summary]:cursor-pointer [&_summary]:text-[13px]",
    "[&_summary]:list-none [&_summary]:p-2.75 [&_summary]:border-[#dce2e3] [&_summary]:border-solid [&_summary]:border",
    "[&_summary]:rounded-[7px] [&_summary]:gap-2 max-[768px]:hidden max-[768px]:my-3.75 max-[768px]:gap-2",
    "[&_summary::-webkit-details-marker]:hidden max-[768px]:[&.open]:flex",
  ].join(" "),
  filter_popover: [
    motion.enter,
    "rf-filter-popover absolute top-[calc(100%_+_6px)] left-0 z-15 w-65 max-w-[80vw] grid bg-white bg-none",
    "shadow-[0_8px_25px_#0b293524] p-4.5 border-rf-border border-solid border rounded-[9px] gap-3 [&_label]:grid",
    "[&_label]:text-[12px] [&_label]:gap-1.25 [&_input]:w-full [&_input]:p-2.5 [&_input]:border-rf-border",
    "[&_input]:border-solid [&_input]:border [&_input]:rounded-[5px]",
  ].join(" "),
  btn: [
    "rf-btn inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-[12px] font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-transparent border-solid border",
    "rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
  filter_select: [
    "rf-filter-select flex items-center bg-[#e9eded] bg-none text-[12px] px-2.25 py-2 border-[#dce2e3] border-solid",
    "border rounded-[7px] gap-1.25 [&_select]:max-w-31.25 [&_select]:min-w-12.5 [&_select]:bg-transparent",
    "[&_select]:bg-none [&_select]:text-rf-text [&_select]:text-[12px] [&_select]:p-1 [&_select]:border-current",
    "[&_select]:border-none [&_select]:[border-width:0] max-[768px]:flex-[1_0_45%] max-[768px]:justify-between",
    "max-[768px]:[&_select]:max-w-25",
  ].join(" "),
  active_filters: [
    "rf-active-filters flex flex-wrap items-center text-[12px] gap-2.5 [&_button]:flex [&_button]:items-center",
    "[&_button]:text-rf-green [&_button]:bg-[#edf7f1] [&_button]:bg-none [&_button]:px-2.5 [&_button]:py-1.5",
    "[&_button]:border-[#b6d5c6] [&_button]:border-solid [&_button]:border [&_button]:rounded-[5px] [&_button]:gap-1.75",
    "[&_a]:text-rf-green [&_a]:underline",
  ].join(" "),
  catalog_sort: [
    "rf-catalog-sort [&_button]:bg-white [&_button]:bg-none [&_button]:text-[13px] [&_button]:text-rf-text",
    "[&_button]:px-4 [&_button]:py-2.25 [&_button]:border-[#dde6e9] [&_button]:border-solid [&_button]:border",
    '[&_button]:rounded-[30px] [&_button[aria-pressed="true"]]:text-rf-green [&_button[aria-pressed="true"]]:bg-[#eaf6ef]',
    '[&_button[aria-pressed="true"]]:bg-none [&_button[aria-pressed="true"]]:border-rf-green flex items-center flex-wrap',
    "text-[12px] mx-0 my-4.5 gap-3 max-[768px]:gap-1.75 max-[768px]:[&>span]:w-full max-[768px]:[&_button]:text-[11px]",
    "max-[768px]:[&_button]:px-2.5 max-[768px]:[&_button]:py-2",
  ].join(" "),
  product_grid_catalog_grid: [
    "rf-product-grid rf-catalog-grid grid grid-cols-[repeat(5,_minmax(0,_1fr))] gap-3",
    "max-[1024px]:grid-cols-[repeat(4,_minmax(0,_1fr))] max-[768px]:grid-cols-[repeat(2,_minmax(0,_1fr))]",
    "max-[768px]:gap-2",
  ].join(" "),
  pagination: [
    "rf-pagination flex justify-center pt-7.5 gap-2 [&_button]:w-9 [&_button]:h-9 [&_button]:bg-white [&_button]:bg-none",
    "[&_button]:border-rf-border [&_button]:border-solid [&_button]:border [&_button]:rounded-[5px]",
    "[&_button[aria-current]]:bg-rf-green [&_button[aria-current]]:bg-none [&_button[aria-current]]:text-white",
  ].join(" "),
  panel_catalog_guide: [
    "rf-panel rf-catalog-guide bg-rf-surface bg-none mb-5 mt-7.5 text-[14px] leading-[1.8] p-6.5 border-rf-border",
    "border-solid border rounded-[var(--rf-radius)] [&_h2]:text-[21px] [&_h2]:mb-2.5 [&_h1]:text-[26px]",
    "[&_h1]:tracking-[-0.7px] max-[768px]:p-4.5 [&_details]:mt-3.75 [&_details]:border-t",
    "[&_details]:[border-top-style:solid] [&_details]:border-t-rf-border [&_details]:pt-3.5 [&_summary]:cursor-pointer",
    "[&_summary]:font-[650]",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
};

const facets = [
  {
    key: "cpu",
    label: "CPU",
    values: ["Intel", "Ryzen", "Core i5", "Core i7"],
  },
  { key: "ram", label: "RAM", values: ["DDR4", "DDR5", "16GB", "32GB"] },
  {
    key: "storage",
    label: "Dung lượng SSD",
    values: ["256GB", "512GB", "1TB", "2TB"],
  },
  {
    key: "gpu",
    label: "VGA",
    values: ["RTX 3060", "RTX 4060", "RTX 5060", "Radeon"],
  },
];

/** Query URL giữ bộ lọc để refresh, chia sẻ và Back hoạt động nhất quán. */
export function CatalogPage({
  category: routeCategory,
  brand: routeBrand,
  promotion = false,
}: {
  category?: string;
  brand?: string;
  promotion?: boolean;
}) {
  const { products, categories } = useCatalog();

  const query = useSearchParams();
  const router = useRouter();
  const category = routeCategory ?? query.get("category") ?? "";
  const brand = routeBrand ?? query.get("brand") ?? "";
  const search = query.get("q") ?? "";
  const sort = query.get("sort") ?? "popular";
  const min = priceParam(query.get("min"));
  const max = priceParam(query.get("max"));
  const [filters, setFilters] = useState(false);
  const paramsWithContext = () => {
    const params = new URLSearchParams(query.toString());
    if (routeCategory) params.set("category", routeCategory);
    if (routeBrand) params.set("brand", routeBrand);
    return params;
  };
  const update = (key: string, value: string) => {
    const params = paramsWithContext();
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push("/products?" + params, { scroll: false });
  };
  const list = products
    .filter((p) => {
      const text = normalizeSearch(
        p.name + " " + p.brand + " " + p.specs.join(" "),
      );
      return (
        (!category || p.category === category) &&
        (!brand || p.brand === brand) &&
        (!search ||
          normalizeSearch(search)
            .split(/\s+/)
            .every((word) => text.includes(word))) &&
        (!min || BigInt(p.price) >= BigInt(min)) &&
        (!max || BigInt(p.price) <= BigInt(max)) &&
        facets.every(
          ({ key }) =>
            !query.get(key) || text.includes(normalizeSearch(query.get(key)!)),
        )
      );
    })
    .sort((a, b) =>
      sort === "low"
        ? Number(BigInt(a.price) - BigInt(b.price))
        : sort === "high"
          ? Number(BigInt(b.price) - BigInt(a.price))
          : sort === "newest"
            ? products.indexOf(b) - products.indexOf(a)
            : 0,
    );
  const title = search
    ? "Kết quả cho “" + search + "”"
    : promotion
      ? "Tổng hợp khuyến mãi"
      : categories.find((c) => c.id === category)?.name ||
        brand ||
        "Tất cả sản phẩm";
  const totalPages = Math.max(1, Math.ceil(list.length / 20));
  const rawPage = Number(query.get("page"));
  const page =
    Number.isSafeInteger(rawPage) && rawPage > 0
      ? Math.min(rawPage, totalPages)
      : 1;
  const activeFilters = [
    ...(brand ? [{ key: "brand", label: brand }] : []),
    ...(min ? [{ key: "min", label: "Từ " + money(min) }] : []),
    ...(max ? [{ key: "max", label: "Đến " + money(max) }] : []),
    ...facets
      .filter((f) => query.get(f.key))
      .map((f) => ({ key: f.key, label: f.label + ": " + query.get(f.key) })),
  ];
  return (
    <div className={tw.catalog_reference}>
      <Breadcrumb current={title} />
      {!search && (
        <Link
          className={tw.catalog_banner}
          href={category === "pc" ? "/pc-builder" : "/promotions"}
        >
          <Image
            src={
              "/images/banners/banner-slider" +
              (category === "laptop"
                ? 3
                : category === "monitor"
                  ? 2
                  : category === "gear"
                    ? 4
                    : 1) +
              ".webp"
            }
            alt="Bộ máy tính và thiết bị công nghệ"
            fill
            sizes="(max-width: 1023px) calc(100vw - 32px), (max-width: 1668px) calc(100vw - 128px), 1540px"
            priority
          />
          <span>
            <small>RIGFORGE · FORGED FOR PERFORMANCE</small>
            <strong>
              {category ? title.toUpperCase() : "HIỆU NĂNG CHO CHẤT RIÊNG"}
            </strong>
            <span>Khám phá cấu hình phù hợp với bạn →</span>
          </span>
        </Link>
      )}
      <h1>
        {title} <small>({list.length} sản phẩm)</small>
      </h1>
      <nav className={tw.catalog_categories} aria-label="Nhóm sản phẩm">
        {categories.slice(0, 10).map((c) => (
          <button
            key={c.id}
            aria-pressed={category === c.id}
            onClick={() => update("category", category === c.id ? "" : c.id)}
          >
            {c.short}
          </button>
        ))}
      </nav>
      <nav className={tw.catalog_brands} aria-label="Thương hiệu nổi bật">
        {[
          ...new Set(
            products
              .filter((p) => !category || p.category === category)
              .map((p) => p.brand),
          ),
        ]
          .slice(0, 7)
          .map((b) => (
            <button
              key={b}
              aria-pressed={brand === b}
              onClick={() => update("brand", brand === b ? "" : b)}
            >
              {b}
            </button>
          ))}
      </nav>
      {promotion && (
        <div className={tw.coupon_banner}>
          <div>
            <h2>Ưu đãi cho cấu hình mới</h2>
            <p>Điều kiện sử dụng mã được cửa hàng xác nhận tại checkout.</p>
          </div>
          <strong>RIGFORGE5</strong>
        </div>
      )}
      <button
        className={tw.btn_btn_outline_filter_mobile}
        aria-expanded={filters}
        aria-controls="catalog-filters"
        onClick={() => setFilters(!filters)}
      >
        <SlidersHorizontal size={16} />
        Bộ lọc sản phẩm
      </button>
      <div
        id="catalog-filters"
        className={
          "rf-horizontal-filters " +
          (filters ? "open" : "") +
          " " +
          tw.horizontal_filters
        }
      >
        <details>
          <summary>
            Giá <ChevronDown size={14} />
          </summary>
          <form
            key={min + "-" + max}
            className={tw.filter_popover}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const params = paramsWithContext();
              for (const key of ["min", "max"]) {
                const value = priceParam(String(data.get(key) ?? ""));
                if (value) params.set(key, value);
                else params.delete(key);
              }
              params.delete("page");
              router.push("/products?" + params, { scroll: false });
              e.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            <label>
              Giá từ (₫)
              <input
                name="min"
                type="number"
                min="0"
                max="999999999999999"
                step="1"
                defaultValue={min}
                placeholder="0"
              />
            </label>
            <label>
              Giá đến (₫)
              <input
                name="max"
                type="number"
                min="0"
                max="999999999999999"
                step="1"
                defaultValue={max}
                placeholder="Không giới hạn"
              />
            </label>
            <button className={tw.btn}>Áp dụng giá</button>
          </form>
        </details>
        <label className={tw.filter_select}>
          Hãng
          <select
            aria-label="Lọc thương hiệu"
            value={brand}
            onChange={(e) => update("brand", e.target.value)}
          >
            <option value="">Tất cả</option>
            {[...new Set(products.map((p) => p.brand))].sort().map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        {facets.map((f) => (
          <label className={tw.filter_select} key={f.key}>
            {f.label}
            <select
              aria-label={"Lọc " + f.label}
              value={query.get(f.key) ?? ""}
              onChange={(e) => update(f.key, e.target.value)}
            >
              <option value="">Tất cả</option>
              {f.values.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        ))}
        <label className={tw.filter_select}>
          Khoảng giá
          <select
            aria-label="Lọc khoảng giá"
            value={max}
            onChange={(e) => update("max", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="2000000">Dưới 2 triệu</option>
            <option value="5000000">Dưới 5 triệu</option>
            <option value="10000000">Dưới 10 triệu</option>
            <option value="25000000">Dưới 25 triệu</option>
          </select>
        </label>
      </div>
      {activeFilters.length > 0 && (
        <div className={tw.active_filters} aria-label="Bộ lọc đang áp dụng">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => update(f.key, "")}
              aria-label={"Bỏ lọc " + f.label}
            >
              {f.label}
              <X size={13} />
            </button>
          ))}
          <Link
            href={category ? "/products?category=" + category : "/products"}
          >
            Xóa bộ lọc
          </Link>
        </div>
      )}
      <div className={tw.catalog_sort}>
        <span>Sắp xếp theo:</span>
        {[
          ["low", "Giá tăng dần"],
          ["high", "Giá giảm dần"],
          ["newest", "Mới nhất"],
          ["popular", "Nổi bật"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={sort === key}
            onClick={() => update("sort", key)}
          >
            {label}
          </button>
        ))}
      </div>
      <p
        className="rf-result-count text-[12px] text-rf-muted mx-0 my-3"
        role="status"
      >
        Hiển thị {list.length ? (page - 1) * 20 + 1 : 0}–
        {Math.min(page * 20, list.length)} trong {list.length} sản phẩm
      </p>
      {list.length ? (
        <>
          <div
            key={list
              .slice((page - 1) * 20, page * 20)
              .map((p) => p.id)
              .join(",")}
            className={tw.product_grid_catalog_grid + " " + motion.enter}
          >
            {list.slice((page - 1) * 20, page * 20).map((p) => (
              <ProductCard key={p.id} product={p} variant="catalog" />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className={tw.pagination} aria-label="Phân trang">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  aria-current={page === i + 1 ? "page" : undefined}
                  onClick={() => update("page", String(i + 1))}
                >
                  {i + 1}
                </button>
              ))}
            </nav>
          )}
        </>
      ) : (
        <Empty
          title="Chưa tìm thấy sản phẩm phù hợp"
          description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc để tìm thêm lựa chọn."
          label="Xóa bộ lọc"
        />
      )}
      <section className={tw.panel_catalog_guide}>
        <h2>Chọn {category ? title.toLowerCase() : "sản phẩm"} theo nhu cầu</h2>
        <p>
          Đối chiếu ngân sách, thông số và khả năng tương thích trước khi chọn.
          Giá và tồn kho trong bản trải nghiệm là dữ liệu mẫu.
        </p>
        <details>
          <summary>Cần lưu ý điều gì khi chọn cấu hình?</summary>
          <p>
            Kiểm tra socket CPU, thế hệ RAM, công suất nguồn và kích thước linh
            kiện. PC Studio hỗ trợ một số quy tắc tương thích cơ bản.
          </p>
          <Link href="/pc-builder" className={tw.text_link}>
            Xây dựng cấu hình →
          </Link>
        </details>
        <details>
          <summary>Giao hàng và bảo hành như thế nào?</summary>
          <p>
            Quy tắc minh họa được ghi tại trang chính sách. Dịch vụ thực tế chưa
            được thiết lập.
          </p>
          <Link href="/pages/warranty" className={tw.text_link}>
            Xem thông tin bảo hành →
          </Link>
        </details>
      </section>
    </div>
  );
}
