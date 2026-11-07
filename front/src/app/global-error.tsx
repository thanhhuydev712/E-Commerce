"use client";
import "./globals.css";
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="vi">
      <body className="m-0 bg-rf-bg font-sans text-rf-text">
        <main className="mx-auto max-w-[var(--rf-home-width)] px-4 py-16">
          <section className="mx-auto max-w-2xl rounded-xl border border-rf-border bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold">Chưa kết nối được cửa hàng</h1>
            <p>
              Hiện chưa tải được dữ liệu cửa hàng. Vui lòng thử lại trong giây
              lát.
            </p>
            <button
              className="mt-4 min-h-11 rounded-lg bg-rf-green px-5 py-3 font-semibold text-white hover:bg-rf-green-hover"
              onClick={() => retry()}
            >
              Thử kết nối lại
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
