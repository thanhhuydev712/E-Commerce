"use client";

import { useRef, type Key, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/src/components/ui/Button/Button";

type HorizontalProductCarouselProps<T> = {
  items: T[];
  getKey: (item: T) => Key;
  renderItem: (item: T, index: number) => ReactNode;
  itemClassName: string;
  ariaLabel?: string;
};

export default function HorizontalProductCarousel<T>({
  items,
  getKey,
  renderItem,
  itemClassName,
  ariaLabel = "Danh sách sản phẩm",
}: HorizontalProductCarouselProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    const track = trackRef.current;

    if (!track) return;

    track.scrollBy({
      left:
        direction === "left"
          ? -track.clientWidth * 0.8
          : track.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  if (!items.length) return null;

  return (
    <div
      className="relative w-full min-w-0"
      role="region"
      aria-label={ariaLabel}
    >
      {/* Product track */}
      <div
        ref={trackRef}
        className="
          flex items-stretch gap-3
          overflow-x-auto scroll-smooth
          px-1 py-2 pb-4
          snap-x snap-mandatory
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {items.map((item, index) => (
          <div
            key={getKey(item)}
            className={`
              min-w-0 shrink-0 snap-start
              ${itemClassName}
            `}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      {items.length > 1 && (
        <>
          <Button
            type="button"
            variant="outline"
            size="md"
            rounded="full"
            iconOnly
            aria-label="Sản phẩm trước"
            onClick={() => handleScroll("left")}
            className="
              absolute left-0 top-1/2 z-20
              h-8 w-8 sm:h-10 sm:w-10
              -translate-y-1/2
              border-0 bg-white p-0
              text-gray-600 shadow-lg
              hover:bg-orange-500 hover:text-white
            "
          >
            <ChevronLeft size={20} />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            rounded="full"
            iconOnly
            aria-label="Sản phẩm tiếp theo"
            onClick={() => handleScroll("right")}
            className="
              absolute right-0 top-1/2 z-20
              h-8 w-8 sm:h-10 sm:w-10
              -translate-y-1/2
              border-0 bg-white p-0
              text-gray-600 shadow-lg
              hover:bg-orange-500 hover:text-white
            "
          >
            <ChevronRight size={20} />
          </Button>
        </>
      )}
    </div>
  );
}
