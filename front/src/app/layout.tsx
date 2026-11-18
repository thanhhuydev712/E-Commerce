import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopProvider } from "@/src/providers/shop-provider";
import { CatalogProvider } from "@/src/catalog/catalog-provider";
import { getStorefront } from "@/src/catalog/server";
import "./globals.css";
import { STORE_IDENTITY } from "@/src/config/store-identity";

export const metadata: Metadata = {
  title: {
    default: `${STORE_IDENTITY.name} — PC, linh kiện & Gaming Gear`,
    template: `%s | ${STORE_IDENTITY.name}`,
  },
  description:
    "Khám phá PC, linh kiện và gaming gear tại RIGFORCE STORE. Tự chọn cấu hình theo nhu cầu của bạn.",
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
      <body className="m-0 bg-rf-bg font-sans text-base leading-normal text-rf-text antialiased selection:bg-rf-mint selection:text-rf-dark print:bg-white">
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
  const readOnlyPreview = process.env.PREVIEW_READ_ONLY === "true";
  return (
    <CatalogProvider initialData={data}>
      <ShopProvider
        key={String(readOnlyPreview)}
        readOnlyPreview={readOnlyPreview}
      >
        {readOnlyPreview && (
          <aside
            className="bg-slate-900 px-4 py-3 text-center text-sm text-white"
            aria-label="Phạm vi trải nghiệm"
          >
            Bản giới thiệu · Dữ liệu minh họa · Tài khoản, đặt hàng và thanh
            toán đang tắt.
          </aside>
        )}
        {children}
      </ShopProvider>
    </CatalogProvider>
  );
}
