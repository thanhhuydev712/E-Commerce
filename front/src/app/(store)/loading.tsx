// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  empty: [
    "rf-empty flex items-center flex-col text-center bg-white bg-none px-6 py-17.5 border-[#d5e1db] border-dashed border",
    "rounded-[12px] [&>svg]:mb-5.5 [&>svg]:text-rf-green [&_h2]:mb-2.5 [&_h2]:text-[22px] [&_p]:text-rf-muted",
    "[&_p]:max-w-112.5 [&_p]:mb-6.25",
  ].join(" "),
  loader: [
    "rf-loader w-6 h-6 border-t-transparent border-r-[#6fa18c] border-b-[#6fa18c] border-l-[#6fa18c]",
    "animate-spin border-solid border-2 rounded-full",
  ].join(" "),
};
export default function Loading() {
  return (
    <div className={tw.empty} role="status" aria-live="polite">
      <span className={tw.loader} />
      <p>Đang chuẩn bị trải nghiệm Rigforge…</p>
    </div>
  );
}
