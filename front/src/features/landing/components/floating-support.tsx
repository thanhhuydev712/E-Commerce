"use client";
import Link from "next/link";
import { ArrowUp, Headphones } from "lucide-react";

export function FloatingSupport() {
  return (
    <div className="rf-floating-tools fixed right-3 bottom-20 z-35 flex flex-col gap-2 md:right-5 md:bottom-6">
      <Link
        href="/support"
        aria-label="Trung tâm hỗ trợ"
        className="grid size-11 place-items-center rounded-full border border-white/40 bg-rf-ink text-white shadow-lg transition-colors hover:bg-rf-green"
      >
        <Headphones size={20} />
      </Link>
      <button
        type="button"
        aria-label="Về đầu trang"
        className="grid size-11 place-items-center rounded-full border border-rf-border bg-white text-rf-text shadow-lg transition-colors hover:bg-[#e5e9e2]"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
          })
        }
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
