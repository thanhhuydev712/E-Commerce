import Link from "next/link";
import { STORE_IDENTITY } from "@/src/config/store-identity";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  logo: [
    "rf-logo inline-flex w-43.5 shrink-0 flex-col items-start gap-1 text-rf-ink",
    "max-[1024px]:w-36.25",
  ].join(" "),
};

// Cùng một viewBox giữ dấu hiệu và wordmark luôn vừa khung logo ở header mobile.
export function BrandLogo() {
  return (
    <Link
      href="/"
      className={tw.logo}
      aria-label={`${STORE_IDENTITY.name} trang chủ`}
    >
      <svg
        viewBox="0 0 184 32"
        className="h-auto w-full"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 4h19l7 7v8l-7 7H11v3H3V4Z" fill="currentColor" />
        <path d="M11 11h8l2 2v3l-2 2h-8v-7Z" fill="var(--rf-surface)" />
        <path d="M16 20h9l5 9H20l-4-9Z" className="fill-rf-accent" />
        <text
          x="39"
          y="25"
          fill="currentColor"
          fontSize="26"
          fontWeight="900"
          textLength="145"
          lengthAdjust="spacingAndGlyphs"
        >
          {STORE_IDENTITY.wordmark}
        </text>
      </svg>
      <small className="block text-[6px] leading-normal tracking-[1.5px] text-rf-muted">
        {STORE_IDENTITY.tagline}
      </small>
    </Link>
  );
}
