import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  section_head: [
    "rf-section-head flex items-center justify-between mb-5.5 gap-4 [&_h2]:mt-1.25 [&_h2]:mb-0 [&_h2]:text-[25px]",
    "[&_h2]:leading-[1.3] [&_h2]:tracking-[-0.7px] [&_h2]:mx-0 max-[768px]:items-end max-[768px]:mb-4 max-[768px]:gap-2.5",
    "max-[768px]:[&_h2]:text-[21px]",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
};

// Component độc lập; nhận dữ liệu qua props, không truy cập API thật.
export function SectionTitle({
  title,
  eyebrow,
  href,
  children,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  children?: ReactNode;
}) {
  return (
    <div className={tw.section_head}>
      <div>
        {eyebrow && (
          <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
            {eyebrow}
          </span>
        )}
        <h2>{title}</h2>
      </div>
      <div className="rf-section-actions flex items-center shrink-0 gap-4 max-[768px]:[&_.rf-text-link]:text-[10px] max-[768px]:[&_.rf-text-link]:whitespace-nowrap">
        {children}
        {href && (
          <Link className={tw.text_link} href={href}>
            Xem tất cả <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
