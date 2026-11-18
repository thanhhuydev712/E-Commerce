"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Layers3, Sparkles } from "lucide-react";
import { Dialog } from "@/src/components/storefront/dialog";
import { STORE_IDENTITY } from "@/src/config/store-identity";
import { WELCOME_PROMOTION_COOKIE } from "@/src/config/welcome-promotion";

// Dự phòng trong tab hiện tại nếu trình duyệt chặn cookie.
let shownInThisTab = false;

function WelcomeOffer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shownInThisTab) return;
    try {
      if (
        document.cookie
          .split(";")
          .some((entry) => entry.trim() === `${WELCOME_PROMOTION_COOKIE}=seen`)
      )
        return;
    } catch {
      // Cookie bị chặn vẫn có thể xem và đóng popup bình thường.
    }
    const timer = window.setTimeout(() => {
      // Không giành focus khi khách đã bắt đầu nhập hoặc mở một dialog khác.
      if (
        document.visibilityState !== "visible" ||
        document.querySelector("dialog[open]") ||
        document.activeElement?.matches(
          "input, textarea, select, [contenteditable=true]",
        )
      )
        return;
      shownInThisTab = true;
      try {
        document.cookie = `${WELCOME_PROMOTION_COOKIE}=seen; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      } catch {
        // Giữ cờ bộ nhớ cho phiên hiện tại khi storage không dùng được.
      }
      setOpen(true);
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => setOpen(false);
  if (!open) return null;

  return (
    <div className="rf-welcome-promotion contents [&_.rf-dialog]:border-white/15 [&_.rf-dialog]:bg-rf-ink [&_.rf-dialog]:text-white [&_.rf-dialog-head]:border-white/10 [&_.rf-dialog-head]:px-5 [&_.rf-dialog-head_h2]:text-rf-caption [&_.rf-dialog-body]:p-0! [&_.rf-icon-btn]:text-white [&_.rf-icon-btn]:bg-white/10 [&_.rf-icon-btn:hover]:bg-white/20">
      <Dialog title={`Chào bạn đến ${STORE_IDENTITY.name}`} onClose={close}>
        <div className="grid md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative isolate flex min-w-0 flex-col overflow-hidden bg-[linear-gradient(145deg,#34d9e8,#7754ed)] max-md:h-32 md:min-h-100">
            <span className="relative z-1 m-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/50 bg-rf-ink/80 px-3 py-1.5 font-mono text-xs tracking-[0.12em] text-white max-md:absolute max-md:top-3 max-md:left-3 max-md:m-0 max-md:max-w-32 max-md:gap-1 max-md:px-2 max-md:text-[10px]">
              <Sparkles size={14} className="text-rf-cyan" aria-hidden="true" />
              THE NEXT SETUP
            </span>
            <div className="relative aspect-4/3 w-full flex-1 max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:aspect-auto max-md:w-[62%]">
              <Image
                src="/images/forge-spectrum-components.webp"
                alt="Linh kiện PC trên nền tím và cyan, ảnh ý tưởng minh họa"
                fill
                sizes="(max-width: 767px) calc(100vw - 32px), 420px"
                className="object-contain"
              />
            </div>
            <p className="relative z-1 m-0 px-5 pt-3 pb-5 font-mono text-xs tracking-[0.16em] text-rf-ink max-md:absolute max-md:bottom-3 max-md:left-3 max-md:w-32 max-md:p-0 max-md:text-[9px] max-md:tracking-[0.08em]">
              BUILD. PLAY. CREATE.
            </p>
          </div>
          <div className="relative flex flex-col justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top_right,#6334e355,transparent_75%)] p-5 md:p-8">
            <p className="mb-4 hidden items-center gap-2 text-rf-caption font-semibold tracking-[0.12em] text-rf-cyan md:flex">
              <span
                className="size-2 rounded-full bg-rf-cyan shadow-[0_0_12px_#45e2ef]"
                aria-hidden="true"
              />
              RIGFORCE PICKS
            </p>
            <h3 className="mb-4 text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.1] tracking-tight">
              Góc máy mới.
              <span className="mt-1 block bg-[linear-gradient(95deg,#ff795f,#ffafd6)] bg-clip-text text-transparent">
                Cảm hứng mới.
              </span>
            </h3>
            <p className="mb-6 text-rf-body leading-relaxed text-[#d9d0f0]">
              PC, linh kiện và gaming gear hợp gu cho góc máy tiếp theo của bạn.
            </p>
            <Link
              href="/promotions"
              onClick={close}
              className="inline-flex min-h-12 items-center justify-between gap-4 rounded-xl bg-rf-ember px-5 py-3 text-rf-body font-bold text-rf-ink! transition-colors hover:bg-[#ff9b87] motion-reduce:transition-none"
            >
              Khám phá ưu đãi <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
            <Link
              href="/pc-builder"
              onClick={close}
              className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-rf-caption font-semibold text-white! transition-colors hover:bg-white/15 motion-reduce:transition-none"
            >
              <Layers3 size={18} className="text-rf-cyan" aria-hidden="true" />{" "}
              Tự xây cấu hình
            </Link>
            <button
              type="button"
              onClick={close}
              className="mt-3 min-h-11 self-center text-rf-caption text-[#d9d0f0] underline-offset-4 hover:text-white hover:underline"
            >
              Để sau, tiếp tục khám phá
            </button>
            <p className="mt-3 mb-0 border-t border-white/10 pt-3 text-xs leading-relaxed text-[#aaa0c5]">
              Bản trải nghiệm · Ảnh và dữ liệu minh họa · Chưa nhận đơn thật.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/** Không chèn quảng bá vào đăng nhập, giỏ, checkout hoặc lúc đang lắp cấu hình. */
export function WelcomePromotion() {
  const pathname = usePathname();
  const eligible =
    pathname === "/" ||
    pathname === "/promotions" ||
    ["/products", "/categories", "/brands"].some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
    );
  return eligible ? <WelcomeOffer key={pathname} /> : null;
}
