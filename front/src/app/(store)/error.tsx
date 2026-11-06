"use client";
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

// Error boundary chỉ hiển thị thông báo thân thiện, không đưa stack trace ra giao diện.
export default function StoreError({ reset }: { reset: () => void }) {
  return (
    <div className={tw.empty}>
      <h1>Trang chưa tải được.</h1>
      <p>
        Thử lại để tiếp tục. Các thao tác đã lưu trên server được giữ nguyên.
      </p>
      <button className={tw.btn} onClick={reset}>
        Thử lại
      </button>
    </div>
  );
}
