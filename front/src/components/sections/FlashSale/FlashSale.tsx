"use client";

import Button from "@/src/components/ui/Button/Button";
import Image from "next/image";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, ArrowRight, Flame } from "lucide-react";

import HorizontalProductCarousel from "@/src/components/common/HorizontalProductCarousel";

type SaleProduct = {
  id: number;
  name: string;
  image: string;
  price: number;
  oldPrice: number;
  discount: number;
  soldPercent: number;
};

type SaleSchedule = {
  liveDate: Date;
  upcomingDate: Date;
  liveEndsAt: Date;
  upcomingStartsAt: Date;
};

// Demo sản phẩm đang sale
const liveProducts: SaleProduct[] = [
  {
    id: 1,
    name: "Màn hình Gaming AOC AGON CS24A/P | 25 inch 610Hz",
    image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600",
    price: 13900000,
    oldPrice: 16900000,
    discount: 18,
    soldPercent: 65,
  },
  {
    id: 2,
    name: "Ghế gaming CORSAIR T3 RUSH | Xám trắng",
    image: "https://images.unsplash.com/photo-1598300056393-4aac492f4344?w=600",
    price: 6690000,
    oldPrice: 6900000,
    discount: 3,
    soldPercent: 55,
  },
  {
    id: 3,
    name: "Bàn Phím Cơ Gaming Không Dây Dare-U Flex",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    price: 729000,
    oldPrice: 990000,
    discount: 26,
    soldPercent: 75,
  },
  {
    id: 4,
    name: "Bàn Gaming Centaur Trigger Desk | Chữ Z",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600",
    price: 579000,
    oldPrice: 699000,
    discount: 17,
    soldPercent: 45,
  },
  {
    id: 5,
    name: "Màn hình Gaming FPS Philips Evnia",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600",
    price: 2590000,
    oldPrice: 3290000,
    discount: 21,
    soldPercent: 80,
  },
  {
    id: 6,
    name: "Chuột gaming Asus TUF Gaming M3 Gen 2",
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600",
    price: 329000,
    oldPrice: 388000,
    discount: 15,
    soldPercent: 60,
  },
];

// Demo sản phẩm sắp sale
const upcomingProducts: SaleProduct[] = [
  {
    id: 7,
    name: "Laptop Gaming ASUS ROG Strix G16",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600",
    price: 24990000,
    oldPrice: 28990000,
    discount: 14,
    soldPercent: 0,
  },
  {
    id: 8,
    name: "Tai nghe Gaming không dây cao cấp",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    price: 1290000,
    oldPrice: 1690000,
    discount: 24,
    soldPercent: 0,
  },
  {
    id: 9,
    name: "Bàn phím Gaming RGB Mechanical",
    image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600",
    price: 890000,
    oldPrice: 1190000,
    discount: 25,
    soldPercent: 0,
  },
  {
    id: 10,
    name: "Bộ PC Gaming hiệu năng cao",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600",
    price: 15990000,
    oldPrice: 18990000,
    discount: 16,
    soldPercent: 0,
  },
  {
    id: 11,
    name: "Màn hình Gaming UltraWide 34 inch",
    image: "https://images.unsplash.com/photo-1593642532744-d377ab507dc8?w=600",
    price: 5990000,
    oldPrice: 7490000,
    discount: 20,
    soldPercent: 0,
  },
  {
    id: 12,
    name: "Gaming Mouse Wireless RGB",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600",
    price: 499000,
    oldPrice: 690000,
    discount: 28,
    soldPercent: 0,
  },
];

type SaleMode = "live" | "upcoming";

const formatPrice = (price: number) => {
  return `${price.toLocaleString("vi-VN")}₫`;
};

const formatDate = (date?: Date) => {
  if (!date) return "--/--/----";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Card sản phẩm
function SaleProductCard({ product }: { product: SaleProduct }) {
  return (
    <article className="group relative flex min-h-[440px] min-w-0 flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-[0_4px_15px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Hình ảnh sản phẩm */}
      <div className="relative flex h-[220px] shrink-0 items-center justify-center overflow-hidden">
        {/* Nhãn giảm giá */}
        <div className="absolute left-0 top-3 z-10 rounded-r-md bg-red-600 px-3 py-2 text-sm font-bold text-white shadow-sm">
          Giảm - {product.discount}%
        </div>

        <Image
          src={product.image}
          alt={product.name}
          width={600}
          height={600}
          loading="lazy"
          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Tên sản phẩm */}
      <h3 className="mt-2 line-clamp-2 min-h-[48px] text-center text-[15px] font-semibold leading-6 text-neutral-800">
        {product.name}
      </h3>

      {/* Giá */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xl font-extrabold text-red-600">
          {formatPrice(product.price)}
        </span>

        <span className="text-xs text-gray-400 line-through">
          {formatPrice(product.oldPrice)}
        </span>
      </div>

      {/* Trạng thái số lượng */}
      <div className="mt-auto pt-5">
        <div className="relative h-8 overflow-hidden rounded-full bg-gray-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
            style={{ width: `${product.soldPercent}%` }}
          />

          <div className="relative flex h-full items-center justify-center gap-1 text-xs font-bold uppercase text-white">
            <Flame size={15} />
            <span>
              {product.soldPercent === 0 ? "SẮP MỞ BÁN" : "SỐ LƯỢNG CÓ HẠN"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FlashSale({ onViewAll }: { onViewAll?: () => void }) {
  const [activeMode, setActiveMode] = useState<SaleMode>("live");

  // Chưa khởi tạo lịch khi render
  const [schedule, setSchedule] = useState<SaleSchedule | null>(null);

  // null giúp Server và Client có cùng giá trị ban đầu
  const [now, setNow] = useState<number | null>(null);

  // Khởi tạo lịch sale một lần

  const productList = activeMode === "live" ? liveProducts : upcomingProducts;

  // Khởi tạo lịch và đồng hồ đếm ngược
  // Chỉ cập nhật đồng hồ mỗi giây
  useEffect(() => {
    let intervalId: number | undefined;

    // Chỉ thực thi sau khi component đã mount
    const timeoutId = window.setTimeout(() => {
      const current = new Date();

      // Thời điểm kết thúc phiên sale hiện tại
      const liveEndsAt = new Date(current);
      liveEndsAt.setHours(6, 0, 0, 0);

      if (liveEndsAt <= current) {
        liveEndsAt.setDate(liveEndsAt.getDate() + 1);
      }

      // Ngày diễn ra phiên sale hiện tại
      const liveDate = new Date(liveEndsAt);
      liveDate.setDate(liveDate.getDate() - 1);
      liveDate.setHours(18, 0, 0, 0);

      // Thời điểm bắt đầu phiên sale tiếp theo
      const upcomingStartsAt = new Date(liveEndsAt);
      upcomingStartsAt.setHours(18, 0, 0, 0);

      setSchedule({
        liveDate,
        upcomingDate: upcomingStartsAt,
        liveEndsAt,
        upcomingStartsAt,
      });

      setNow(Date.now());

      // Cập nhật đồng hồ mỗi giây
      intervalId = window.setInterval(() => {
        setNow(Date.now());
      }, 1000);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);

      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  // Tính thời gian còn lại
  const targetTime = !schedule
    ? null
    : activeMode === "live"
      ? schedule.liveEndsAt.getTime()
      : schedule.upcomingStartsAt.getTime();

  const remaining =
    targetTime !== null && now !== null
      ? Math.max(0, Math.floor((targetTime - now) / 1000))
      : 0;

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const countdown = [
    { value: days, label: "Ngày" },
    { value: hours, label: "Giờ" },
    { value: minutes, label: "Phút" },
    { value: seconds, label: "Giây" },
  ];

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
      return;
    }

    window.location.href = "/flash-sale";
  };

  return (
    <section className="w-full overflow-hidden rounded-[22px] bg-[#fff0db] p-2 shadow-[0_8px_25px_rgba(255,100,50,0.15)]">
      {/* 1. Hai nút chọn phiên sale */}

      {/* 1. Hai nút chọn phiên sale */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="xl"
          rounded="xl"
          fullWidth
          onClick={() => setActiveMode("live")}
          className={`
      !h-[72px] sm:!h-[92px]
      min-w-0 px-2 sm:px-3
      flex-col gap-1 border transition-all duration-300
      ${
        activeMode === "live"
          ? "border-orange-400 bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:bg-gradient-to-r hover:from-orange-600 hover:to-pink-700 hover:text-white"
          : "border-orange-100 bg-gradient-to-b from-white to-orange-50 text-orange-800 hover:border-orange-300 hover:bg-orange-100 hover:text-orange-900"
      }
    `}
        >
          <span className="flex flex-col items-center gap-1">
            <span className="text-[11px] sm:text-sm font-medium">
              {formatDate(schedule?.liveDate)}
            </span>

            <span className="flex items-center gap-1 sm:gap-2 text-sm sm:text-xl font-bold whitespace-nowrap">
              <CalendarDays className="h-4 w-4 sm:h-[21px] sm:w-[21px]" />
              Đang diễn ra
            </span>
          </span>
        </Button>

        <Button
          variant="ghost"
          size="xl"
          rounded="xl"
          fullWidth
          onClick={() => setActiveMode("upcoming")}
          className={`
      !h-[72px] sm:!h-[92px]
      min-w-0 px-2 sm:px-3
      flex-col gap-1 border transition-all duration-300
      ${
        activeMode === "upcoming"
          ? "border-orange-400 bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:bg-gradient-to-r hover:from-orange-600 hover:to-pink-700 hover:text-white"
          : "border-orange-100 bg-gradient-to-b from-white to-orange-50 text-orange-800 hover:border-orange-300 hover:bg-orange-100 hover:text-orange-900"
      }
    `}
        >
          <span className="flex flex-col items-center gap-1">
            <span className="text-[11px] sm:text-sm font-medium">
              {formatDate(schedule?.upcomingDate)}
            </span>

            <span className="flex items-center gap-1 sm:gap-2 text-sm sm:text-xl font-bold whitespace-nowrap">
              <CalendarDays className="h-4 w-4 sm:h-[21px] sm:w-[21px]" />
              Sắp diễn ra
            </span>
          </span>
        </Button>
      </div>

      {/* 2. Khung giờ sale */}
      <div className="mt-3 flex h-[68px] items-center justify-center gap-2 border-b-[5px] border-[#ff4565] bg-white text-lg font-bold text-orange-600">
        <Clock3 size={22} />
        <span>18:00 - 06:00</span>
      </div>

      {/* 3. Danh sách sản phẩm */}

      <HorizontalProductCarousel
        items={productList}
        getKey={(product) => product.id}
        ariaLabel="Danh sách sản phẩm Flash Sale"
        itemClassName="
    w-[78%] min-w-[230px]
    sm:w-[calc((100%-24px)/3)]
    xl:w-[calc((100%-60px)/6)]
  "
        renderItem={(product) => <SaleProductCard product={product} />}
      />

      {/* 4. Đếm ngược và xem tất cả */}
      <div className="mt-3 flex flex-col gap-4 rounded-b-[18px] bg-gradient-to-r from-[#ffe5c2] via-[#ffbd75] to-[#ff9238] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Countdown */}
        {/* Countdown */}
        <div
          className="
  flex w-full flex-col
  items-center text-center
  sm:w-auto sm:items-start sm:text-left
"
        >
          <p
            className="
    mb-2 text-base font-bold
    text-rose-800
  "
          >
            {activeMode === "live" ? "Còn lại" : "Bắt đầu sau"}
          </p>

          <div
            className="
    grid w-full max-w-[360px]
    grid-cols-4 gap-2
    sm:w-auto sm:max-w-none
  "
          >
            {countdown.map((item) => (
              <div
                key={item.label}
                className="
          flex h-[52px] min-w-0 w-full
          flex-col items-center justify-center
          rounded-xl bg-white/95
          px-1 sm:min-w-[65px] sm:px-2
          shadow-[0_3px_8px_rgba(0,0,0,0.08)]
        "
              >
                <span
                  className="
          text-base font-extrabold
          leading-5 text-rose-800
        "
                >
                  {String(item.value).padStart(2, "0")}
                </span>

                <span
                  className="
          text-xs font-semibold text-rose-800
        "
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Xem tất cả */}
        <Button
          variant="outline"
          size="md"
          rounded="xl"
          rightIcon={<ArrowRight size={17} />}
          onClick={handleViewAll}
          className="!h-[43px] border-white/50 bg-white/15 font-bold text-white shadow-sm hover:border-white/70 hover:bg-white/25 hover:text-white"
        >
          Xem tất cả
        </Button>
      </div>
    </section>
  );
}
