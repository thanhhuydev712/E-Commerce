"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  dialog: [
    "rf-dialog m-auto w-[min(900px,_calc(100%_-_32px))] max-w-none max-h-[min(88dvh,860px)] overflow-hidden overscroll-none bg-white text-rf-text p-0 border-rf-border open:flex open:flex-col max-[640px]:w-[calc(100%_-_24px)] max-[640px]:max-h-[calc(100dvh_-_24px)]",
    "border-solid border rounded-2xl shadow-[0_24px_100px_#001b2040] backdrop:bg-transparent backdrop:bg-none backdrop:[backdrop-filter:blur(6px)]",
    "opacity-0 translate-y-2 open:opacity-100 open:translate-y-0 transition-[opacity,translate] duration-150 ease-out",
    "starting:open:opacity-0 starting:open:translate-y-2 motion-reduce:transition-none",
    "data-[closing=true]:opacity-0! motion-safe:data-[closing=true]:translate-y-2!",
    "open:backdrop:bg-[#071c19aa] backdrop:transition-colors backdrop:duration-150",
    "starting:open:backdrop:bg-transparent data-[closing=true]:backdrop:bg-transparent!",
  ].join(" "),
  icon_btn: [
    "rf-icon-btn inline-flex items-center justify-center bg-transparent bg-none min-w-9 min-h-9 p-2 border-current",
    "border-none [border-width:medium] rounded-[6px] print:hidden! hover:bg-[#edf4f0] hover:bg-none",
  ].join(" "),
};

let pageLocks = 0;
let restorePage: (() => void) | undefined;
function lockPageScroll() {
  if (pageLocks++ === 0) {
    const root = document.documentElement,
      body = document.body;
    const x = window.scrollX,
      y = window.scrollY;
    const properties = [
      "position",
      "top",
      "left",
      "width",
      "overflow",
      "padding-right",
    ];
    const saved = properties.map((property) => [
      property,
      body.style.getPropertyValue(property),
      body.style.getPropertyPriority(property),
    ]);
    const overflow = root.style.overflow,
      behavior = root.style.scrollBehavior;
    const gutter = window.innerWidth - root.clientWidth;
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
    root.style.overflow = "hidden";
    Object.assign(body.style, {
      position: "fixed",
      top: `${-y}px`,
      left: `${-x}px`,
      width: "100%",
      overflow: "hidden",
    });
    if (gutter > 0) body.style.paddingRight = `${padding + gutter}px`;
    restorePage = () => {
      for (const [property, value, priority] of saved) {
        if (value) body.style.setProperty(property, value, priority);
        else body.style.removeProperty(property);
      }
      root.style.overflow = overflow;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ left: x, top: y, behavior: "instant" });
      root.style.scrollBehavior = behavior;
    };
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--pageLocks === 0) {
      restorePage?.();
      restorePage = undefined;
    }
  };
}

// Component độc lập; nhận dữ liệu qua props, không truy cập API thật.
export function Dialog({
  title,
  children,
  onClose,
  toolbar,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  toolbar?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [closing, setClosing] = useState(false);
  // Giữ dialog trong top layer đến hết nhịp đóng; reduced motion đóng ngay.
  const close = () => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
    } else setClosing(true);
  };
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onClose, 160);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);
  // showModal cung cấp focus trap của trình duyệt; khi đóng trả focus về phần tử mở dialog.
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement;
    const unlock = lockPageScroll();
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
      unlock();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={tw.dialog}
      data-closing={closing}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (
          e.target === e.currentTarget &&
          (e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom)
        )
          close();
      }}
    >
      <div className="rf-dialog-head flex shrink-0 items-center justify-between gap-4 border-b border-rf-border px-6 py-4 max-[640px]:px-4">
        <h2 id={id} className="m-0 text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <button
          type="button"
          className={`${tw.icon_btn} bg-slate-50 text-slate-500`}
          onClick={close}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
      </div>
      {toolbar && (
        <div className="rf-dialog-toolbar shrink-0 border-b border-rf-border bg-slate-50/70 px-6 py-4 max-[640px]:px-4">
          {toolbar}
        </div>
      )}
      <div className="rf-dialog-body min-h-0 overflow-y-auto overscroll-contain px-6 py-5 max-[640px]:px-4">
        {children}
      </div>
    </dialog>
  );
}
