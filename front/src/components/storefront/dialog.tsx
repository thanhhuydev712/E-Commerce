"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  dialog: [
    "rf-dialog m-auto w-[min(800px,_calc(100%_-_32px))] max-h-[85dvh] overflow-y-auto text-rf-text p-6 border-rf-border",
    "border-solid border rounded-[14px] backdrop:bg-transparent backdrop:bg-none backdrop:[backdrop-filter:blur(4px)]",
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

// Component độc lập; nhận dữ liệu qua props, không truy cập API thật.
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
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
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
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
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="rf-dialog-head flex items-center justify-between mb-5 gap-4 [&_h2]:text-[20px] [&_h2]:m-0">
        <h2 id={id}>{title}</h2>
        <button className={tw.icon_btn} onClick={close} aria-label="Đóng">
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
