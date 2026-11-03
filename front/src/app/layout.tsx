import { poppins } from "./fonts";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${poppins.variable}`}>{children}</body>
    </html>
  );
}
