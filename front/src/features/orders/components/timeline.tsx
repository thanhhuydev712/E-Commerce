"use client";
import { Check } from "lucide-react";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  timeline: [
    "rf-timeline list-none px-0 py-3.75 [&_li]:relative [&_li]:pt-0 [&_li]:pr-0 [&_li]:pb-7.5 [&_li]:pl-10",
    "[&_li]:border-l [&_li]:[border-left-style:solid] [&_li]:border-l-[#d6e2d8] [&_li]:ml-3 [&_li>span]:absolute",
    "[&_li>span]:left-[-12px] [&_li>span]:top-0 [&_li>span]:w-6 [&_li>span]:h-6 [&_li>span]:grid",
    "[&_li>span]:place-items-center [&_li>span]:text-[#467b55] [&_li>span]:bg-[#dcece0] [&_li>span]:bg-none",
    "[&_li>span]:text-[10px] [&_li>span]:rounded-full [&_strong]:text-[12px] [&_small]:block [&_small]:mt-1.25",
    "[&_small]:text-rf-muted [&_small]:text-[10px] [&_li:last-child]:[border-left-width:0]",
    "[&_li:last-child]:[border-left-style:none] [&_li:last-child]:border-l-current [&_li:last-child]:pb-0",
  ].join(" "),
};

// Dữ liệu nghiệp vụ từ CatalogProvider/ShopProvider kết nối API.
export function Timeline({ steps }: { steps: string[] }) {
  return (
    <ol className={tw.timeline}>
      {steps.map((s, i) => (
        <li key={s}>
          <span>{i === 0 ? <Check size={12} /> : i + 1}</span>
          <strong>{s}</strong>
          <small>
            {i === 0 ? "Trạng thái đã ghi nhận" : "Chưa có sự kiện thực tế"}
          </small>
        </li>
      ))}
    </ol>
  );
}
