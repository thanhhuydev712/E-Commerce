import Link from "next/link";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  empty: [
    "rf-empty flex items-center flex-col text-center bg-white bg-none px-6 py-17.5 border-[#d5e1db] border-dashed border",
    "rounded-[12px] [&>svg]:mb-5.5 [&>svg]:text-rf-green [&_h2]:mb-2.5 [&_h2]:text-[22px] [&_p]:text-rf-muted",
    "[&_p]:max-w-112.5 [&_p]:mb-6.25",
  ].join(" "),
  btn: [
    "rf-btn inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-[12px] font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-transparent border-solid border",
    "rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
};

export default function NotFound() {
  return (
    <main className="rf-container [--rf-content:calc(var(--rf-home-width)+var(--rf-content-gutter)*2)] min-[1024px]:[--rf-content-gutter:64px] max-w-[var(--rf-content)] w-full px-[var(--rf-content-gutter)] mx-auto max-[768px]:px-4 print:p-0">
      <div className={tw.empty + " my-15"}>
        <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
          RIGFORGE · 404
        </span>
        <h1>Trang bạn tìm chưa có ở đây.</h1>
        <p>Thử quay về trang chủ để tiếp tục khám phá cấu hình phù hợp.</p>
        <Link href="/" className={tw.btn}>
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
