import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopProvider } from "@/src/providers/shop-provider";
import { CatalogProvider } from "@/src/catalog/catalog-provider";
import { getStorefront } from "@/src/catalog/server";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rigforge — PC, linh kiện & Gaming Gear",
    template: "%s | Rigforge",
  },
  description:
    "Khám phá cấu hình PC, linh kiện và gaming gear. Tự xây dựng cấu hình của bạn với Rigforge PC Studio.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      data-scroll-behavior="smooth"
      className="scroll-smooth scroll-pt-[150px] motion-reduce:scroll-auto"
    >
      {/* Catalog đọc từ API server; phiên và thao tác tài khoản qua ShopProvider. */}
      <body className="m-0 bg-rf-bg font-sans text-sm leading-normal text-rf-text antialiased selection:bg-rf-mint selection:text-rf-dark print:bg-white">
        <Suspense
          fallback={
            <p className="p-8" role="status">
              Đang kết nối cửa hàng…
            </p>
          }
        >
          <ConnectedStore>{children}</ConnectedStore>
        </Suspense>
      </body>
    </html>
  );
}

async function ConnectedStore({ children }: { children: React.ReactNode }) {
  const data = await getStorefront();
  return (
    <CatalogProvider initialData={data}>
      <ShopProvider>{children}</ShopProvider>
    </CatalogProvider>
  );
}
