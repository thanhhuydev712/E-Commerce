"use client";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <main className="mx-auto max-w-2xl p-10">
          <h1>Chưa kết nối được cửa hàng</h1>
          <p>
            Backend hoặc database đang không phản hồi. Không có dữ liệu mẫu thay
            thế.
          </p>
          <button onClick={() => reset()}>Thử kết nối lại</button>
        </main>
      </body>
    </html>
  );
}
