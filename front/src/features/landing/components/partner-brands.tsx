import Link from "next/link";
import { motion } from "@/src/components/ui/motion";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  reference_brands: [
    "rf-reference-brands bg-white bg-none px-5 py-6 mx-0 my-10.5 rounded-[14px] max-[768px]:px-3 max-[768px]:py-4.25",
    "max-[768px]:mx-0 max-[768px]:my-7 max-[768px]:rounded-[9px] [&>div:last-child]:grid",
    "[&>div:last-child]:grid-cols-[repeat(5,_1fr)] [&>div:last-child]:gap-3.75 [&>div:last-child>a]:flex",
    "[&>div:last-child>a]:items-center [&>div:last-child>a]:justify-center [&>div:last-child>a]:min-h-21.25",
    "[&>div:last-child>a]:text-[35px] [&>div:last-child>a]:font-black [&>div:last-child>a]:tracking-[-2px]",
    "[&>div:last-child>a]:border-[#e6ecec] [&>div:last-child>a]:border-solid [&>div:last-child>a]:border",
    "[&>div:last-child>a]:rounded-[35px] max-[1024px]:[&>div:last-child]:gap-2",
    "max-[1024px]:[&>div:last-child>a]:text-[26px] max-[1024px]:[&>div:last-child>a]:min-h-17.5",
    "max-[768px]:[&>div:last-child]:flex max-[768px]:[&>div:last-child]:overflow-x-auto",
    "max-[768px]:[&>div:last-child]:pb-1.5 max-[768px]:[&>div:last-child>a]:flex-[0_0_112px]",
    "max-[768px]:[&>div:last-child>a]:min-h-15 max-[768px]:[&>div:last-child>a]:text-[25px]",
  ].join(" "),
  reference_section_label: [
    "rf-reference-section-label flex items-center justify-between mb-5.5 gap-3 [&_h2]:bg-rf-green [&_h2]:bg-none",
    "[&_h2]:text-white [&_h2]:text-[13px] [&_h2]:font-extrabold [&_h2]:px-4.5 [&_h2]:py-2.5 [&_h2]:m-0",
    "[&_h2]:rounded-[24px] [&>a]:flex [&>a]:items-center [&>a]:text-rf-green [&>a]:text-[11px] [&>a]:font-bold",
    "[&>a]:gap-1 max-[768px]:mb-4.75 max-[768px]:gap-1.75 max-[768px]:[&_h2]:text-[10px] max-[768px]:[&_h2]:px-3",
    "max-[768px]:[&_h2]:py-2.25 max-[768px]:[&>a]:text-[8px]",
  ].join(" "),
  brand_strip_brand_kingston_brand_acer_brand_asrock_brand_dell_brand_lenovo: [
    "[&.rf-brand-strip]:flex [&.rf-brand-strip]:flex-wrap [&.rf-brand-strip]:items-center",
    "[&.rf-brand-strip]:justify-between [&.rf-brand-strip]:mt-9 [&.rf-brand-strip]:border-t",
    "[&.rf-brand-strip]:[border-top-style:solid] [&.rf-brand-strip]:border-t-rf-border [&.rf-brand-strip]:border-b",
    "[&.rf-brand-strip]:[border-bottom-style:solid] [&.rf-brand-strip]:border-b-rf-border [&.rf-brand-strip]:px-5",
    "[&.rf-brand-strip]:py-8 [&.rf-brand-strip]:gap-6 [&.rf-brand-strip>span]:max-w-32.5",
    "[&.rf-brand-strip>span]:text-[8px] [&.rf-brand-strip>span]:leading-[1.9] [&.rf-brand-strip>span]:tracking-[1px]",
    "[&.rf-brand-strip>span]:text-[#7e8c83] [&.rf-brand-strip>a]:text-[21px] [&.rf-brand-strip>a]:tracking-[-1px]",
    "[&.rf-brand-strip>a]:font-extrabold [&.rf-brand-strip>a]:text-[#7b8a7f]",
    "max-[1024px]:[&.rf-brand-strip]:justify-center max-[1024px]:[&.rf-brand-strip]:gap-5",
    "max-[1024px]:[&.rf-brand-strip>span]:max-w-none max-[1024px]:[&.rf-brand-strip>span]:w-full",
    "max-[1024px]:[&.rf-brand-strip>span]:text-center max-[768px]:[&.rf-brand-strip]:gap-y-4.5",
    "max-[768px]:[&.rf-brand-strip]:gap-x-6.5 max-[768px]:[&.rf-brand-strip]:px-0 max-[768px]:[&.rf-brand-strip]:py-5.75",
    "max-[768px]:[&.rf-brand-strip>a]:text-[19px] max-[768px]:[&.rf-brand-strip>span]:text-[7px]",
    "[&.rf-brand-strip>a:hover]:text-rf-green [&.rf-brand-kingston]:text-[#172830] [&.rf-brand-kingston_span]:text-[25px]",
    "[&.rf-brand-kingston_span]:tracking-[-1px] max-[1024px]:[&.rf-brand-kingston_span]:text-[18px]",
    "max-[768px]:[&.rf-brand-kingston_span]:text-[18px] [&.rf-brand-acer]:text-[#69aa36] [&.rf-brand-acer]:italic",
    "[&.rf-brand-asrock]:text-[#599a2b] [&.rf-brand-asrock]:italic [&.rf-brand-dell_span]:grid",
    "[&.rf-brand-dell_span]:place-items-center [&.rf-brand-dell_span]:w-16.25 [&.rf-brand-dell_span]:h-16.25",
    "[&.rf-brand-dell_span]:text-[23px] [&.rf-brand-dell_span]:text-[#0083b8] [&.rf-brand-dell_span]:tracking-[-1px]",
    "[&.rf-brand-dell_span]:border-[#0083b8] [&.rf-brand-dell_span]:border-solid [&.rf-brand-dell_span]:border-3",
    "[&.rf-brand-dell_span]:rounded-full max-[1024px]:[&.rf-brand-dell_span]:w-12.75",
    "max-[1024px]:[&.rf-brand-dell_span]:h-12.75 max-[1024px]:[&.rf-brand-dell_span]:text-[18px]",
    "max-[768px]:[&.rf-brand-dell_span]:h-11.25 max-[768px]:[&.rf-brand-dell_span]:w-11.25",
    "max-[768px]:[&.rf-brand-dell_span]:text-[16px] [&.rf-brand-lenovo]:text-[#cb2633]",
  ].join(" "),
};

// Wordmark dạng chữ, không gán cho Rigforge chứng nhận/quan hệ phân phối chưa xác minh.
const brands = ["Kingston", "acer", "ASRock", "DELL", "Lenovo"];
export function PartnerBrands() {
  return (
    <section className={tw.reference_brands}>
      <div className={tw.reference_section_label}>
        <h2>THƯƠNG HIỆU NỔI BẬT</h2>
      </div>
      <div className={motion.tiles}>
        {brands.map((brand) => (
          <Link
            href={`/products?brand=${encodeURIComponent(brand)}`}
            className={
              `rf-brand-${brand.toLowerCase()}` +
              " " +
              tw.brand_strip_brand_kingston_brand_acer_brand_asrock_brand_dell_brand_lenovo
            }
            key={brand}
            aria-label={`Sản phẩm ${brand}`}
          >
            <span>{brand}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
