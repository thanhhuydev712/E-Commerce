"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const AUTOPLAY_MS = 3000;
const SLIDE_MS = 700;

/** Banner giữ nguyên nội dung ảnh; carousel giữ state và xử lý thao tác. */
export function HeroSection() {
  const { bannerCampaigns } = useCatalog().presentation;

  // Hai bản sao ở hai đầu giúp bước cuối → đầu vẫn chỉ trượt đúng một ảnh.
  const [track, setTrack] = useState({ index: 1, instant: false });
  const trackPosition = useRef(track);
  const count = bannerCampaigns.length;
  const active = count ? (track.index - 1 + count) % count : 0;
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const captions = useRef<HTMLDivElement>(null);
  const trackElement = useRef<HTMLDivElement>(null);
  const pendingMoves = useRef(0);
  const resumeFrame = useRef(0);
  const gesture = useRef<{
    pointerId: number;
    x: number;
    y: number;
    horizontal: boolean;
    offset: number;
  } | null>(null);
  const suppressClick = useRef(false);

  const updateTrack = useCallback((position: typeof track) => {
    trackPosition.current = position;
    setTrack(position);
  }, []);

  const move = useCallback(
    (direction: number) => {
      if (count < 2) return;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const current = trackPosition.current;
      if (reduced) {
        updateTrack({
          index: ((current.index - 1 + direction + count) % count) + 1,
          instant: true,
        });
        return;
      }
      const next = current.index + direction;
      if (next < 0 || next > count + 1) {
        // Ghi nhớ chiều bấm tiếp ở mép vòng lặp, không chạy ra ngoài track.
        pendingMoves.current = direction;
        return;
      }
      updateTrack({ index: next, instant: false });
    },
    [count, updateTrack],
  );

  const selectSlide = (index: number) => {
    pendingMoves.current = 0;
    updateTrack({ index: index + 1, instant: false });
  };

  // Sau khi bản sao vào đúng khung, đổi sang ảnh gốc giống hệt, không animate.
  // Hai frame đảm bảo trình duyệt áp dụng vị trí mới trước thao tác kế tiếp.
  useEffect(() => {
    if (
      !count ||
      dragging ||
      track.instant ||
      (track.index !== 0 && track.index !== count + 1)
    )
      return;
    const element = trackElement.current;
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      updateTrack({ index: track.index === 0 ? count : 1, instant: true });
      resumeFrame.current = requestAnimationFrame(() => {
        resumeFrame.current = requestAnimationFrame(() => {
          const direction = Math.sign(pendingMoves.current);
          pendingMoves.current = 0;
          if (direction)
            updateTrack({
              index: trackPosition.current.index + direction,
              instant: false,
            });
        });
      });
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target === element && event.propertyName === "transform")
        settle();
    };
    element?.addEventListener("transitionend", onEnd);
    // Reduced motion hoặc tab nền có thể không phát transitionend.
    const timer = window.setTimeout(settle, SLIDE_MS + 80);
    return () => {
      element?.removeEventListener("transitionend", onEnd);
      window.clearTimeout(timer);
    };
  }, [count, dragging, track.index, track.instant, updateTrack]);

  useEffect(() => () => cancelAnimationFrame(resumeFrame.current), []);

  // Đổi slide bằng tay bắt đầu lại chu kỳ 3 giây. Không đổi khi đang kéo,
  // dùng bàn phím trong carousel hoặc khi tab trình duyệt đang bị ẩn.
  useEffect(() => {
    if (paused || focused || dragging || count < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        move(1);
      }
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [active, paused, focused, dragging, count, move]);

  useEffect(() => {
    const container = captions.current;
    const button = container?.children[active] as HTMLElement | undefined;
    if (!container || !button) return;
    // Chỉ cuộn hàng caption trên mobile, tránh kéo cả trang khi autoplay.
    container.scrollTo({
      left:
        button.offsetLeft - (container.clientWidth - button.clientWidth) / 2,
      behavior: "instant",
    });
  }, [active]);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    cancelAnimationFrame(resumeFrame.current);
    pendingMoves.current = 0;
    suppressClick.current = false;
    const renderedX = trackElement.current
      ? new DOMMatrixReadOnly(getComputedStyle(trackElement.current).transform)
          .m41
      : -track.index * event.currentTarget.clientWidth;
    const offset = renderedX + track.index * event.currentTarget.clientWidth;
    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      horizontal: false,
      offset,
    };
    setDragOffset(offset);
    setDragging(true);
  }

  function updateDrag(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.horizontal) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        finishDrag(event, true);
        return;
      }
      current.horizontal = true;
      suppressClick.current = true;
      // Bắt pointer sau khi xác định kéo ngang, giữ click link bình thường.
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDragOffset(current.offset + dx);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const distance = event.clientX - current.x;
    const threshold = Math.min(80, event.currentTarget.clientWidth * 0.12);
    if (!cancelled && current.horizontal && Math.abs(distance) >= threshold) {
      move(distance < 0 ? 1 : -1);
    } else updateTrack({ index: trackPosition.current.index, instant: false });
    gesture.current = null;
    setDragOffset(0);
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <section
      className="w-full max-w-[var(--rf-home-width)] overflow-hidden rounded-xl bg-white shadow-[0_3px_12px_#15283020]"
      aria-label="Chiến dịch nổi bật"
      aria-roledescription="carousel"
      onPointerDownCapture={() => setFocused(false)}
      onFocusCapture={(event) =>
        setFocused(event.target.matches(":focus-visible"))
      }
      onKeyDownCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <h1 className="sr-only">PC, linh kiện và gaming gear Rigforge</h1>
      <div className="relative overflow-hidden">
        <div
          className="rf-reference-hero-image touch-pan-y touch-pinch-zoom cursor-grab overflow-hidden select-none active:cursor-grabbing"
          onPointerDown={startDrag}
          onPointerMove={updateDrag}
          onPointerUp={finishDrag}
          onPointerCancel={(event) => finishDrag(event, true)}
          onLostPointerCapture={(event) => finishDrag(event, true)}
          onPointerLeave={(event) => {
            if (!gesture.current?.horizontal) finishDrag(event, true);
          }}
          onDragStart={(event) => event.preventDefault()}
          onClickCapture={(event) => {
            if (suppressClick.current) {
              event.preventDefault();
              event.stopPropagation();
              suppressClick.current = false;
            }
          }}
        >
          <div
            ref={trackElement}
            className={
              "rf-hero-track flex will-change-transform motion-reduce:transition-none " +
              (dragging || track.instant
                ? "transition-none"
                : "transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)]")
            }
            style={{
              transform:
                "translate3d(calc(-" +
                track.index * 100 +
                "% + " +
                dragOffset +
                "px), 0, 0)",
            }}
            aria-live={paused || focused ? "polite" : "off"}
          >
            {(count
              ? [
                  bannerCampaigns[count - 1],
                  ...bannerCampaigns,
                  bannerCampaigns[0],
                ]
              : []
            ).map((campaign, position) => {
              const clone = position === 0 || position === count + 1;
              const index = position - 1;
              return (
                <div
                  key={clone ? "clone-" + position : campaign.id}
                  id={clone ? undefined : "hero-slide-" + campaign.id}
                  role={clone ? "presentation" : "group"}
                  aria-roledescription={clone ? undefined : "slide"}
                  aria-label={
                    index +
                    1 +
                    " / " +
                    bannerCampaigns.length +
                    ": " +
                    campaign.title
                  }
                  aria-hidden={clone || active !== index}
                  inert={clone || active !== index}
                  className="relative aspect-3/1 w-full shrink-0"
                >
                  <Link
                    href={campaign.href}
                    draggable={false}
                    aria-label={"Khám phá " + campaign.title}
                    className="absolute inset-0 block focus-visible:-outline-offset-4!"
                  >
                    <Image
                      src={campaign.image}
                      alt={campaign.alt}
                      fill
                      loading={position === track.index ? "eager" : "lazy"}
                      fetchPriority={!clone && index === 0 ? "high" : "low"}
                      sizes="(max-width: 1023px) calc(100vw - 32px), (max-width: 1668px) calc(100vw - 128px), 1540px"
                      draggable={false}
                      className="object-contain"
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          className="absolute top-1/2 left-0 flex h-11 w-7 -translate-y-1/2 items-center justify-center rounded-r-full border-0 bg-black/30 text-white! transition-colors hover:bg-black/50 focus-visible:-outline-offset-4! sm:h-16 sm:w-9"
          aria-label="Banner trước"
          onClick={() => move(-1)}
        >
          <ChevronLeft className="size-6 sm:size-8" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="absolute top-1/2 right-0 flex h-11 w-7 -translate-y-1/2 items-center justify-center rounded-l-full border-0 bg-black/30 text-white! transition-colors hover:bg-black/50 focus-visible:-outline-offset-4! sm:h-16 sm:w-9"
          aria-label="Banner sau"
          onClick={() => move(1)}
        >
          <ChevronRight className="size-6 sm:size-8" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full border-0 bg-black/40 text-white! hover:bg-black/60 focus-visible:-outline-offset-4!"
          aria-label={
            paused ? "Bật tự động chuyển banner" : "Tạm dừng chuyển banner"
          }
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
      </div>
      <div
        ref={captions}
        className="relative flex overflow-x-auto overscroll-x-contain [scrollbar-width:none] md:grid md:grid-cols-6 [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Chọn chiến dịch"
      >
        {bannerCampaigns.map((campaign, index) => (
          <button
            key={campaign.id}
            type="button"
            onClick={() => selectSlide(index)}
            aria-pressed={active === index}
            aria-controls={"hero-slide-" + campaign.id}
            className={
              "relative flex min-h-20 w-44 shrink-0 flex-col items-center justify-center gap-1 border-0 border-b-[3px] border-solid bg-white px-3 py-4 text-center text-slate-800! transition-colors hover:bg-slate-50 focus-visible:-outline-offset-4! md:min-h-24 md:w-auto " +
              (active === index ? "border-b-[#ed1b2f]" : "border-b-transparent")
            }
          >
            <span
              className={
                "text-xs leading-5 lg:text-sm " +
                (active === index ? "font-bold" : "font-normal")
              }
            >
              {campaign.title}
            </span>
            <span
              className={
                "text-xs leading-5 " +
                (active === index ? "font-semibold" : "font-normal")
              }
            >
              {campaign.subtitle}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
