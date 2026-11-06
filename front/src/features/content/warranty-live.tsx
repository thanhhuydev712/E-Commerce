"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/src/catalog/api-client";
import { useShop } from "@/src/providers/shop-provider";
type Unit = {
  serialNumber: string;
  warrantyStart: string | null;
  warrantyEnd: string | null;
  status: string;
  variant: { sku: string; product: { name: string } };
};
export function WarrantyPage() {
  const shop = useShop(),
    [serial, setSerial] = useState(""),
    [units, setUnits] = useState<Unit[] | null>(null),
    [error, setError] = useState("");
  if (!shop.ready) return <p role="status">Đang khôi phục tài khoản…</p>;
  if (!shop.user)
    return (
      <section className="py-10">
        <h1>Tra cứu bảo hành</h1>
        <p>Đăng nhập để tra cứu serial thuộc đơn hàng của bạn.</p>
        <Link href="/login?next=/warranty">Đăng nhập</Link>
      </section>
    );
  return (
    <section className="my-8 rounded-lg border bg-white p-6">
      <h1>Tra cứu bảo hành</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            setUnits(
              await api<Unit[]>("/me/warranty/lookup", {
                method: "POST",
                body: { serial: serial.trim() },
              }),
            );
          } catch (cause) {
            setError((cause as Error).message);
          }
        }}
      >
        <label>
          Serial sản phẩm
          <input
            className="mx-3 rounded border p-3"
            required
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            maxLength={150}
          />
        </label>
        <button className="rounded bg-rf-green p-3 text-white">Kiểm tra</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {units?.length === 0 && (
        <p role="status">Không tìm thấy serial thuộc đơn hàng của bạn.</p>
      )}
      {units?.map((unit) => (
        <article key={unit.serialNumber} className="my-5 border p-4">
          <h2>{unit.variant.product.name}</h2>
          <p>
            {unit.serialNumber} · {unit.status}
          </p>
          <p>
            {unit.warrantyEnd
              ? "Bảo hành đến " +
                new Date(unit.warrantyEnd).toLocaleDateString("vi-VN")
              : "Chưa có thời hạn bảo hành được xác nhận"}
          </p>
        </article>
      ))}
      <Link className="mt-5 block" href="/account/warranties">
        Gửi yêu cầu hỗ trợ bảo hành
      </Link>
    </section>
  );
}
