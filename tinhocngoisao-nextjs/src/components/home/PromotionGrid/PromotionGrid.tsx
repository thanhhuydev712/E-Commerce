import { ArrowUpRight, Gift, Monitor, Percent, Wallet } from "lucide-react";
const promotions = [
  { title: "KHUYẾN MÃI PC", description: "Ưu đãi build PC theo nhu cầu", tag: "BUILD YOUR PC", icon: Monitor, href: "/pages/khuyen-mai-pc", theme: "from-red-600 to-rose-500" },
  { title: "LAPTOP ƯU ĐÃI", description: "Trợ giá và quà tặng hấp dẫn", tag: "LAPTOP DEAL", icon: Gift, href: "/pages/khuyen-mai-laptop", theme: "from-blue-600 to-cyan-500" },
  { title: "GAMING GEAR", description: "Phụ kiện gaming giá tốt", tag: "GEAR ZONE", icon: Percent, href: "/products?category=gaming-gear", theme: "from-violet-600 to-fuchsia-500" },
  { title: "MUA TRẢ GÓP", description: "Chia nhỏ thanh toán linh hoạt", tag: "PAYMENT", icon: Wallet, href: "/pages/tra-gop", theme: "from-orange-500 to-amber-400" },
];
export default function PromotionGrid() {
  return <section aria-label="Chương trình khuyến mãi" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{promotions.map(({title,description,tag,icon:Icon,href,theme}) => <a key={title} href={href} className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${theme} p-4 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-5`}><Icon className="absolute -right-2 -bottom-3 size-24 rotate-[-15deg] text-white/15 transition group-hover:scale-110"/><span className="relative block text-[9px] font-bold tracking-[.18em] text-white/80">{tag}</span><strong className="relative mt-2 block text-sm font-black sm:text-base">{title}</strong><small className="relative mt-1 block text-[10px] text-white/85 sm:text-xs">{description}</small><span className="relative mt-3 inline-flex size-7 items-center justify-center rounded-full bg-white/20"><ArrowUpRight size={16}/></span></a>)}</section>;
}
