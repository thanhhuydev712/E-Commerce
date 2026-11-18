import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Ảnh biên tập minh họa; dẫn tới PC Studio, không xác nhận hình lắp ráp đúng SKU. */
export function ForgeStudio() {
  return (
    <section
      aria-labelledby="forge-studio"
      className="grid overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#16152f,#35206d)] text-white md:grid-cols-[1fr_1.1fr]"
    >
      <Link
        href="/pc-builder"
        aria-label="Khám phá linh kiện trong PC Studio"
        className="group relative block min-h-64 overflow-hidden bg-[#38208b] focus-visible:outline-rf-cyan md:min-h-88"
      >
        <Image
          src="/images/forge-spectrum-components.webp"
          alt="Ảnh ý tưởng card đồ họa, mainboard, RAM và tản nhiệt trên nền tím và cyan"
          fill
          sizes="(max-width: 767px) calc(100vw - 32px), 46vw"
          className="rf-forge-studio-image object-cover transition-transform duration-700 group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transition-none"
        />
        <span className="absolute bottom-4 left-4 rounded-full bg-rf-ink/85 px-3 py-1 text-rf-caption text-white backdrop-blur">
          Ảnh linh kiện minh họa
        </span>
      </Link>
      <div className="relative flex min-w-0 flex-col items-start justify-center overflow-hidden p-6 md:p-9 lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -bottom-32 size-72 rounded-full bg-rf-cyan/15 blur-3xl"
        />
        <p className="relative mb-4 font-mono text-rf-caption tracking-[0.17em] text-rf-cyan">
          THE BUILD LAB / PC STUDIO
        </p>
        <h2
          id="forge-studio"
          className="relative mb-4 text-3xl leading-tight font-bold tracking-tight lg:text-4xl"
        >
          Từng linh kiện.
          <br /> <span className="text-rf-ember">Một chất riêng.</span>
        </h2>
        <p className="relative mb-6 max-w-lg text-rf-body leading-relaxed text-[#ddd5f7]">
          Tự chọn linh kiện, xem trước cách lắp và theo dõi tổng giá. Biến ý
          tưởng về góc máy thành cấu hình của riêng bạn.
        </p>
        <Link
          href="/pc-builder"
          className="relative inline-flex min-h-12 items-center gap-4 rounded-xl bg-rf-cyan px-5 py-3 text-rf-body font-bold text-rf-ink! hover:bg-[#8cf0f8] focus-visible:outline-rf-ember"
        >
          Bắt đầu xây cấu hình <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
