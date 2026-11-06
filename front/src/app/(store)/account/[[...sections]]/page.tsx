import { Suspense } from "react";
import { notFound } from "next/navigation";
import AccountPage from "@/src/features/account/account-page";

// Catch-all giới hạn trong miền account; các miền khác có route riêng của Next.js.
async function AccountRoute({
  params,
}: {
  params: Promise<{ sections?: string[] }>;
}) {
  const { sections = [] } = await params;
  const [section, id, detail] = sections;
  const valid = [
    "orders",
    "profile",
    "addresses",
    "wishlist",
    "reviews",
    "returns",
    "warranties",
    "support",
    "notifications",
    "preferences",
    "security",
    "sessions",
  ];
  if (section && !valid.includes(section)) notFound();
  if (id && !["orders", "returns", "warranties", "support"].includes(section))
    notFound();
  if (
    detail &&
    (section !== "orders" ||
      !["tracking", "payment", "documents"].includes(detail))
  )
    notFound();
  if (sections.length > 3) notFound();
  return <AccountPage key={sections.join("/")} segments={sections} />;
}

// params chỉ được đọc trong component con của Suspense để giữ instant navigation của Next.js.
export default function Page(props: {
  params: Promise<{ sections?: string[] }>;
}) {
  return (
    <Suspense fallback={<p role="status">Đang chuẩn bị nội dung…</p>}>
      <AccountRoute {...props} />
    </Suspense>
  );
}
