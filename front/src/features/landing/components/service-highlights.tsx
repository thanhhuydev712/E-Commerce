import Link from "next/link";
import { Cpu, Headphones, ShieldCheck, Truck } from "lucide-react";
import { motion } from "@/src/components/ui/motion";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_services: [
    motion.tiles,
    "rf-reference-services grid grid-cols-[repeat(4,_minmax(0,_1fr))] mt-7 mb-8.5 mx-0 gap-6 [&>a]:relative",
    "[&>a]:min-h-25 [&>a]:bg-[repeating-linear-gradient(_90deg,_#0c2a37_0,_#0c2a37_20px,_#0c2631_20px,_#0c2631_40px_)]",
    "[&>a]:bg-transparent [&>a]:text-white [&>a]:flex [&>a]:items-center [&>a]:justify-between [&>a]:px-3.75 [&>a]:py-3.5",
    "[&>a]:rounded-[10px] [&>a]:overflow-hidden [&_span]:block [&_span]:text-[11px] [&_span]:font-bold [&_strong]:block",
    "[&_strong]:text-[#a7edbe] [&_strong]:text-[23px] [&_strong]:leading-[1.2] [&_strong]:font-black [&_strong]:mt-0.75",
    "[&_small]:block [&_small]:text-[7px] [&_small]:mt-3 [&_small]:text-[#c5d9d5] [&_svg]:text-[#7fdab0]",
    "max-[1024px]:gap-3 max-[1024px]:[&_strong]:text-[18px] max-[1024px]:[&_svg]:w-8.75 max-[1024px]:[&_span]:text-[9px]",
    "max-[1024px]:[&_small]:text-[6px] max-[768px]:grid-cols-[repeat(2,_minmax(0,_1fr))] max-[768px]:mt-4",
    "max-[768px]:mb-5.5 max-[768px]:mx-0 max-[768px]:gap-2.5 max-[768px]:[&>a]:min-h-21 max-[768px]:[&>a]:p-2.75",
    "max-[768px]:[&>a]:rounded-[7px] max-[768px]:[&_strong]:text-[19px] max-[768px]:[&_span]:text-[8px]",
    "max-[768px]:[&_small]:hidden max-[768px]:[&_svg]:w-8.5",
  ].join(" "),
};

// Bốn banner ngang như ảnh mẫu; dùng HTML để đổi tone mà không đổi màu ảnh sản phẩm.
const services = [
  {
    title: "PC BẢO HÀNH",
    highlight: "AN TÂM",
    detail: "Chính sách rõ ràng theo từng SKU",
    icon: ShieldCheck,
    href: "/pages/warranty",
  },
  {
    title: "TƯ VẤN LAPTOP / PC",
    highlight: "TẬN TÂM",
    detail: "Lựa chọn phù hợp với nhu cầu",
    icon: Headphones,
    href: "/support",
  },
  {
    title: "XÂY DỰNG CẤU HÌNH",
    highlight: "CÙNG BẠN",
    detail: "Trải nghiệm chọn linh kiện 3D",
    icon: Cpu,
    href: "/pc-builder",
  },
  {
    title: "ƯU ĐÃI GIAO HÀNG",
    highlight: "MỖI NGÀY",
    detail: "Điều kiện trong checkout mẫu",
    icon: Truck,
    href: "/pages/shipping",
  },
];
export function ServiceHighlights() {
  return (
    <section className={tw.reference_services} aria-label="Dịch vụ Rigforge">
      {services.map(({ title, highlight, detail, icon: Icon, href }) => (
        <Link href={href} key={title}>
          <div>
            <span>{title}</span>
            <strong>{highlight}</strong>
            <small>{detail}</small>
          </div>
          <Icon size={50} strokeWidth={1.5} />
        </Link>
      ))}
    </section>
  );
}
