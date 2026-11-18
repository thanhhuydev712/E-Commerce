import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { BrandLogo } from "@/src/components/storefront/brand-logo";

// Marker rf-* được giữ cho layout theo route và kiểm thử dùng chung.
const tw = {
  footer:
    "rf-footer rf-reference-footer border-t border-rf-border bg-[#edebfa] text-rf-text print:hidden!",
  grid: [
    "rf-container rf-footer-grid mx-auto grid w-full max-w-[var(--rf-content)] grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]",
    "gap-8 px-[var(--rf-content-gutter)] py-10 max-[1024px]:gap-5 max-[768px]:grid-cols-1",
    "max-[768px]:gap-0 max-[768px]:px-4 max-[768px]:pt-7 max-[768px]:pb-3",
  ].join(" "),
  links: [
    "m-0 flex list-none flex-col gap-1 p-0 text-rf-small text-rf-muted",
    "[&_a]:inline-block [&_a]:py-1.5 [&_a:hover]:text-rf-accent max-[768px]:pb-3",
  ].join(" "),
  summary: [
    "flex min-h-13 cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold",
    "[&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rf-accent",
  ].join(" "),
  bottom: [
    "rf-container rf-footer-bottom mx-auto flex w-full max-w-[var(--rf-content)] items-start justify-between gap-5",
    "border-t border-rf-border px-[var(--rf-content-gutter)] pt-4 pb-6 text-rf-caption leading-relaxed text-rf-muted",
    "[&_p]:m-0 max-[768px]:flex-col max-[768px]:gap-2 max-[768px]:px-4 max-[768px]:pb-24",
  ].join(" "),
};

const columns = [
  {
    title: "Mua sắm",
    links: [
      ["Tất cả sản phẩm", "/products"],
      ["Xây dựng cấu hình", "/pc-builder"],
      ["Ưu đãi", "/promotions"],
      ["Tin công nghệ", "/articles"],
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      ["Trung tâm hỗ trợ", "/support"],
      ["Hệ thống showroom", "/showrooms"],
      ["Đơn hàng của bạn", "/account/orders"],
      ["Gửi yêu cầu hỗ trợ", "/account/support/new"],
      ["Tra cứu bảo hành", "/warranty"],
    ],
  },
  {
    title: "Chính sách",
    links: [
      ["Giao hàng & thanh toán", "/pages/shipping"],
      ["Bảo hành", "/pages/warranty"],
      ["Đổi trả", "/pages/returns"],
      ["Bảo mật", "/pages/privacy"],
    ],
  },
];

function FooterLinks({ links }: { links: string[][] }) {
  return (
    <ul className={tw.links}>
      {links.map(([label, href]) => (
        <li key={href}>
          <Link href={href}>{label}</Link>
        </li>
      ))}
    </ul>
  );
}

// Hai cách trình bày dùng cùng nguồn link; bản ẩn không tham gia thứ tự Tab.
// Disclosure native giữ footer mobile gọn mà không cần hydration hoặc client state.
export function StoreFooter() {
  return (
    <footer className={tw.footer}>
      <div className={tw.grid}>
        <div className="max-[768px]:pb-6">
          <BrandLogo />
          <p className="mt-4 mb-3 max-w-[28ch] text-rf-small leading-relaxed text-rf-muted">
            Máy tính và linh kiện, chọn theo cách của bạn.
          </p>
          <Link
            href="/pages/about"
            className="inline-flex items-center gap-1 text-rf-caption font-semibold text-rf-accent hover:text-rf-accent-hover"
          >
            Khám phá Rigforge <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="min-w-0">
            <section className="max-[768px]:hidden">
              <h3 className="mt-1 mb-3 text-[15px] font-semibold">
                {column.title}
              </h3>
              <FooterLinks links={column.links} />
            </section>
            <details className="group border-t border-rf-border min-[769px]:hidden">
              <summary className={tw.summary}>
                {column.title}
                <Plus
                  size={17}
                  aria-hidden="true"
                  className="text-rf-muted group-open:rotate-45"
                />
              </summary>
              <FooterLinks links={column.links} />
            </details>
          </div>
        ))}
      </div>
      <div className={tw.bottom}>
        <p className="shrink-0">© 2026 RIGFORCE STORE</p>
        <p className="max-w-[75ch] min-[769px]:text-right">
          Bản demo học tập · Giá, ưu đãi và chính sách là dữ liệu minh họa.
          Không phát sinh giao dịch thật.
        </p>
      </div>
    </footer>
  );
}
