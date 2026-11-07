"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { Clock3, MapPin, Phone } from "lucide-react";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_showrooms: [
    "rf-reference-showrooms bg-white bg-none pt-12 pb-13.75 relative mt-9.5 isolate px-0 [&>h2]:text-[23px]",
    "[&>h2]:text-center [&>h2]:m-0 max-[768px]:mt-6.25 max-[768px]:px-0 max-[768px]:py-7.5 max-[768px]:[&>h2]:text-[17px]",
    'min-[1024px]:pt-13.75 min-[1024px]:pb-16.25 before:content-[""] before:absolute before:bg-white before:bg-none',
    "before:z-[-1] before:top-0 before:bottom-0 before:left-1/2 before:w-screen before:[transform:translateX(-50%)]",
    '[&>h2::after]:content-[""] [&>h2::after]:block [&>h2::after]:w-55 [&>h2::after]:h-0.5 [&>h2::after]:bg-[#233f48]',
    "[&>h2::after]:bg-none [&>h2::after]:mx-auto [&>h2::after]:my-3",
  ].join(" "),
  showroom_grid: [
    "rf-showroom-grid grid grid-cols-[repeat(4,_minmax(0,_1fr))] gap-y-5 gap-x-7 [&_h3]:flex [&_h3]:items-stretch",
    "[&_h3]:bg-rf-green [&_h3]:bg-none [&_h3]:text-white [&_h3]:mt-0 [&_h3]:mb-4.25 [&_h3]:text-[13px]",
    "[&_h3]:leading-[1.5] [&_h3]:mx-0 [&_h3]:rounded-[4px] [&_h3]:overflow-hidden [&_h3>span]:grid",
    "[&_h3>span]:place-items-center [&_h3>span]:bg-[#163340] [&_h3>span]:bg-none [&_h3>span]:px-3 [&_h3>span]:py-1.75",
    "[&_h3>a]:whitespace-nowrap [&_h3>a]:text-ellipsis [&_h3>a]:px-2.25 [&_h3>a]:py-1.75 [&_h3>a]:overflow-hidden",
    "[&_p]:flex [&_p]:items-start [&_p]:text-[#314b58] [&_p]:text-[13px] [&_p]:leading-[1.5] [&_p]:mx-0 [&_p]:my-1.75",
    "[&_p]:gap-1.25 [&_p>svg]:mt-0.75 [&_p>svg]:shrink-0 max-[1024px]:grid-cols-[repeat(2,_minmax(0,_1fr))]",
    "max-[768px]:gap-y-5.5 max-[768px]:gap-x-3.25 max-[768px]:[&_h3]:text-[10px] max-[768px]:[&_h3]:mb-3",
    "max-[768px]:[&_h3>span]:p-1.75 max-[768px]:[&_h3>a]:px-1.25 max-[768px]:[&_h3>a]:py-1.75",
    "max-[768px]:[&_p]:text-[10px] max-[768px]:[&_p]:gap-0.75 max-[768px]:[&_p>svg]:w-2.75",
    "max-[768px]:[&_p>svg]:min-w-2.75 min-[1024px]:gap-y-7 min-[1024px]:[&_p]:text-[14px]",
  ].join(" "),
};

// Bám grid 4×2 trong ảnh, chỉ dùng điểm minh họa; không mượn địa chỉ/hotline doanh nghiệp khác.
export function ShowroomSection() {
  const { showrooms } = useCatalog().presentation;
  return (
    <section className={tw.reference_showrooms}>
      <h2>HỆ THỐNG SHOWROOM RIGFORGE</h2>
      <p className="rf-showroom-note text-[11px] text-[#6a7d84] text-center mt-0 mb-6.5 mx-0 max-[768px]:text-[10px] max-[768px]:leading-[1.6] max-[768px]:mb-5.5">
        Các điểm dưới đây minh họa bố cục · Chưa phải địa điểm đang hoạt động
      </p>
      <div className={tw.showroom_grid}>
        {showrooms.map((room, index) => (
          <article key={room.name}>
            <h3>
              <span>{index + 1}</span>
              <Link href="/showrooms">★ {room.name}</Link>
            </h3>
            <p>
              <MapPin size={13} />
              <strong>{room.location}</strong>
            </p>
            <p>
              <Phone size={13} />
              <span>Tư vấn mua hàng: cập nhật sau</span>
            </p>
            <p>
              <Clock3 size={13} />
              <span>Chưa có lịch hoạt động được xác nhận</span>
            </p>
            <p>
              <Phone size={13} />
              <span>Liên hệ hỗ trợ để được hướng dẫn tiếp nhận bảo hành.</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
