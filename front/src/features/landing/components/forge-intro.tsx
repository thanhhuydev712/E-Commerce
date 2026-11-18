import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Headphones, ShieldCheck, Truck } from "lucide-react";

/** Ảnh ý tưởng thương hiệu; không đại diện SKU hoặc cấu hình đang bán. */
export function ForgeIntro() {
  return (
    <section
      aria-labelledby="forge-intro-heading"
      className="relative isolate overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#19102e_0%,#321466_55%,#6540d8_100%)] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-16 size-96 rounded-full bg-[#ff5e9b]/20 blur-3xl"
      />
      <div className="relative grid items-center gap-7 p-6 md:grid-cols-[1fr_1.1fr] md:gap-8 md:p-8 lg:px-12 lg:py-6">
        <div className="relative z-1 min-w-0">
          <p className="mb-6 flex items-center gap-2 text-rf-caption font-semibold tracking-[0.17em] text-rf-cyan lg:mb-4">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-rf-cyan shadow-[0_0_14px_#45e2ef]"
            />
            RIGFORCE STORE / FORGED FOR YOU
          </p>
          <h1
            id="forge-intro-heading"
            className="m-0 text-[clamp(2rem,4.5vw,4.5rem)] leading-[1.12] font-bold tracking-[-0.05em] lg:text-[clamp(2rem,min(4.5vw,8svh),4.5rem)]"
          >
            <span className="block">Cấu hình của bạn.</span>
            <span className="mt-2 block bg-[linear-gradient(95deg,#ff795f,#ffafd6_55%,#91f1ff)] bg-clip-text text-transparent">
              Dấu ấn của bạn.
            </span>
          </h1>
          <p className="mt-6 mb-0 max-w-96 text-rf-body leading-relaxed text-[#e1d9fa] lg:mt-4">
            Bứt phá trong từng trận game. Sáng tạo không giới hạn. Bắt đầu từ
            góc máy mang chất riêng của bạn.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 lg:mt-5">
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-rf-ember px-5 py-3 text-rf-body font-bold text-rf-ink! shadow-[0_8px_28px_#ff795f35] hover:bg-[#ff9b87] focus-visible:outline-rf-cyan"
            >
              Khám phá sản phẩm <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/pc-builder"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-rf-body font-semibold text-white! hover:bg-white/15 focus-visible:outline-rf-cyan"
            >
              Tự xây cấu hình{" "}
              <ArrowUpRight
                size={18}
                className="text-rf-cyan"
                aria-hidden="true"
              />
            </Link>
          </div>
          <p className="mt-6 mb-0 font-mono text-rf-caption tracking-[0.12em] text-[#cdbcf8] lg:mt-4">
            BUILD. PLAY. CREATE.
          </p>
        </div>
        {/* Giữ ảnh 4:3; chừa vùng cho header, caption và dịch vụ khi tính chiều cao desktop. */}
        <figure className="relative m-0 min-w-0 w-full lg:max-w-[calc(clamp(16rem,100svh_-_24rem,38rem)*4/3)] lg:justify-self-center">
          <Link
            href="/pc-builder"
            aria-label="Khám phá PC Studio qua cấu hình minh họa"
            className="group block overflow-hidden rounded-2xl border border-white/20 bg-[#3d208a] shadow-[0_24px_70px_#08001f60] focus-visible:outline-rf-cyan"
          >
            <div className="relative aspect-4/3">
              <Image
                src="/images/forge-spectrum-pc.webp"
                alt="Ảnh ý tưởng PC kính trắng, bàn phím và chuột với ánh sáng RGB tím, cyan và san hô"
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 767px) calc(100vw - 80px), (max-width: 1535px) 48vw, 760px"
                className="rf-forge-hero-image object-contain transition-transform duration-700 ease-out group-hover:scale-[1.08] group-focus-visible:scale-[1.08] motion-reduce:transition-none"
              />
            </div>
          </Link>
          <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-rf-caption text-[#e1d9fa]">
            <span>RIGFORCE SPECTRUM</span>
            <span>Ảnh cấu hình minh họa</span>
          </figcaption>
        </figure>
      </div>
      <nav
        aria-label="Dịch vụ Rigforge"
        className="relative grid grid-cols-3 border-t border-white/15 bg-[#100b25]/30 px-4 py-2 text-rf-caption text-[#f0eaff] md:px-8 lg:px-12"
      >
        <Link
          href="/support"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-1 hover:bg-white/10 focus-visible:outline-rf-cyan md:justify-start"
        >
          <Headphones size={17} className="text-rf-cyan" />
          Tư vấn
        </Link>
        <Link
          href="/pages/warranty"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-1 hover:bg-white/10 focus-visible:outline-rf-cyan"
        >
          <ShieldCheck size={17} className="text-rf-ember" />
          Bảo hành
        </Link>
        <Link
          href="/pages/shipping"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-1 hover:bg-white/10 focus-visible:outline-rf-cyan md:justify-end"
        >
          <Truck size={17} className="text-rf-cyan" />
          Giao hàng
        </Link>
      </nav>
    </section>
  );
}
