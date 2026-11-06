import Link from "next/link";
import Image from "next/image";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  logo: [
    "rf-logo inline-flex flex-col items-start shrink-0 w-43.5 [&_img]:w-43.5 [&_img]:h-auto [&_img]:object-contain",
    "[&>span]:block [&>span]:text-[7px] [&>span]:tracking-[2.15px] [&>span]:text-[#53675d] [&>span]:mt-1.25",
    "max-[1024px]:w-36.25 max-[1024px]:[&_img]:w-36.25 max-[1024px]:[&>span]:tracking-[1.35px]",
    "max-[1024px]:[&>span]:text-[6px]",
  ].join(" "),
};

// Component độc lập; nhận dữ liệu qua props, không truy cập API thật.
export function BrandLogo() {
  return (
    <Link href="/" className={tw.logo} aria-label="Rigforge trang chủ">
      <Image
        src="/images/rigforge-website-logo.png"
        alt="Rigforge"
        width={174}
        height={41}
        priority
      />
      <span>FORGED FOR PERFORMANCE</span>
    </Link>
  );
}
