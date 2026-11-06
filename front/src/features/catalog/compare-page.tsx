"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { money } from "@/src/catalog/model";
import { Breadcrumb, Empty, ProductImage } from "@/src/components/storefront";
import { useShop } from "@/src/providers/shop-provider";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  page_heading: [
    "rf-page-heading flex justify-between items-center mx-0 my-7.5 gap-5 [&_h1]:text-[32px] [&_h1]:tracking-[-1px]",
    "[&_h1]:leading-[1.2] [&_h1]:mt-2 [&_h1]:mb-2.5 [&_h1]:mx-0 [&_h1_small]:text-[20px] [&_h1_small]:text-rf-muted",
    "[&_p]:text-rf-muted [&_p]:text-[13px] [&_p]:mb-0 max-[768px]:flex-wrap max-[768px]:mx-0 max-[768px]:my-6",
    "max-[768px]:[&_h1]:text-[27px]",
  ].join(" "),
  compare_table: [
    "rf-compare-table overflow-x-auto bg-white bg-none rounded-[10px] [&_table]:border-collapse [&_table]:w-full",
    "[&_th]:text-left [&_th]:min-w-45 [&_th]:text-[12px] [&_th]:p-4.5 [&_th]:border-rf-border [&_th]:border-solid",
    "[&_th]:border [&_td]:text-left [&_td]:min-w-45 [&_td]:text-[12px] [&_td]:p-4.5 [&_td]:border-rf-border",
    "[&_td]:border-solid [&_td]:border [&_th_.rf-product-art]:w-45 [&_th_.rf-product-art]:h-37.5",
    "[&_th_.rf-component-art]:min-h-37.5 [&_th_.rf-text-link]:block [&_th_.rf-text-link]:mt-2.5",
    "[&_th_.rf-product-photo]:w-45 [&_th_.rf-product-photo]:h-37.5",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
};

// Dữ liệu nghiệp vụ từ CatalogProvider/ShopProvider kết nối API.
export function ComparePage() {
  const { products, categories } = useCatalog();

  const shop = useShop();
  const list = products.filter((p) => shop.compare.includes(p.id));
  return (
    <>
      <Breadcrumb current="So sánh sản phẩm" />
      <div className={tw.page_heading}>
        <div>
          <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
            CHỌN ĐÚNG NHU CẦU
          </span>
          <h1>So sánh sản phẩm</h1>
          <p>Tối đa 4 sản phẩm · Thông số và giá minh họa</p>
        </div>
      </div>
      {!list.length ? (
        <Empty
          title="Chưa có sản phẩm so sánh"
          description="Mở chi tiết sản phẩm và chọn “Thêm so sánh”."
        />
      ) : (
        <div className={tw.compare_table}>
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                {list.map((p) => (
                  <th key={p.id}>
                    <ProductImage product={p} />
                    <Link href={`/products/${p.slug}`}>{p.name}</Link>
                    <button
                      className={tw.text_link}
                      onClick={() => shop.toggle("compare", p.id)}
                    >
                      Bỏ khỏi so sánh
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Tình trạng</th>
                {list.map((p) => (
                  <td key={p.id}>{p.stock ? "Có sẵn" : "Hết hàng"}</td>
                ))}
              </tr>
              <tr>
                <th>Loại sản phẩm</th>
                {list.map((p) => (
                  <td key={p.id}>
                    {categories.find((c) => c.id === p.category)?.name}
                  </td>
                ))}
              </tr>
              <tr>
                <th>Biến thể</th>
                {list.map((p) => (
                  <td key={p.id}>
                    {p.variants.map((v) => v.label).join(", ")}
                  </td>
                ))}
              </tr>
              <tr>
                <th>Giá</th>
                {list.map((p) => (
                  <td key={p.id} className="rf-price-text text-rf-sale">
                    {money(p.price)}
                  </td>
                ))}
              </tr>
              <tr>
                <th>Thương hiệu</th>
                {list.map((p) => (
                  <td key={p.id}>{p.brand}</td>
                ))}
              </tr>
              {[0, 1, 2, 3].map((i) => (
                <tr key={i}>
                  <th>Thông số {i + 1}</th>
                  {list.map((p) => (
                    <td key={p.id}>{p.specs[i] ?? "—"}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th>Bảo hành</th>
                {list.map((p) => (
                  <td key={p.id}>{p.warranty}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
