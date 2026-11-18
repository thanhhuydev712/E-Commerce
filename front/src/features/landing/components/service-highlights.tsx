import Link from "next/link";
import {
  Cpu,
  Headphones,
  ShieldCheck,
  Truck,
  ArrowUpRight,
} from "lucide-react";

const services = [
  {
    title: "Chọn đúng cấu hình",
    detail: "Khám phá PC Studio",
    icon: Cpu,
    href: "/pc-builder",
  },
  {
    title: "Tư vấn cùng bạn",
    detail: "Tìm thiết bị phù hợp",
    icon: Headphones,
    href: "/support",
  },
  {
    title: "An tâm sử dụng",
    detail: "Tìm hiểu bảo hành",
    icon: ShieldCheck,
    href: "/pages/warranty",
  },
  {
    title: "Giao hàng rõ ràng",
    detail: "Xem chính sách vận chuyển",
    icon: Truck,
    href: "/pages/shipping",
  },
];

export function ServiceHighlights() {
  return (
    <section
      className="rf-reference-services mt-5 grid grid-cols-2 gap-x-5 gap-y-2 border-b border-rf-border pb-5 lg:grid-cols-4"
      aria-label="Dịch vụ Rigforge"
    >
      {services.map(({ title, detail, icon: Icon, href }) => (
        <Link
          key={title}
          href={href}
          className="group flex min-h-24 items-center gap-3 rounded-lg px-2 py-4 transition-colors hover:bg-white sm:px-3"
        >
          <Icon size={25} strokeWidth={1.4} className="text-rf-green" />
          <div className="min-w-0">
            <strong className="block text-rf-body font-semibold sm:text-base">
              {title}
            </strong>
            <span className="mt-1 block text-rf-caption text-rf-muted sm:text-rf-body">
              {detail}
            </span>
          </div>
          <ArrowUpRight
            size={15}
            className="ml-auto hidden text-rf-muted transition-transform group-hover:-translate-y-0.5 motion-reduce:transform-none sm:block"
          />
        </Link>
      ))}
    </section>
  );
}
