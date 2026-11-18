"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

const subscribe = (callback: () => void) => {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", callback);
  return () => preference.removeEventListener("change", callback);
};
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Nghiêng ảnh phẳng vài độ; không sinh thêm góc chụp hoặc tải renderer 3D. */
export function PhotoTilt({ children }: { children: ReactNode }) {
  const surface = useRef<HTMLDivElement>(null);
  const angles = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const reduce = useSyncExternalStore(subscribe, reduced, () => true);
  const apply = (x: number, y: number) => {
    angles.current = {
      x: Math.max(-5, Math.min(5, x)),
      y: Math.max(-7, Math.min(7, y)),
    };
    surface.current?.style.setProperty("--tilt-x", `${angles.current.x}deg`);
    surface.current?.style.setProperty("--tilt-y", `${angles.current.y}deg`);
  };
  useEffect(() => {
    if (reduce) apply(0, 0);
  }, [reduce]);
  return (
    <div
      className="rf-photo-tilt w-full touch-pan-y rounded-xl [perspective:1000px] outline-offset-4"
      role="group"
      aria-label="Nghiêng nhẹ ảnh sản phẩm"
      tabIndex={0}
      onPointerDown={(event) => {
        if (event.button !== 0 || reduce) return;
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (reduce || (event.pointerType !== "mouse" && !dragging.current))
          return;
        const rect = event.currentTarget.getBoundingClientRect();
        apply(
          -((event.clientY - rect.top) / rect.height - 0.5) * 10,
          ((event.clientX - rect.left) / rect.width - 0.5) * 14,
        );
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerLeave={() => {
        if (!dragging.current) apply(0, 0);
      }}
      onPointerCancel={() => {
        dragging.current = false;
        apply(0, 0);
      }}
      onLostPointerCapture={() => {
        dragging.current = false;
      }}
      onBlur={() => apply(0, 0)}
      onKeyDown={(event) => {
        if (
          reduce ||
          !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
            event.key,
          )
        )
          return;
        event.preventDefault();
        const { x, y } = angles.current;
        if (event.key === "Home") apply(0, 0);
        else
          apply(
            x +
              (event.key === "ArrowUp"
                ? -2
                : event.key === "ArrowDown"
                  ? 2
                  : 0),
            y +
              (event.key === "ArrowLeft"
                ? -2
                : event.key === "ArrowRight"
                  ? 2
                  : 0),
          );
      }}
    >
      <div
        ref={surface}
        className="rf-photo-tilt-surface w-full origin-center [transform:rotateX(var(--tilt-x,0deg))_rotateY(var(--tilt-y,0deg))] transition-transform duration-200 ease-out motion-reduce:transition-none"
      >
        {children}
      </div>
    </div>
  );
}
