/** Utility tĩnh để Tailwind quét được; chỉ chuyển thuộc tính thị giác, không animate layout. */
export const motion = {
  controls: [
    "[&_:where(a,button,summary,input,select,textarea,label:has(input))]:transition-[color,background-color,border-color,box-shadow,opacity,filter,transform,translate,scale]",
    "[&_:where(a,button,summary,input,select,textarea,label:has(input))]:duration-200",
    "[&_:where(a,button,summary,input,select,textarea,label:has(input))]:ease-out",
    "motion-reduce:[&_:where(a,button,summary,input,select,textarea,label:has(input))]:transition-none",
    "[&_:where(button:enabled,summary,.rf-btn[href]):hover]:brightness-95",
    "motion-safe:[&_:where(button:enabled):active]:scale-[0.98]",
    "[&_nav_a:hover]:opacity-80",
  ].join(" "),
  enter: "motion-safe:animate-[rf-enter_200ms_cubic-bezier(0.16,1,0.3,1)]",
  card: [
    "transition-[border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
    "hover:shadow-[inset_0_0_0_1px_#007d6030,0_6px_18px_#0b263112]!",
    "focus-within:shadow-[inset_0_0_0_1px_#007d6040]!",
    "[&_.rf-product-photo]:overflow-hidden [&_.rf-product-photo-img]:transition-transform",
    "[&_.rf-product-photo-img]:duration-300 [&_.rf-product-photo-img]:ease-out",
    "motion-safe:[&:hover_.rf-product-photo-img]:scale-[1.04]",
    "motion-reduce:[&_.rf-product-photo-img]:transition-none",
  ].join(" "),
  tiles: [
    "[&>a]:transition-[color,background-color,border-color,box-shadow,translate]",
    "[&>a]:duration-200 [&>a]:ease-out [&>a:hover]:shadow-[0_5px_14px_#0b263114]",
    "motion-safe:min-[768px]:[&>a:hover]:-translate-y-0.5",
    "motion-reduce:[&>a]:transition-none",
  ].join(" "),
  media: [
    "[&_img]:transition-transform [&_img]:duration-300 [&_img]:ease-out",
    "motion-safe:[&:hover_img]:scale-[1.035] motion-reduce:[&_img]:transition-none",
  ].join(" "),
  search:
    "transition-[border-color,box-shadow] duration-200 ease-out focus-within:shadow-[0_0_0_3px_#007d6018]! motion-reduce:transition-none",
} as const;
