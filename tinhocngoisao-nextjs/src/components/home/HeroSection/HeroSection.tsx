import { ArrowRight, BadgeCheck, ChevronRight, Headphones, Truck } from "lucide-react";
const servicePoints = [
  { icon: BadgeCheck, title: "Hàng chính hãng", detail: "Đầy đủ hóa đơn VAT" },
  { icon: Truck, title: "Giao hàng nhanh", detail: "Giao hàng toàn quốc" },
  { icon: Headphones, title: "Tư vấn tận tâm", detail: "Hỗ trợ trước & sau mua" },
];
export default function HeroSection() {
  return <>
    <section className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(260px,.9fr)]">
      <div className="group relative min-h-[330px] overflow-hidden rounded-2xl bg-slate-950 sm:min-h-[430px]">
        <img src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1500&q=90" alt="Bộ máy tính gaming hiệu năng cao" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/10" />
        <div className="relative flex min-h-[330px] max-w-xl flex-col items-start justify-center p-6 text-white sm:min-h-[430px] sm:p-12">
          <span className="mb-4 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[.2em] text-amber-300 sm:text-xs">TIN HỌC NGÔI SAO · DEAL CÔNG NGHỆ</span>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">NÂNG CẤP<br /><span className="text-red-500">TRẢI NGHIỆM</span><br />CỦA BẠN</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-200 sm:text-base">PC Gaming - Laptop - Linh kiện chính hãng. Giá tốt mỗi ngày, hỗ trợ build cấu hình theo nhu cầu.</p>
          <a href="/products" className="mt-7 inline-flex items-center gap-3 rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500">Khám phá ngay <ArrowRight size={17} /></a>
        </div>
        <span className="absolute bottom-5 right-5 rounded-md bg-white/15 px-3 py-1.5 text-[10px] font-bold tracking-widest text-white backdrop-blur">TECH DEALS 2026</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <a href="/products?category=laptop" className="group relative min-h-40 overflow-hidden rounded-2xl bg-slate-900 sm:min-h-[208px]"><img src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=85" alt="Laptop thế hệ mới" className="absolute inset-0 size-full object-cover opacity-70 transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-transparent" /><div className="relative flex h-full min-h-40 flex-col items-start justify-center p-4 text-white sm:min-h-[208px] sm:p-7"><span className="text-[9px] font-bold tracking-widest text-amber-300">WORK & PLAY</span><strong className="mt-2 text-lg font-black leading-tight sm:text-2xl">LAPTOP<br />THẾ HỆ MỚI</strong><span className="mt-3 flex items-center text-xs font-semibold">Khám phá ngay <ChevronRight size={14} /></span></div></a>
        <a href="/products?category=components" className="group relative min-h-40 overflow-hidden rounded-2xl bg-slate-900 sm:min-h-[208px]"><img src="https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=85" alt="Linh kiện máy tính" className="absolute inset-0 size-full object-cover opacity-70 transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-transparent" /><div className="relative flex h-full min-h-40 flex-col items-start justify-center p-4 text-white sm:min-h-[208px] sm:p-7"><span className="text-[9px] font-bold tracking-widest text-amber-300">UPGRADE YOUR PC</span><strong className="mt-2 text-lg font-black leading-tight sm:text-2xl">LINH KIỆN<br />PC CHÍNH HÃNG</strong><span className="mt-3 flex items-center text-xs font-semibold">Xem sản phẩm <ChevronRight size={14} /></span></div></a>
      </div>
    </section>
    <div className="mt-4 grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">{servicePoints.map(({icon: Icon,title,detail}) => <div key={title} className="flex items-center gap-3 px-3 py-4 sm:justify-center"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600"><Icon size={19}/></span><span><strong className="block text-sm">{title}</strong><small className="mt-0.5 block text-xs text-slate-500">{detail}</small></span></div>)}</div>
  </>;
}
