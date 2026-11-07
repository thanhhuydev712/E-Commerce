"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import { useState } from "react";
import { Clock3, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Breadcrumb } from "@/src/components/storefront";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  showrooms_page: [
    "rf-showrooms-page bg-[#f5f6f7] bg-none px-5.5 py-7.5 rounded-[8px] [&>header]:text-center [&>header]:pt-5",
    "[&>header]:pb-8.75 [&>header]:px-3.75 [&_h1]:text-rf-green [&_h1]:text-[46px] [&_h1]:font-extrabold",
    "[&_h1]:leading-[1.15] [&_h1]:mx-0 [&_h1]:my-3.75 [&_header_p]:max-w-162.5 [&_header_p]:mt-0 [&_header_p]:mb-2.5",
    "[&_header_p]:text-[16px] [&_header_p]:leading-[1.7] [&_header_p]:text-rf-muted [&_header_p]:mx-auto",
    "[&_header_small]:text-rf-muted [&_header_small]:text-[12px] max-[768px]:px-2.5 max-[768px]:py-3.75",
    "max-[768px]:[&_h1]:text-[32px] max-[768px]:[&_header_p]:text-[14px]",
  ].join(" "),
  showroom_filters: [
    "rf-showroom-filters grid grid-cols-[repeat(3,_minmax(0,_1fr))] bg-white bg-none shadow-[0_9px_25px_#102e370a] p-5.5",
    "border-rf-border border-solid border rounded-[16px] gap-4 [&_label]:grid [&_label]:text-[13px] [&_label]:gap-2",
    "[&_select]:w-full [&_select]:bg-white [&_select]:bg-none [&_select]:text-[13px] [&_select]:text-rf-text",
    "[&_select]:px-2.5 [&_select]:py-3.25 [&_select]:border-[#d2d9d9] [&_select]:border-solid [&_select]:border",
    "[&_select]:rounded-[9px] max-[768px]:grid-cols-[1fr] max-[768px]:p-4",
  ].join(" "),
  showroom_list_heading: [
    "rf-showroom-list-heading flex justify-between items-center mt-6 mb-3.75 mx-0 gap-5 [&_h2]:text-[22px]",
    "[&_h2]:text-rf-green [&_p]:text-[13px] [&_p]:text-rf-muted [&_p]:mt-1.25 max-[768px]:[&_h2]:text-[19px]",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
  showroom_list: [
    "rf-showroom-list max-h-152.5 overflow-y-auto grid pr-1 gap-3 [&>button]:text-left [&>button]:bg-rf-dark",
    "[&>button]:bg-none [&>button]:text-white [&>button]:[border-top-width:0] [&>button]:[border-top-style:none]",
    "[&>button]:border-t-current [&>button]:[border-right-width:0] [&>button]:[border-right-style:none]",
    "[&>button]:border-r-current [&>button]:[border-bottom-width:0] [&>button]:[border-bottom-style:none]",
    "[&>button]:border-b-current [&>button]:border-l-6 [&>button]:[border-left-style:solid] [&>button]:border-l-[#67cb9f]",
    "[&>button]:p-5 [&>button]:rounded-[12px] [&_strong]:flex [&_strong]:justify-between [&_strong]:items-center",
    "[&_strong]:text-[16px] [&_strong]:mb-3.75 [&_strong]:gap-3 [&_strong_small]:bg-white [&_strong_small]:bg-none",
    "[&_strong_small]:text-rf-green [&_strong_small]:text-[10px] [&_strong_small]:whitespace-nowrap [&_strong_small]:px-2",
    "[&_strong_small]:py-1.25 [&_strong_small]:rounded-[18px] [&>button>span]:flex [&>button>span]:mt-2.5",
    "[&>button>span]:text-[12px] [&>button>span]:leading-[1.6] [&>button>span]:gap-2 [&_svg]:shrink-0 [&_svg]:mt-0.5",
    "max-[1024px]:[&_strong]:flex-wrap max-[768px]:max-h-102.5 [&>button.active]:bg-rf-green [&>button.active]:bg-none",
    "[&>button.active]:border-l-[#f2d37c]",
  ].join(" "),
  showroom_location: [
    "rf-showroom-location bg-white bg-none p-5 border-rf-border border-solid border rounded-[14px] [&_h2]:text-rf-green",
    "[&_h2]:text-[20px] [&_h2]:mb-2 [&>p]:text-[13px] [&>p]:text-rf-muted",
  ].join(" "),
  map_placeholder: [
    "rf-map-placeholder flex flex-col items-center justify-center text-center h-102.5 bg-[#edf4f0]",
    "bg-[linear-gradient(_30deg,_transparent_46%,_#fff_47%,_#fff_50%,_transparent_51%_),_linear-gradient(_120deg,_transparent_46%,_#d7e5dd_47%,_#d7e5dd_50%,_transparent_51%_)]",
    "[background-size:120px_120px] text-rf-green p-5 mx-0 my-4.5 border-[#d6e3de] border-solid border gap-3.5",
    "[&_strong]:bg-[#fffffff0] [&_strong]:bg-none [&_strong]:px-3 [&_strong]:py-1.75 [&_strong]:rounded-[5px]",
    "[&_span]:bg-[#fffffff0] [&_span]:bg-none [&_span]:px-3 [&_span]:py-1.75 [&_span]:rounded-[5px]",
    "[&_small]:bg-[#fffffff0] [&_small]:bg-none [&_small]:text-rf-muted [&_small]:px-3 [&_small]:py-1.75",
    "[&_small]:rounded-[5px] max-[768px]:h-75",
  ].join(" "),
};

/** Danh sách và vùng vị trí theo bố cục tham khảo, nội dung từ database development, chưa xác nhận điểm kinh doanh. */
export function ShowroomsPage() {
  const { showrooms } = useCatalog().presentation;

  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [room, setRoom] = useState("");
  const [selected, setSelected] = useState(showrooms[0]?.name ?? "");
  const matches = showrooms.filter(
    (r) =>
      (!region || r.region === region) &&
      (!city || r.city === city) &&
      (!room || r.name === room),
  );
  const current = matches.find((r) => r.name === selected) ?? matches[0];
  return (
    <>
      <Breadcrumb current="Hệ thống showroom" />
      <section className={tw.showrooms_page}>
        <header>
          <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
            ĐIỂM ĐẾN CÔNG NGHỆ
          </span>
          <h1>
            Hệ thống showroom
            <br />
            Rigforge
          </h1>
          <p>
            Khám phá không gian trải nghiệm, tư vấn cấu hình và hỗ trợ bảo hành.
          </p>
          <small>Địa điểm minh họa · Chưa có cửa hàng đang hoạt động</small>
        </header>
        <div className={tw.showroom_filters}>
          <label>
            Khu vực
            <select
              aria-label="Khu vực"
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setCity("");
                setRoom("");
              }}
            >
              <option value="">Tất cả khu vực</option>
              <option value="south">Miền Nam</option>
              <option value="highlands">Tây Nguyên</option>
            </select>
          </label>
          <label>
            Tỉnh / Thành phố
            <select
              aria-label="Tỉnh / Thành phố"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setRoom("");
              }}
            >
              <option value="">Tất cả tỉnh/thành</option>
              {[
                ...new Set(
                  showrooms
                    .filter((r) => !region || r.region === region)
                    .map((r) => r.city),
                ),
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Showroom
            <select
              aria-label="Showroom"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            >
              <option value="">Tất cả showroom</option>
              {showrooms
                .filter(
                  (r) =>
                    (!region || r.region === region) &&
                    (!city || r.city === city),
                )
                .map((r) => (
                  <option key={r.name}>{r.name}</option>
                ))}
            </select>
          </label>
        </div>
        <div className={tw.showroom_list_heading}>
          <div>
            <h2>Danh sách showroom</h2>
            <p role="status">Tìm thấy {matches.length} showroom mẫu</p>
          </div>
          <button
            className={tw.text_link}
            onClick={() => {
              setRegion("");
              setCity("");
              setRoom("");
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
        <div className="rf-showroom-explorer grid grid-cols-[0.85fr_1.2fr] items-start gap-6.5 max-[1024px]:grid-cols-[1fr_1fr] max-[1024px]:gap-3.75 max-[768px]:grid-cols-[1fr]">
          <div className={tw.showroom_list}>
            {!matches.length && (
              <p role="status">
                Chưa có showroom phù hợp. Bạn có thể đổi hoặc xóa bộ lọc.
              </p>
            )}
            {matches.map((r) => (
              <button
                className={r.name === current?.name ? "active" : ""}
                key={r.name}
                onClick={() => setSelected(r.name)}
                aria-pressed={r.name === current?.name}
              >
                <strong>
                  ★ {r.name}
                  {r.name === current?.name && <small>Đang xem</small>}
                </strong>
                <span>
                  <MapPin size={16} />
                  {r.location}
                </span>
                <span>
                  <Phone size={16} />
                  Tư vấn: chưa thiết lập hotline
                </span>
                <span>
                  <Clock3 size={16} />
                  Chưa có lịch hoạt động được xác nhận
                </span>
                <span>
                  <ShieldCheck size={16} />
                  Bảo hành: lịch tiếp nhận minh họa T2 – T7
                </span>
              </button>
            ))}
          </div>
          {current && (
            <article className={tw.showroom_location}>
              <h2>{current.name}</h2>
              <p>{current.location}</p>
              <div
                className={tw.map_placeholder}
                aria-label={`Vị trí minh họa ${current.name}`}
              >
                <MapPin size={52} />
                <strong>{current.name}</strong>
                <span>{current.location}</span>
                <small>Bản đồ sẽ được cập nhật khi có địa điểm thực tế.</small>
              </div>
              <p className="rf-form-hint text-[12px] text-rf-muted">
                Không có địa chỉ, số điện thoại hoặc chỉ đường kinh doanh thật
                trong bản demo.
              </p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
