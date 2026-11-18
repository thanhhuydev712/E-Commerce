/** Utility tĩnh để Tailwind quét được; chỉ chuyển thuộc tính thị giác, không animate layout. */
export const motion = {
  controls: [
    "[&_:where(a,button,summary,input,select,textarea,label:has(input))]:transition-[color,background-color,border-color,box-shadow,opacity,filter,transform,translate,scale]",
    "[&_:where(a,button,summary,input,select,textarea,label:has(input))]:duration-300",
    "[&_:where(a,button,summary,input,select,textarea,label:has(input))]:ease-[cubic-bezier(0.22,1,0.36,1)]",
    "motion-reduce:[&_:where(a,button,summary,input,select,textarea,label:has(input))]:transition-none",
    "[&_:where(button:enabled,summary,.rf-btn[href]):hover]:brightness-95",
    "motion-safe:[&_:where(button:enabled):active]:scale-[0.98]",
    "[&_.lucide-arrow-up-right]:transition-[translate,transform] [&_.lucide-arrow-up-right]:duration-300",
    "motion-safe:[&_a:hover>.lucide-arrow-up-right]:translate-x-0.5 motion-safe:[&_a:hover>.lucide-arrow-up-right]:-translate-y-0.5",
    "[&_summary>svg]:transition-transform [&_summary>svg]:duration-300",
    "[&_nav_a:hover]:opacity-80",
  ].join(" "),
  enter: "motion-safe:animate-[rf-enter_350ms_cubic-bezier(0.22,1,0.36,1)]",
  landing: [
    "motion-safe:[&>section:first-child]:animate-[rf-enter_650ms_cubic-bezier(0.22,1,0.36,1)]",
    "[&>section]:transition-[opacity,translate] [&>section]:duration-700 [&>section]:ease-[cubic-bezier(0.22,1,0.36,1)]",
    "motion-safe:[&>section[data-reveal=pending]]:opacity-0 motion-safe:[&>section[data-reveal=pending]]:translate-y-6",
    "[&>section:focus-within]:opacity-100! [&>section:focus-within]:translate-y-0! [&>section:focus-within]:transition-none",
    "motion-reduce:[&>section]:transition-none print:[&>section]:opacity-100! print:[&>section]:translate-y-0!",
  ].join(" "),
  card: [
    "transition-[border-color,box-shadow,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
    "motion-safe:hover:-translate-y-1 motion-safe:focus-within:-translate-y-1",
    "hover:shadow-[inset_0_0_0_1px_#6334e350,0_10px_26px_#4224a41c]!",
    "focus-within:shadow-[inset_0_0_0_1px_#6334e370]!",
    "[&_.rf-product-photo]:overflow-hidden [&_.rf-product-photo-img]:transition-transform",
    "[&_.rf-product-photo-img]:duration-600 [&_.rf-product-photo-img]:ease-[cubic-bezier(0.22,1,0.36,1)]",
    "[&:hover_.rf-product-photo-img]:scale-[1.12] [&:focus-within_.rf-product-photo-img]:scale-[1.12]",
    "motion-reduce:[&_.rf-product-photo-img]:transition-none",
  ].join(" "),
  tiles: [
    "[&>a]:transition-[color,background-color,border-color,box-shadow,translate]",
    "[&>a]:duration-300 [&>a]:ease-[cubic-bezier(0.22,1,0.36,1)] [&>a:hover]:shadow-[0_5px_14px_#0b263114]",
    "motion-safe:min-[768px]:[&>a:hover]:-translate-y-0.5",
    "motion-reduce:[&>a]:transition-none",
  ].join(" "),
  media: [
    "[&_img]:transition-transform [&_img]:duration-600 [&_img]:ease-[cubic-bezier(0.22,1,0.36,1)]",
    "[&:hover_img]:scale-[1.10] [&:focus-within_img]:scale-[1.10] motion-reduce:[&_img]:transition-none",
  ].join(" "),
  search:
    "transition-[border-color,box-shadow] duration-200 ease-out focus-within:shadow-[0_0_0_3px_#6334e320]! motion-reduce:transition-none",
} as const;
