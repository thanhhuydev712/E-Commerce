import type { ReactNode } from "react";
import { StoreLayout } from "@/src/components/layout/store-layout";

// Route group không đổi URL; dùng một layout thống nhất cho storefront.
export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <StoreLayout>{children}</StoreLayout>;
}
