import Link from "next/link";
import { ChevronRight } from "lucide-react";
// Component độc lập; nhận dữ liệu qua props, không truy cập API thật.
export function Breadcrumb({
  current,
  parent,
}: {
  current: string;
  parent?: { label: string; href: string };
}) {
  return (
    <nav
      className="rf-breadcrumb flex flex-wrap items-center text-[11px] text-rf-muted mx-0 my-5.5 gap-2.25 [&_span]:text-ellipsis [&_span]:overflow-hidden"
      aria-label="Đường dẫn"
    >
      <Link href="/">Trang chủ</Link>
      <ChevronRight size={12} />
      {parent && (
        <>
          <Link href={parent.href}>{parent.label}</Link>
          <ChevronRight size={12} />
        </>
      )}
      <span>{current}</span>
    </nav>
  );
}
