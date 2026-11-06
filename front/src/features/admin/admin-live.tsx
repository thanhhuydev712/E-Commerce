"use client";
import { useState } from "react";
import Link from "next/link";
import { useShop } from "@/src/providers/shop-provider";
import { useApiResource } from "@/src/hooks/use-api-resource";
import { money } from "@/src/catalog/model";
import { Empty } from "@/src/components/storefront";
type Stats = {
  products: number;
  orders: number;
  accounts: number;
  stock: {
    onHand: number | null;
    reserved: number | null;
    unavailable: number | null;
  };
  captured: string;
  refunded: string;
};
export function AdminOverview() {
  const shop = useShop();
  if (!shop.ready) return <p role="status">Đang kiểm tra quyền…</p>;
  if (
    !shop.user?.permissions.includes("accounts.read") ||
    !shop.user.permissions.includes("catalog.read")
  )
    return (
      <Empty
        title="Bạn không có quyền quản trị"
        href="/login?next=/admin"
        label="Đăng nhập"
      />
    );
  return <AdminData />;
}
function AdminData() {
  const [query, setQuery] = useState("");
  const stats = useApiResource<Stats>("/admin/store/overview");
  const products = useApiResource<{
    items: {
      id: string;
      name: string;
      slug: string;
      status: string;
      variants: { id: string; price: { amount: string } }[];
    }[];
  }>("/admin/products?limit=100&q=" + encodeURIComponent(query));
  return (
    <section className="py-8">
      <h1>Quản trị cửa hàng</h1>
      {stats.error && <p role="alert">{stats.error}</p>}
      {stats.data && (
        <div className="my-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Sản phẩm", stats.data.products],
            ["Đơn hàng", stats.data.orders],
            ["Tồn vật lý", stats.data.stock.onHand ?? 0],
            ["Đã thu", money(stats.data.captured)],
          ].map(([label, value]) => (
            <article key={label} className="rounded border bg-white p-5">
              <h2>{value}</h2>
              <p>{label}</p>
            </article>
          ))}
        </div>
      )}
      <label>
        Tìm sản phẩm
        <input
          className="mx-3 rounded border p-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={150}
        />
      </label>
      {products.error && <p role="alert">{products.error}</p>}
      <div className="my-6 overflow-x-auto">
        <table className="w-full bg-white text-left">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Trạng thái</th>
              <th>Giá từ</th>
              <th>Trang sản phẩm</th>
            </tr>
          </thead>
          <tbody>
            {products.data?.items.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">{p.name}</td>
                <td>{p.status}</td>
                <td>
                  {p.variants[0]
                    ? money(p.variants[0].price.amount)
                    : "Chưa định giá"}
                </td>
                <td>
                  <Link href={`/products/${p.slug}`}>Xem</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
