"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, Heart, MapPin, Menu, PhoneCall, Search, ShoppingCart, UserRound, X, Zap } from "lucide-react";
import { homeCategories } from "@/data/home-data";

type HeaderProps = { cartCount: number };
const quickLinks = ["PC Gaming", "Laptop", "CPU", "VGA", "RAM", "Mainboard"];
const categoryGroups = [
  { title: "PC - MÁY TÍNH", links: ["PC Gaming", "PC Văn phòng", "PC đồ hoạ", "PC AI", "Mini PC"] },
  { title: "LAPTOP", links: ["Laptop Gaming", "Laptop văn phòng", "Laptop AI", "Laptop đồ hoạ"] },
  { title: "LINH KIỆN", links: ["CPU", "Mainboard", "VGA", "RAM", "SSD - HDD", "Nguồn - PSU"] },
  { title: "THIẾT BỊ & PHỤ KIỆN", links: ["Màn hình", "Bàn phím", "Chuột", "Tai nghe", "Bàn ghế", "Thiết bị văn phòng"] },
];
const categoryHref = (value: string) => `/products?category=${encodeURIComponent(value.toLowerCase().replaceAll(" ", "-"))}`;

export default function Header({ cartCount }: HeaderProps) {
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = search.trim();
    if (keyword) window.location.href = `/search?q=${encodeURIComponent(keyword)}`;
  };

  return (
    <header className="relative z-50 bg-white shadow-sm">
      <div className="bg-slate-950 text-xs text-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <span className="flex items-center gap-2"><Zap size={14} className="text-amber-400" /> Giá tốt mỗi ngày - Ưu đãi công nghệ cập nhật liên tục</span>
          <div className="hidden items-center gap-5 md:flex">
            <a className="hover:text-amber-300" href="/pages/khuyen-mai">Khuyến mãi</a>
            <a className="hover:text-amber-300" href="/pages/tra-gop">Trả góp</a>
            <a className="flex items-center gap-1 hover:text-amber-300" href="/pages/showroom"><MapPin size={13} /> Showroom</a>
            <a className="flex items-center gap-1 hover:text-amber-300" href="/pages/lien-he"><PhoneCall size={13} /> 1900 0243</a>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-3 py-3 sm:gap-5 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Đóng danh mục" : "Mở danh mục"} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden">
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
          <a className="flex shrink-0 items-center gap-2" href="/" aria-label="Tin Học Ngôi Sao - Trang chủ">
            <span className="grid size-10 place-items-center rounded-xl bg-red-600 text-2xl font-black text-white">✦</span>
            <span className="leading-tight"><span className="block text-sm font-black tracking-tight text-slate-900 sm:text-base">TIN HỌC <b className="text-red-600">NGÔI SAO</b></span><small className="hidden text-[9px] font-semibold tracking-[.12em] text-slate-500 sm:block">LINH KIỆN - PHỤ KIỆN PC CHÍNH HÃNG</small></span>
          </a>
          <form onSubmit={handleSearch} role="search" className="mx-auto hidden h-11 max-w-2xl flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 md:flex">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Bạn cần tìm gì hôm nay?" aria-label="Tìm kiếm sản phẩm" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-slate-400" />
            <button type="submit" className="flex items-center gap-2 bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700"><Search size={17} /> Tìm kiếm</button>
          </form>
          <div className="ml-auto flex items-center gap-2 sm:gap-5">
            <a href="/account" className="hidden flex-col items-center gap-1 text-slate-600 hover:text-red-600 sm:flex"><UserRound size={21} /><span className="text-[11px]">Tài khoản</span></a>
            <a href="/wishlist" className="hidden flex-col items-center gap-1 text-slate-600 hover:text-red-600 sm:flex"><Heart size={21} /><span className="text-[11px]">Yêu thích</span></a>
            <a href="/cart" className="flex flex-col items-center gap-1 text-slate-700 hover:text-red-600"><span className="relative"><ShoppingCart size={23} /><b className="absolute -right-2 -top-2 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] leading-5 text-white">{cartCount}</b></span><span className="text-[11px]">Giỏ hàng</span></a>
          </div>
        </div>
        <form onSubmit={handleSearch} className="flex px-3 pb-3 md:hidden"><div className="flex h-10 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm sản phẩm..." aria-label="Tìm kiếm sản phẩm" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" /><button aria-label="Tìm kiếm" className="bg-red-600 px-4 text-white"><Search size={18} /></button></div></form>
      </div>

      <div className="hidden border-b border-slate-100 bg-white lg:block">
        <div className="relative mx-auto flex max-w-[1440px] items-center gap-7 px-8">
          <button type="button" aria-expanded={categoryOpen} onClick={() => setCategoryOpen((open) => !open)} className="flex h-12 items-center gap-2 bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700"><Menu size={17} /> Danh mục sản phẩm <ChevronDown size={14} /></button>
          <nav aria-label="Danh mục phổ biến" className="flex items-center gap-6">{quickLinks.map((link) => <a className="text-sm font-semibold text-slate-700 transition hover:text-red-600" href={categoryHref(link)} key={link}>{link}</a>)}</nav>
          <a href="/pages/xay-dung-cau-hinh" className="ml-auto text-sm font-bold text-red-600">Xây dựng cấu hình <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">NEW</span></a>
          {categoryOpen && <div className="absolute left-8 top-full z-50 grid w-[min(900px,calc(100vw-4rem))] grid-cols-4 gap-6 rounded-b-xl border border-slate-200 bg-white p-6 shadow-2xl">{categoryGroups.map((group) => <div key={group.title}><h3 className="mb-3 text-xs font-black tracking-wide text-slate-900">{group.title}</h3><div className="space-y-2">{group.links.map((link) => <a key={link} href={categoryHref(link)} onClick={() => setCategoryOpen(false)} className="block text-sm text-slate-600 hover:text-red-600">{link}</a>)}</div></div>)}</div>}
        </div>
      </div>
      {mobileOpen && <nav aria-label="Danh mục sản phẩm mobile" className="border-t border-slate-100 bg-white p-3 shadow-lg lg:hidden"><p className="px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500">Danh mục sản phẩm</p>{homeCategories.map((category) => <a key={category.id} href={category.href} onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600">{category.name}<span>›</span></a>)}<p className="mt-2 flex items-center gap-2 border-t border-slate-100 px-3 pt-4 text-sm font-semibold text-red-600"><PhoneCall size={16} /> Hotline: 1900 0243</p></nav>}
    </header>
  );
}
