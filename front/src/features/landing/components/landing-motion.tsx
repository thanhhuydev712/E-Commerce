"use client";

import { useEffect, useRef } from "react";

/** Progressive enhancement: SSR/không JS vẫn hiện nội dung, chỉ ẩn khối ngoài viewport. */
export function LandingMotion() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = marker.current?.parentElement;
    if (!root || !window.IntersectionObserver) return;

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>(":scope > section"),
    );
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;

    const show = (section: HTMLElement, stagger: boolean) => {
      const pending = section.dataset.reveal === "pending";
      delete section.dataset.reveal;
      observer?.unobserve(section);
      if (!pending || !stagger || preference.matches) return;

      const items = section.querySelectorAll<HTMLElement>(
        ".rf-reference-card, .rf-directory-grid > a, .rf-forge-article, .rf-brand-tile",
      );
      items.forEach((item, index) => {
        if (!item.animate) return;
        const animation = item.animate(
          [
            { opacity: 0, transform: "translateY(12px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 520,
            delay: Math.min(index, 7) * 55,
            easing: "cubic-bezier(0.22,1,0.36,1)",
            fill: "backwards",
          },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    };

    const reset = () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      sections.forEach((section) => delete section.dataset.reveal);
    };

    const observe = () => {
      reset();
      if (preference.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) show(entry.target as HTMLElement, true);
          });
        },
        { threshold: 0.08 },
      );
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top >= window.innerHeight) {
          section.dataset.reveal = "pending";
          observer?.observe(section);
        }
      });
    };

    // Tab tới nội dung ngoài màn hình phải thấy ngay, không đợi hết hiệu ứng.
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      const section = sections.find((item) =>
        item.contains(event.target as Node),
      );
      if (section) show(section, false);
    };

    observe();
    root.addEventListener("focusin", onFocus);
    preference.addEventListener("change", observe);
    return () => {
      reset();
      root.removeEventListener("focusin", onFocus);
      preference.removeEventListener("change", observe);
    };
  }, []);

  return <span ref={marker} hidden aria-hidden="true" />;
}
