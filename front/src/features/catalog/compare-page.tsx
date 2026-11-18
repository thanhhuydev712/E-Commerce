"use client";
import { useState } from "react";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { money, type Product, type Specs } from "@/src/catalog/model";
import { Breadcrumb, Empty, ProductImage } from "@/src/components/storefront";
import { useShop } from "@/src/providers/shop-provider";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  page_heading: [
    "rf-page-heading flex justify-between items-center mx-0 my-7.5 gap-5 [&_h1]:text-[32px] [&_h1]:tracking-[-1px]",
    "[&_h1]:leading-[1.2] [&_h1]:mt-2 [&_h1]:mb-2.5 [&_h1]:mx-0 [&_h1_small]:text-[20px] [&_h1_small]:text-rf-muted",
    "[&_p]:text-rf-muted [&_p]:text-rf-body [&_p]:mb-0 max-[768px]:flex-wrap max-[768px]:mx-0 max-[768px]:my-6",
    "max-[768px]:[&_h1]:text-[27px]",
  ].join(" "),
  compare_table: [
    "rf-compare-table max-h-[75dvh] overflow-auto bg-white bg-none rounded-[10px] border border-rf-border",
    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rf-green",
    "[&_table]:border-separate [&_table]:border-spacing-0 [&_table]:w-full [&_th]:text-left [&_td]:text-left",
    "[&_th]:min-w-44 [&_th]:text-rf-caption [&_th]:p-4 [&_th]:border-r [&_th]:border-b [&_th]:border-rf-border",
    "[&_td]:min-w-56 [&_td]:text-rf-caption [&_td]:p-4 [&_td]:border-r [&_td]:border-b [&_td]:border-rf-border",
    "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-white [&_thead_th]:align-top",
    "[&_thead_th]:w-64 [&_tbody_th]:font-semibold [&_tbody_td]:align-top [&_tr>:last-child]:border-r-0",
    "[&_thead_th:not(:first-child)]:min-w-56 [&_thead_th]:break-words",
    "[&_tr>th:first-child]:w-44 [&_tr>th:first-child]:min-w-44 max-[768px]:[&_tr>th:first-child]:w-28 max-[768px]:[&_tr>th:first-child]:min-w-28",
    "[&_tbody_th]:sticky [&_tbody_th]:left-0 [&_tbody_th]:z-5 [&_tbody_th]:bg-white [&_thead_th:first-child]:left-0 [&_thead_th:first-child]:z-20",
    "[&_thead_.rf-product-photo]:w-28 [&_thead_.rf-product-photo]:h-21 [&_thead_.rf-product-photo]:mx-auto",
    "[&_thead_.rf-product-art]:w-28 [&_thead_.rf-product-art]:h-21 [&_thead_.rf-product-art]:mx-auto",
    "[&_thead_.rf-component-art]:min-h-21 [&_thead_.rf-component-art]:max-h-21 [&_thead_.rf-component-art]:overflow-hidden",
    "[@media(max-height:600px)]:[&_thead_.rf-product-photo]:hidden [@media(max-height:600px)]:[&_thead_.rf-product-art]:hidden",
    "[@media(max-height:600px)]:[&_thead_.rf-component-art]:hidden",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-rf-caption font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
  buy_link: [
    "inline-flex min-h-11 items-center justify-center rounded-md bg-rf-green px-3 py-2 text-rf-caption",
    "font-semibold text-white hover:bg-rf-green-hover",
  ].join(" "),
};

type ComparisonRow = {
  id: string;
  label: string;
  values: (string | null)[];
  category?: string;
  description?: boolean;
};

// Chỉ dùng thuộc tính có tên trong contract; không suy đoán nhãn từ vị trí specs[].
const technicalFields: { key: keyof Specs; label: string; unit?: string }[] = [
  { key: "socket", label: "Socket" },
  { key: "ddr", label: "Thế hệ RAM" },
  { key: "form", label: "Chuẩn kích thước" },
  { key: "watts", label: "Công suất công bố", unit: "W" },
  { key: "length", label: "Chiều dài", unit: "mm" },
  { key: "clearance", label: "Chiều cao tản nhiệt", unit: "mm" },
  { key: "gpuMax", label: "Chiều dài VGA tối đa", unit: "mm" },
  { key: "coolerMax", label: "Chiều cao tản nhiệt tối đa", unit: "mm" },
  { key: "capacity", label: "Dung lượng" },
  { key: "slots", label: "Số khe" },
  { key: "integrated", label: "Đồ họa tích hợp" },
];

function technicalValue(
  product: Product,
  field: (typeof technicalFields)[number],
) {
  const value = product.technical[field.key];
  if (
    value === undefined ||
    (typeof value === "string" && !value.trim()) ||
    (typeof value === "number" && !Number.isFinite(value))
  )
    return null;
  if (typeof value === "boolean") return value ? "Có" : "Không";
  const unit =
    field.key === "capacity" && ["ram", "mainboard"].includes(product.category)
      ? "GB"
      : field.unit;
  return unit ? `${value} ${unit}` : String(value);
}

function technicalLabel(key: keyof Specs, category: string, fallback: string) {
  if (key === "capacity" && category === "mainboard")
    return "Dung lượng RAM tối đa";
  if (key === "capacity" && category === "ram") return "Dung lượng RAM";
  if (key === "slots" && category === "mainboard") return "Số khe RAM";
  if (key === "slots" && category === "ram") return "Số thanh RAM";
  if (key === "form" && category === "case") return "Chuẩn mainboard hỗ trợ";
  if (key === "form" && category === "mainboard") return "Kích thước mainboard";
  if (key === "form" && category === "psu") return "Chuẩn nguồn";
  if (key === "watts" && category === "psu") return "Công suất nguồn";
  return fallback;
}

function isDifferent(row: ComparisonRow, products: Product[]) {
  const values = row.values.filter(
    (_, index) => !row.category || products[index].category === row.category,
  );
  return (
    values.length > 1 &&
    new Set(
      values.map((value) => {
        if (value === null) return null;
        const normalized = value
          .normalize("NFKC")
          .trim()
          .toLocaleLowerCase("vi");
        return row.description
          ? normalized.split("\n").sort().join("\n")
          : normalized.replace(/\s+/g, " ");
      }),
    ).size > 1
  );
}

// Dữ liệu nghiệp vụ từ CatalogProvider/ShopProvider kết nối API.
export function ComparePage() {
  const { productById, categories } = useCatalog();
  const shop = useShop();
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const list = shop.compare.flatMap((id) => {
    const product = productById(id);
    return product ? [product] : [];
  });
  const categoryIds = [...new Set(list.map((product) => product.category))];
  const categoryName = (id: string) =>
    categories.find((category) => category.id === id)?.name ??
    "Chưa có tên nhóm";
  const rows: ComparisonRow[] = [
    {
      id: "price",
      label: "Giá biến thể mặc định",
      values: list.map((product) => money(product.price)),
    },
    {
      id: "stock",
      label: "Tình trạng",
      values: list.map((product) =>
        product.stock > 0 ? "Có sẵn" : "Hết hàng",
      ),
    },
    {
      id: "category",
      label: "Loại sản phẩm",
      values: list.map((product) => categoryName(product.category)),
    },
    {
      id: "brand",
      label: "Thương hiệu",
      values: list.map((product) => product.brand.trim() || null),
    },
    {
      id: "variants",
      label: "Lựa chọn biến thể",
      values: list.map(
        (product) =>
          product.variants.map((variant) => variant.label).join(", ") || null,
      ),
    },
    {
      id: "warranty",
      label: "Bảo hành",
      values: list.map((product) => product.warranty.trim() || null),
    },
    ...categoryIds.flatMap((category): ComparisonRow[] => {
      const namedRows = technicalFields.flatMap((field): ComparisonRow[] => {
        const values = list.map((product) =>
          product.category === category ? technicalValue(product, field) : null,
        );
        return values.some((value) => value !== null)
          ? [
              {
                id: `${category}-${field.key}`,
                label: technicalLabel(field.key, category, field.label),
                category,
                values,
              },
            ]
          : [];
      });
      const descriptions = list.map((product) =>
        product.category === category
          ? product.specs
              .map((spec) => spec.trim())
              .filter(Boolean)
              .join("\n") || null
          : null,
      );
      return [
        ...namedRows,
        ...(descriptions.some((value) => value !== null)
          ? [
              {
                id: `${category}-description`,
                label: "Thông số mô tả",
                category,
                values: descriptions,
                description: true,
              },
            ]
          : []),
      ];
    }),
  ];
  const filtering = onlyDifferences && list.length > 1;
  const visibleRows = filtering
    ? rows.filter((row) => isDifferent(row, list))
    : rows;
  return (
    <>
      <Breadcrumb current="So sánh sản phẩm" />
      <div className={tw.page_heading}>
        <div>
          <span className="rf-eyebrow inline-flex items-center text-rf-caption font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-rf-caption max-[768px]:tracking-[1px]">
            CHỌN ĐÚNG NHU CẦU
          </span>
          <h1>So sánh sản phẩm</h1>
          <p>Tối đa 4 sản phẩm · Thông số và giá minh họa</p>
        </div>
        {list.length > 0 && list.length < 4 && (
          <Link href="/products" className={`${tw.text_link} min-h-11`}>
            Chọn thêm sản phẩm →
          </Link>
        )}
      </div>
      {!shop.ready ? (
        <p
          role="status"
          className="rounded-xl border border-rf-border bg-white p-6 text-rf-muted"
        >
          Đang tải danh sách so sánh…
        </p>
      ) : !list.length ? (
        <Empty
          title="Chưa có sản phẩm so sánh"
          description="Mở chi tiết sản phẩm và chọn “Thêm so sánh”."
        />
      ) : (
        <>
          <div className="mb-5 rounded-xl border border-rf-border bg-white p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <p className="m-0 text-rf-body font-semibold">
                Đã chọn {list.length}/4 sản phẩm
              </p>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-rf-caption has-disabled:cursor-default has-disabled:text-rf-muted">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-rf-green"
                  checked={filtering}
                  disabled={list.length < 2}
                  onChange={(event) => setOnlyDifferences(event.target.checked)}
                  aria-controls="comparison-table"
                />
                Chỉ xem điểm khác biệt
              </label>
            </div>
            <p
              id="compare-guidance"
              className="mb-0 mt-2 text-rf-caption leading-relaxed text-rf-muted"
            >
              {categoryIds.length > 1
                ? "Bạn đang chọn sản phẩm khác nhóm. Thông số kỹ thuật được tách theo từng nhóm; nhóm chỉ có một sản phẩm chưa có đối tượng để lọc khác biệt."
                : list.length < 2
                  ? "Chọn thêm một sản phẩm cùng nhóm để đối chiếu và lọc điểm khác biệt."
                  : `Các sản phẩm cùng nhóm ${categoryName(categoryIds[0])}. Thông số có tên được đối chiếu theo từng thuộc tính.`}{" "}
              Thông số mô tả giữ nguyên theo từng sản phẩm, không ghép theo thứ
              tự.
              {list.length === 4 &&
                " Đã đủ 4 sản phẩm; bỏ một sản phẩm để đổi lựa chọn."}
            </p>
            <p
              className="mb-0 mt-2 text-rf-caption text-rf-muted"
              role="status"
            >
              {filtering
                ? `Đang hiển thị ${visibleRows.length} dòng có khác biệt. Dữ liệu thiếu không có nghĩa là sản phẩm không hỗ trợ.`
                : "Giá theo biến thể mặc định; vào trang chi tiết để chọn biến thể và xem giá tương ứng."}
            </p>
          </div>
          <p className="mb-3 text-rf-caption text-rf-muted">
            Cuộn ngang để xem đủ sản phẩm; tên sản phẩm được giữ khi cuộn trong
            bảng.
          </p>
          <div
            className={tw.compare_table}
            role="region"
            aria-label="Bảng so sánh sản phẩm"
            aria-describedby="compare-guidance"
            tabIndex={0}
          >
            <table>
              <caption className="sr-only">
                So sánh dữ liệu của các sản phẩm đã chọn
              </caption>
              <thead>
                <tr>
                  <th scope="col">Sản phẩm</th>
                  {list.map((p) => (
                    <th key={p.id} scope="col">
                      <ProductImage product={p} />
                      <Link
                        href={`/products/${p.slug}`}
                        className="mt-2 block leading-relaxed hover:text-rf-green"
                      >
                        {p.name}
                      </Link>
                      <Link
                        href={`/products/${p.slug}`}
                        className={`${tw.buy_link} mt-3`}
                      >
                        {p.stock > 0
                          ? "Xem chi tiết & chọn mua"
                          : "Xem chi tiết"}
                      </Link>
                      <button
                        type="button"
                        className={`${tw.text_link} mt-1 min-h-11`}
                        aria-label={`Bỏ ${p.name} khỏi so sánh`}
                        onClick={() => shop.toggle("compare", p.id)}
                      >
                        Bỏ khỏi so sánh
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody id="comparison-table">
                {visibleRows.length ? (
                  visibleRows.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        isDifferent(row, list)
                          ? "bg-rf-accent-soft/40"
                          : undefined
                      }
                    >
                      <th scope="row">
                        {row.label}
                        {row.category && categoryIds.length > 1 && (
                          <span className="mt-1 block font-normal text-rf-muted">
                            {categoryName(row.category)}
                          </span>
                        )}
                      </th>
                      {row.values.map((value, index) => (
                        <td
                          key={list[index].id}
                          className={
                            row.id === "price"
                              ? "rf-price-text font-semibold text-rf-sale"
                              : undefined
                          }
                        >
                          {row.category &&
                          row.category !== list[index].category ? (
                            <span className="text-rf-muted">
                              Không cùng nhóm
                            </span>
                          ) : value === null ? (
                            <span className="text-rf-muted">
                              Chưa có dữ liệu
                            </span>
                          ) : row.description ? (
                            <ul className="m-0 list-disc space-y-2 pl-4">
                              {value.split("\n").map((spec, specIndex) => (
                                <li key={`${specIndex}-${spec}`}>{spec}</li>
                              ))}
                            </ul>
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={list.length + 1}>
                      <p className="my-2 font-semibold">
                        Chưa có điểm khác biệt để hiển thị.
                      </p>
                      <p className="mb-3 text-rf-muted">
                        Các thông tin có thể đối chiếu đang giống nhau, hoặc
                        chưa có đủ sản phẩm cùng nhóm.
                      </p>
                      <button
                        type="button"
                        className={`${tw.text_link} min-h-11`}
                        onClick={() => setOnlyDifferences(false)}
                      >
                        Xem tất cả thông tin
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
