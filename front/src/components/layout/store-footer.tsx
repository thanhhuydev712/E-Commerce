import Link from "next/link";
import { Headphones, PackageCheck, ShieldCheck, Truck } from "lucide-react";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  footer_reference_footer: [
    "rf-footer rf-reference-footer bg-[#f0f5f7] bg-none print:hidden! [&_.rf-service-strip]:bg-transparent",
    "[&_.rf-service-strip]:bg-none [&_.rf-service-strip]:border-current [&_.rf-service-strip]:border-none",
    "[&_.rf-service-strip]:[border-width:0] [&_.rf-service-strip_svg]:text-rf-green",
    "[&_.rf-service-strip_strong]:uppercase [&_.rf-service-strip_strong]:text-[13px]",
    "[&_.rf-service-strip_small]:text-[11px] [&_.rf-footer-grid]:pt-8.75 [&_.rf-footer-grid]:pb-9.5",
    "[&_.rf-footer-grid]:grid-cols-[repeat(4,_minmax(0,_1fr))] [&_.rf-footer-grid]:gap-7",
    "[&_.rf-footer-grid_h4]:text-[16px] [&_.rf-footer-grid_h4]:text-[#14323d] [&_.rf-footer-grid_h4]:mt-0",
    "[&_.rf-footer-grid_h4]:mb-5.25 [&_.rf-footer-grid_h4]:relative [&_.rf-footer-grid_h4]:mx-0",
    "[&_.rf-footer-grid_a]:text-[14px] [&_.rf-footer-grid_a]:pb-1.25 [&_.rf-footer-grid_p]:text-[#425d69]",
    "[&_.rf-footer-grid_p]:text-[13px] [&_.rf-footer-grid_p]:leading-[1.7] [&_.rf-footer-grid_p]:mx-0",
    "[&_.rf-footer-grid_p]:my-3.75 [&_.rf-footer-socials>a]:w-7.75 [&_.rf-footer-socials>a]:h-8.25",
    "[&_.rf-footer-socials>a]:bg-[#143c50] [&_.rf-footer-socials>a]:bg-none [&_.rf-footer-socials>a]:text-white",
    "[&_.rf-footer-socials>a]:font-black [&_.rf-footer-socials>a]:text-[18px] [&_.rf-footer-socials>a]:grid",
    "[&_.rf-footer-socials>a]:place-items-center [&_.rf-footer-socials>a]:p-0 [&_.rf-footer-socials>a]:rounded-[5px]",
    "[&_.rf-footer-bottom]:block [&_.rf-footer-bottom]:pt-2.5 [&_.rf-footer-bottom]:pb-17.5",
    "[&_.rf-footer-bottom]:text-[12px] [&_.rf-footer-bottom]:leading-[1.8] [&_.rf-footer-bottom]:border-current",
    "[&_.rf-footer-bottom]:border-none [&_.rf-footer-bottom]:[border-width:0] [&_.rf-footer-bottom>p]:text-[#46606c]",
    "[&_.rf-footer-bottom>p]:m-0 max-[1024px]:[&_.rf-footer-grid]:grid-cols-[repeat(2,_minmax(0,_1fr))]",
    "max-[768px]:[&_.rf-service-strip_strong]:text-[10px] max-[768px]:[&_.rf-service-strip_small]:text-[9px]",
    "max-[768px]:[&_.rf-footer-grid]:gap-y-7 max-[768px]:[&_.rf-footer-grid]:gap-x-5",
    "max-[768px]:[&_.rf-footer-grid]:py-6.25 max-[768px]:[&_.rf-footer-grid_h4]:text-[12px]",
    "max-[768px]:[&_.rf-footer-grid_h4]:mb-4.75 max-[768px]:[&_.rf-footer-grid_a]:text-[12px]",
    "max-[768px]:[&_.rf-footer-grid_p]:text-[11px] max-[768px]:[&_.rf-footer-bottom]:text-[10px]",
    "max-[768px]:[&_.rf-footer-bottom]:pb-25 [&_.rf-service-strip>.rf-container]:pt-10",
    '[&_.rf-service-strip>.rf-container]:pb-7.5 [&_.rf-footer-grid_h4::after]:content-[""]',
    "[&_.rf-footer-grid_h4::after]:block [&_.rf-footer-grid_h4::after]:w-32.5 [&_.rf-footer-grid_h4::after]:h-0.5",
    "[&_.rf-footer-grid_h4::after]:bg-rf-green [&_.rf-footer-grid_h4::after]:bg-none",
    "[&_.rf-footer-grid_h4::after]:absolute [&_.rf-footer-grid_h4::after]:bottom-[-9px]",
    "[&_.rf-footer-grid_h4::after]:left-0 [&_.rf-footer-socials>a:nth-child(2)]:bg-[#087c62]",
    "[&_.rf-footer-socials>a:nth-child(2)]:bg-none [&_.rf-footer-socials>a:nth-child(3)]:bg-[#172936]",
    "[&_.rf-footer-socials>a:nth-child(3)]:bg-none max-[1024px]:[&_.rf-footer-grid>div:first-child]:[grid-column:auto]",
    "max-[768px]:[&_.rf-service-strip>.rf-container]:pt-6.25 max-[768px]:[&_.rf-service-strip>.rf-container]:pb-5",
    "max-[768px]:[&_.rf-footer-grid_h4::after]:w-22.5",
  ].join(" "),
  service_strip: [
    "rf-service-strip bg-white bg-none border-t [border-top-style:solid] border-t-rf-border border-b",
    "[border-bottom-style:solid] border-b-rf-border [&_svg]:text-rf-green [&_strong]:block [&_strong]:text-[12px]",
    "[&_strong]:font-semibold [&_small]:block [&_small]:text-[10px] [&_small]:text-rf-muted [&_small]:mt-0.75",
    "max-[768px]:[&_svg]:w-5.75 max-[768px]:[&_strong]:text-[11px] max-[768px]:[&_small]:text-[9px] print:hidden!",
    "[&>.rf-container]:grid [&>.rf-container]:grid-cols-[repeat(4,_1fr)] [&>.rf-container]:py-6.5 [&>.rf-container]:gap-7",
    "[&>.rf-container>div]:flex [&>.rf-container>div]:items-center [&>.rf-container>div]:gap-3.25",
    "max-[1024px]:[&>.rf-container]:grid-cols-[repeat(2,_1fr)] max-[768px]:[&>.rf-container]:gap-y-5.5",
    "max-[768px]:[&>.rf-container]:gap-x-3 max-[768px]:[&>.rf-container]:py-5.5",
    "max-[768px]:[&>.rf-container>div]:items-start max-[768px]:[&>.rf-container>div]:gap-2",
  ].join(" "),
  container_footer_grid: [
    "rf-container rf-footer-grid max-w-[var(--rf-content)] w-full grid grid-cols-[1.4fr_1fr_1fr_1fr] px-[var(--rf-content-gutter)] py-11.25",
    "mx-auto gap-12 max-[768px]:grid-cols-[1fr_1fr] max-[768px]:gap-y-7.5 max-[768px]:gap-x-4.5 max-[768px]:px-4",
    "max-[768px]:py-7.5 [&_h4]:text-[12px] [&_h4]:mt-0.75 [&_h4]:mb-4.75 [&_h4]:mx-0 max-[1200px]:gap-7 print:p-0",
    "[&>div:first-child_p]:text-[#6b7970] [&>div:first-child_p]:text-[11px] [&>div:first-child_p]:leading-[1.9]",
    "[&>div:first-child_p]:mx-0 [&>div:first-child_p]:my-4.5 [&_a:hover]:text-rf-green",
    "max-[768px]:[&>div:first-child]:col-span-full max-[768px]:[&>div:first-child_p]:my-3 [&>div>a:not(.rf-logo)]:flex",
    "[&>div>a:not(.rf-logo)]:items-center [&>div>a:not(.rf-logo)]:text-[11px] [&>div>a:not(.rf-logo)]:text-[#68776d]",
    "[&>div>a:not(.rf-logo)]:mx-0 [&>div>a:not(.rf-logo)]:my-2.5 [&>div>a:not(.rf-logo)]:gap-2",
  ].join(" "),
  container_footer_bottom: [
    "rf-container rf-footer-bottom max-w-[var(--rf-content)] w-full border-t [border-top-style:solid] border-t-rf-border",
    "flex items-center justify-between text-[#839088] text-[9px] px-[var(--rf-content-gutter)] py-4.25 mx-auto gap-5 max-[768px]:flex-col",
    "max-[768px]:items-start max-[768px]:pb-21.25 max-[768px]:px-4 max-[768px]:gap-1.25 print:p-0",
  ].join(" "),
  footer_demo_mark: [
    "rf-footer-demo-mark flex items-center w-46.25 bg-white bg-none text-rf-green mb-3.75 p-2.5 border-[#bcd5cf]",
    "border-solid border rounded-[7px] gap-2.25 [&>span]:flex [&>span]:flex-col [&>span]:text-[9px]",
    "[&_strong]:text-[14px] max-[768px]:mt-3.75",
  ].join(" "),
};

const columns = [
  {
    title: "GIỚI THIỆU RIGFORGE",
    links: [
      ["Về chúng tôi", "/pages/about"],
      ["Tư vấn mua hàng", "/support"],
      ["Hệ thống showroom", "/showrooms"],
      ["Xây dựng cấu hình", "/pc-builder"],
    ],
  },
  {
    title: "CHÍNH SÁCH CHUNG",
    links: [
      ["Chính sách bảo mật", "/pages/privacy"],
      ["Chính sách giao nhận", "/pages/shipping"],
      ["Giao hàng & thanh toán", "/pages/shipping"],
      ["Thông tin trả góp", "/pages/installments"],
      ["Chính sách bảo hành", "/pages/warranty"],
      ["Chính sách đổi – trả hàng", "/pages/returns"],
      ["Hướng dẫn mua hàng", "/support"],
    ],
  },
  {
    title: "THÔNG TIN KHUYẾN MÃI",
    links: [
      ["Tổng hợp khuyến mãi", "/promotions"],
      ["Trang tin tức – tư vấn", "/articles"],
      ["Sản phẩm mới", "/products?sort=newest"],
      ["Cấu hình đã lưu", "/account/builds"],
    ],
  },
  {
    title: "HỖ TRỢ KHÁCH HÀNG",
    links: [
      ["Trung tâm hỗ trợ", "/support"],
      ["Gửi yêu cầu hỗ trợ", "/account/support/new"],
      ["Theo dõi đơn hàng", "/account/orders"],
      ["Thông tin bảo hành", "/pages/warranty"],
      ["Tra cứu bảo hành", "/warranty"],
      ["Tài khoản của bạn", "/account"],
      ["Quản trị demo", "/admin"],
    ],
  },
];
const assurances = [
  {
    icon: Truck,
    title: "CHÍNH SÁCH GIAO HÀNG",
    description: "Thông tin giao nhận theo từng đơn",
  },
  {
    icon: PackageCheck,
    title: "ĐỔI TRẢ MINH BẠCH",
    description: "Điều kiện rõ ràng, dễ theo dõi",
  },
  {
    icon: ShieldCheck,
    title: "THÔNG TIN RÕ RÀNG",
    description: "Đối chiếu thông số trước khi chọn",
  },
  {
    icon: Headphones,
    title: "HỖ TRỢ TẬN TÌNH",
    description: "Đồng hành cùng cấu hình của bạn",
  },
];

// Footer là Server Component: các liên kết thật trong ứng dụng, thông tin kinh doanh chỉ là demo.
export function StoreFooter() {
  return (
    <footer className={tw.footer_reference_footer}>
      <div className={tw.service_strip}>
        <div className="rf-container max-w-[var(--rf-content)] w-full px-[var(--rf-content-gutter)] mx-auto max-[768px]:px-4 print:p-0">
          {assurances.map(({ icon: Icon, title, description }) => (
            <div key={title}>
              <Icon size={30} strokeWidth={1.5} />
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className={tw.container_footer_grid}>
        {columns.map((column, index) => (
          <div key={column.title}>
            <h4>{column.title}</h4>
            {column.links.map(([label, href]) => (
              <Link href={href} key={label}>
                {label}
              </Link>
            ))}
            {index === 0 && (
              <>
                <div className="rf-footer-socials flex mx-0 my-3.75 gap-1.75">
                  <Link href="/support" aria-label="Cộng đồng Rigforge">
                    f
                  </Link>
                  <Link href="/articles" aria-label="Nội dung Rigforge">
                    ▶
                  </Link>
                  <Link href="/pc-builder" aria-label="PC Studio">
                    R
                  </Link>
                </div>
                <span className="rf-demo-tag inline-flex items-center bg-[#eff5f1] bg-none text-[#496157] text-[10px] px-2.25 py-1 rounded-[4px]">
                  Development · Dữ liệu kiểm thử
                </span>
              </>
            )}
          </div>
        ))}
      </div>
      <div className={tw.container_footer_bottom}>
        <div className={tw.footer_demo_mark}>
          <ShieldCheck size={34} />
          <span>
            <strong>RIGFORGE</strong>KHÔNG GIAN TRẢI NGHIỆM
          </span>
        </div>
        <p>© 2026 RIGFORGE · Nơi bắt đầu của những cấu hình khác biệt.</p>
        <p>
          Giá, ưu đãi, showroom và chính sách dùng để minh họa giao diện. Không
          phát sinh giao dịch thật.
        </p>
      </div>
    </footer>
  );
}
