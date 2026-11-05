"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/src/components/ui/Button/Button";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type MouseEvent,
} from "react";

export type BannerSlide = {
  id: string | number;
  image: string;
  mobileImage?: string;
  alt: string;
  href?: string;
  tabTitle: string;
  tabDescription?: string;
};

type BannerSliderProps = {
  slides: BannerSlide[];
  autoPlay?: boolean;
  interval?: number;
};

export default function BannerSlider({
  slides,
  autoPlay = true,
  interval = 3000,
}: BannerSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Thông tin của thao tác kéo chuột / cảm ứng.
  const dragStartX = useRef(0);
  const dragPointerId = useRef<number | null>(null);
  const hasMoved = useRef(false);
  const suppressClickUntil = useRef(0);

  const currentIndex = slides.length > 0 ? activeIndex % slides.length : 0;

  // Chuyển đến banner tiếp theo.
  const nextSlide = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  // Quay lại banner trước đó.
  const prevSlide = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay: mặc định 3 giây, không dừng khi rê chuột hoặc click tab.
  // Chỉ tạm dừng trong lúc người dùng đang kéo banner.
  // Đặt activeIndex trong dependency để đếm lại 3 giây sau khi người dùng
  // chọn tab hoặc chuyển slide bằng nút điều hướng.
  useEffect(() => {
    if (!autoPlay || isDragging || slides.length <= 1) return;

    const timer = window.setInterval(nextSlide, interval);
    return () => window.clearInterval(timer);
  }, [autoPlay, interval, isDragging, nextSlide, slides.length, activeIndex]);

  // Bắt đầu kéo.
  const handlePointerDown = (e: PointerEvent<HTMLElement>) => {
    // Chỉ nhận chuột trái; touch/pen vẫn được hỗ trợ.
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Không bắt thao tác kéo bắt đầu từ các Button điều hướng.
    if (e.target instanceof Element && e.target.closest("button")) return;
    if (slides.length <= 1) return;

    dragStartX.current = e.clientX;
    dragPointerId.current = e.pointerId;
    hasMoved.current = false;
    suppressClickUntil.current = 0;

    setIsDragging(true);

    // Capture trên section để vẫn nhận pointermove/pointerup khi kéo ra ngoài.
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Cập nhật vị trí banner theo chuyển động của con trỏ.
  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    if (dragPointerId.current !== e.pointerId) return;

    const distance = e.clientX - dragStartX.current;
    setDragOffset(distance);

    if (Math.abs(distance) > 5) {
      hasMoved.current = true;
    }
  };

  // Thả chuột: kéo quá 50px thì chuyển banner, nếu không thì quay lại.
  const handlePointerUp = (e: PointerEvent<HTMLElement>) => {
    if (dragPointerId.current !== e.pointerId) return;

    const distance = e.clientX - dragStartX.current;

    // Chặn click vào link nếu thao tác vừa rồi thực chất là kéo.
    suppressClickUntil.current = hasMoved.current ? Date.now() + 300 : 0;

    if (distance < -50) {
      nextSlide();
    } else if (distance > 50) {
      prevSlide();
    }

    dragPointerId.current = null;
    hasMoved.current = false;
    setDragOffset(0);
    setIsDragging(false);
  };

  // Dọn trạng thái nếu trình duyệt hủy thao tác pointer.
  const handlePointerCancel = () => {
    dragPointerId.current = null;
    hasMoved.current = false;
    suppressClickUntil.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  // Không điều hướng link khi người dùng vừa kéo banner.
  const handleClickCapture = (e: MouseEvent<HTMLElement>) => {
    if (
      suppressClickUntil.current &&
      Date.now() <= suppressClickUntil.current
    ) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickUntil.current = 0;
    }
  };

  if (!slides.length) return null;

  const hasMobileBanners = slides.every((slide) => Boolean(slide.mobileImage));

  return (
    <section
      className={`
        relative w-full overflow-hidden rounded-lg sm:rounded-xl
        bg-[#1b003b] select-none cursor-grab
        ${isDragging ? "cursor-grabbing" : ""}
        touch-pan-y
      `}
      role="region"
      aria-label="Banner khuyến mãi"
      aria-roledescription="carousel"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Banner image */}
      <div
        className={`
          relative w-full overflow-hidden
          ${hasMobileBanners ? "aspect-[4/3] md:aspect-[3/1]" : "aspect-[3/1]"}
        `}
      >
        {/* Slide track */}
        <div
          className={`
            absolute inset-0 flex
            ${isDragging ? "" : "transition-transform duration-500 ease-out"}
          `}
          style={{
            transform: `translate3d(calc(-${currentIndex * 100}% + ${dragOffset}px), 0, 0)`,
          }}
        >
          {slides.map((slide, index) => {
            const slideContent = slide.mobileImage ? (
              <>
                {/* Desktop image */}
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  draggable={false}
                  className="pointer-events-none hidden object-contain md:block"
                />

                {/* Mobile image */}
                <Image
                  src={slide.mobileImage}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  draggable={false}
                  className="pointer-events-none object-cover md:hidden"
                />
              </>
            ) : (
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                draggable={false}
                className="pointer-events-none object-contain"
              />
            );

            return (
              <div key={slide.id} className="relative h-full w-full shrink-0">
                {slide.href ? (
                  <Link
                    href={slide.href}
                    className="absolute inset-0 block"
                    aria-label={slide.alt}
                    draggable={false}
                  >
                    {slideContent}
                  </Link>
                ) : (
                  slideContent
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation buttons */}
        {slides.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              rounded="lg"
              iconOnly
              leftIcon={
                <ChevronLeft
                  className="h-5 w-5 md:h-6 md:w-6"
                  strokeWidth={2.5}
                />
              }
              onClick={prevSlide}
              aria-label="Banner trước"
              className="
                absolute left-0 top-1/2 z-20
                h-8 w-7 -translate-y-1/2
                rounded-l-none rounded-r-lg
                bg-[#1b003b]/80 text-white
                hover:bg-[#1b003b] hover:text-white
                active:scale-100
                sm:h-10 sm:w-8
                md:h-14 md:w-10
              "
            >
              <span className="sr-only">Banner trước</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="lg"
              rounded="lg"
              iconOnly
              leftIcon={
                <ChevronRight
                  className="h-5 w-5 md:h-6 md:w-6"
                  strokeWidth={2.5}
                />
              }
              onClick={nextSlide}
              aria-label="Banner tiếp theo"
              className="
                absolute right-0 top-1/2 z-20
                h-8 w-7 -translate-y-1/2
                rounded-r-none rounded-l-lg
                bg-[#1b003b]/80 text-white
                hover:bg-[#1b003b] hover:text-white
                active:scale-100
                sm:h-10 sm:w-8
                md:h-14 md:w-10
              "
            >
              <span className="sr-only">Banner tiếp theo</span>
            </Button>
          </>
        )}
      </div>

      {/* Banner tabs */}
      {slides.length > 1 && (
        <div
          className="
            hidden
    md:flex md:w-full md:items-stretch
    md:overflow-hidden
    bg-white
          "
        >
          {slides.map((slide, index) => {
            const isActive = currentIndex === index;

            return (
              <Button
                key={slide.id}
                type="button"
                variant="ghost"
                size="md"
                rounded="md"
                onClick={() => setActiveIndex(index)}
                aria-label={`Chuyển đến ${slide.tabTitle}`}
                aria-pressed={isActive}
                className={`
                  snap-start shrink-0
                  w-[155px] min-h-[64px]
                  px-3 py-2
                  rounded-none border-b-2
                  flex-col gap-1
  
                  [&>span]:flex
                  [&>span]:w-full
                  [&>span]:flex-col
                  [&>span]:items-center
                  [&>span]:gap-1
  
                  sm:w-[180px] sm:min-h-[72px]
  
                  md:w-auto md:min-w-0
                  md:flex-1 md:shrink
                  md:min-h-[82px]
                  md:px-4 md:py-3
  
                  ${
                    isActive
                      ? `
                        border-red-600 bg-gray-50 text-red-600
                        hover:bg-gray-50 hover:text-red-600
                      `
                      : `
                        border-transparent bg-white text-gray-700
                        hover:bg-gray-50 hover:text-gray-900
                      `
                  }
                `}
              >
                <span
                  className="
                    text-xs sm:text-sm
                    font-semibold leading-5
                    text-center whitespace-normal
                  "
                >
                  {slide.tabTitle}
                </span>

                {/* Description */}
                {slide.tabDescription && (
                  <span
                    className="
      hidden lg:block
      w-full
      text-xs
      font-normal
      leading-[1.5]
      text-center
      whitespace-normal
      break-words
      text-gray-600
    "
                  >
                    {slide.tabDescription}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </section>
  );
}
