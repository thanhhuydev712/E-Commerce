"use client";

import { useRef, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  Check,
  Focus,
  Minus,
  MousePointer2,
  Plus,
  ScanLine,
  Eye,
} from "lucide-react";
import { useCatalog } from "@/src/catalog/catalog-provider";
import { money } from "@/src/catalog/model";
import { CategoryIcon, ProductImage } from "@/src/components/storefront";
import { slots, type Build, type Slot } from "../lib/compatibility";
import { AssembledLayers } from "./assembled-layers";

// Nhãn điều khiển; ảnh lắp theo SKU và case nằm trong AssembledLayers.
const names: Record<Slot, string> = {
  case: "Vỏ case",
  mainboard: "Mainboard",
  cpu: "CPU",
  ram: "RAM",
  ssd: "SSD",
  gpu: "Card đồ họa",
  psu: "Nguồn",
  cooler: "Tản nhiệt",
};
const order: Slot[] = [
  "case",
  "mainboard",
  "cpu",
  "ram",
  "ssd",
  "psu",
  "gpu",
  "cooler",
];
const control =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 motion-reduce:transition-none";

export function PhotoAssembly({
  build,
  exploded,
  powered,
  panelOpen,
  reduceMotion,
  onChoose,
  accent = "#6ee7b7",
  cameraView = "perspective",
  onFrontView,
  cameraReset = 0,
}: {
  build: Build;
  exploded: boolean;
  powered: boolean;
  panelOpen: boolean;
  reduceMotion: boolean;
  onChoose: (slot: Slot) => void;
  accent?: string;
  cameraView?: "perspective" | "front" | "side";
  onFrontView?: () => void;
  cameraReset?: number;
}) {
  const { productById } = useCatalog();
  const [focus, setFocus] = useState<Slot>("case");
  const poseKey = `${cameraView}-${cameraReset}`;
  const [pose, setPose] = useState({ key: poseKey, x: 0, y: 0, zoom: 1 });
  const [isolate, setIsolate] = useState(false);
  const angle = pose.key === poseKey ? pose : { x: 0, y: 0, zoom: 1 };
  const zoom = angle.zoom;
  const setAngle = (value: { x: number; y: number }) =>
    setPose((previous) => ({
      key: poseKey,
      zoom: previous.key === poseKey ? previous.zoom : 1,
      ...value,
    }));
  const setZoom = (update: (value: number) => number) =>
    setPose((previous) => {
      const current =
        previous.key === poseKey
          ? previous
          : { key: poseKey, x: 0, y: 0, zoom: 1 };
      return { ...current, zoom: update(current.zoom) };
    });
  const baseline =
    cameraView === "front"
      ? { x: 0, y: 0 }
      : cameraView === "side"
        ? { x: 2, y: 24 }
        : { x: 3, y: -12 };
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(
    null,
  );
  const selected = slots.filter((slot) => productById(build[slot] ?? ""));
  const product = productById(build[focus] ?? "");
  const finished = selected.length === slots.length;
  return (
    <div
      className="rf-photo-assembly grid min-w-0 bg-[#0c151b] text-slate-200 min-[1100px]:grid-cols-[minmax(0,1fr)_240px]"
      data-exploded={exploded}
      data-powered={powered}
      data-camera-view={cameraView}
      style={{ "--studio-accent": accent } as CSSProperties}
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <div>
            <p className="mb-1 text-rf-caption font-semibold tracking-[0.22em] text-emerald-300">
              ASSEMBLY STUDIO / 01
            </p>
            <h3 className="m-0 text-lg font-medium tracking-tight text-white">
              Bộ máy của bạn.
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/5 px-3 py-1.5 text-rf-caption tabular-nums text-emerald-200">
            {selected.length} / 8
          </span>
        </div>
        <div
          className={`rf-photo-stage relative isolate flex h-[520px] min-w-0 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,#23443f55,transparent_65%)] pt-3 pb-14 max-[480px]:h-[370px] rf-photo-stage-projection`}
          data-dragging={dragging}
          data-reduced-motion={reduceMotion}
          style={{
            backgroundImage: `radial-gradient(ellipse at 50% 45%,${accent}${powered ? "40" : "20"},transparent 65%)`,
          }}
          onPointerDown={(event) => {
            if (
              event.button !== 0 ||
              (event.target as HTMLElement).closest("button, dialog")
            )
              return;
            drag.current = {
              x: event.clientX,
              y: event.clientY,
              rx: angle.x,
              ry: angle.y,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            setAngle({
              x: Math.max(
                -12,
                Math.min(
                  12,
                  drag.current.rx - (event.clientY - drag.current.y) / 12,
                ),
              ),
              y: Math.max(
                -28,
                Math.min(
                  28,
                  drag.current.ry + (event.clientX - drag.current.x) / 7,
                ),
              ),
            });
          }}
          onPointerUp={(event) => {
            drag.current = null;
            setDragging(false);
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
          }}
          onLostPointerCapture={() => {
            drag.current = null;
            setDragging(false);
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(#ffffff04_1px,transparent_1px),linear-gradient(90deg,#ffffff04_1px,transparent_1px)] bg-size-[32px_32px] [mask-image:radial-gradient(ellipse,black,transparent_75%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-6 left-1/2 h-9 w-3/5 -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl"
          />
          <AssembledLayers
            poseStyle={
              {
                "--rx": `${Math.max(-16, Math.min(16, baseline.x + angle.x))}deg`,
                "--ry": `${Math.max(-32, Math.min(32, baseline.y + angle.y))}deg`,
                "--zoom": zoom * (exploded ? 0.92 : 1),
              } as CSSProperties
            }
            build={build}
            focus={focus}
            isolate={isolate}
            exploded={exploded}
            panelOpen={panelOpen}
            onFocus={setFocus}
            onChoose={onChoose}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-xl border border-white/10 bg-[#0b161ee6] p-1">
            <button
              type="button"
              className={control}
              aria-label="Thu nhỏ bản ghép"
              disabled={zoom <= 0.8}
              onClick={() =>
                setZoom((value) => Math.max(0.8, +(value - 0.1).toFixed(1)))
              }
            >
              <Minus size={15} />
            </button>
            <span className="w-12 text-center text-rf-caption tabular-nums text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className={control}
              aria-label="Phóng to bản ghép"
              disabled={zoom >= 1.3}
              onClick={() =>
                setZoom((value) => Math.min(1.3, +(value + 0.1).toFixed(1)))
              }
            >
              <Plus size={15} />
            </button>
            <button
              type="button"
              className={control}
              aria-label="Xem chính diện"
              onClick={() => {
                setAngle({ x: 0, y: 0 });
                onFrontView?.();
                setZoom(() => 1);
              }}
            >
              <Focus size={16} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-y border-white/7 px-5 py-3 text-rf-caption text-slate-400">
          <span className="inline-flex items-center gap-2">
            <MousePointer2 size={13} />
            Kéo vùng trống để đổi góc nghiêng
          </span>
          <span className="hidden items-center gap-1.5 text-emerald-200/70 min-[640px]:inline-flex">
            <ScanLine size={13} />
            Nghiêng ảnh 2D · Không xoay 360°
          </span>
        </div>
        <div
          className="grid grid-cols-4 gap-1 p-3 sm:grid-cols-8"
          aria-label="Các lớp linh kiện"
        >
          {order.map((slot) => (
            <button
              key={slot}
              type="button"
              aria-label={`Chi tiết ${names[slot]}`}
              aria-pressed={focus === slot}
              onClick={() => setFocus(slot)}
              className={`relative flex min-w-0 flex-col items-center gap-2 rounded-lg border px-1 py-3 text-rf-caption transition-colors motion-reduce:transition-none ${focus === slot ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200" : "border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-200"}`}
            >
              <CategoryIcon id={slot} size={19} />
              <span className="max-w-full truncate">
                {slot === "mainboard"
                  ? "Main"
                  : slot === "cooler"
                    ? "Tản"
                    : slot === "gpu"
                      ? "VGA"
                      : slot === "case"
                        ? "Case"
                        : slot === "psu"
                          ? "Nguồn"
                          : slot.toUpperCase()}
              </span>
              {build[slot] && (
                <Check
                  className="absolute top-1 right-1 text-emerald-300"
                  size={9}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <aside className="rf-photo-inspector grid min-w-0 grid-cols-[96px_minmax(0,1fr)] content-start gap-x-4 border-t border-white/8 bg-[#111e26] p-5 min-[1100px]:flex min-[1100px]:flex-col min-[1100px]:border-t-0 min-[1100px]:border-l">
        <div className="col-span-full mb-4 flex flex-wrap items-center justify-between gap-2 text-rf-caption font-medium tracking-wider text-slate-500">
          <span>ĐANG KHÁM PHÁ</span>
          <span>{String(order.indexOf(focus) + 1).padStart(2, "0")} / 08</span>
        </div>
        <h4 className="col-span-full mb-3 text-xl font-medium text-white">
          {names[focus]}
        </h4>
        {product ? (
          <>
            <div className="col-start-1 row-span-3 mb-4 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-white p-2 min-[1100px]:h-36 min-[1100px]:p-3 [&_.rf-product-photo]:h-full [&_.rf-product-photo]:min-h-0 [&_.rf-product-photo]:w-full">
              <ProductImage product={product} />
            </div>
            <span className="col-start-2 mb-2 text-rf-caption font-semibold uppercase tracking-widest text-emerald-300">
              Sản phẩm đã chọn
            </span>
            <p className="col-start-2 mb-2 text-rf-body font-medium leading-relaxed text-slate-100">
              {product.name}
            </p>
            <strong className="col-start-2 mb-4 block text-lg font-semibold tabular-nums text-emerald-200">
              {money(product.price)}
            </strong>
          </>
        ) : (
          <div className="col-span-full mb-4 grid min-h-32 place-content-center justify-items-center gap-3 rounded-xl border border-dashed border-white/10 text-slate-500">
            <CategoryIcon id={focus} size={42} />
            <p className="m-0 text-rf-body">Chưa chọn linh kiện</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => onChoose(focus)}
          className="col-span-full mb-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/8 px-3 text-rf-small font-semibold text-emerald-200 transition-colors hover:bg-emerald-300/15 motion-reduce:transition-none"
        >
          {product ? "Đổi linh kiện" : "Chọn linh kiện"}
          <ArrowUpRight size={15} />
        </button>
        <button
          type="button"
          aria-pressed={isolate && !!product}
          disabled={!product}
          onClick={() => setIsolate((value) => !value)}
          className="col-span-full mb-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-rf-caption text-slate-300 transition-colors hover:bg-white/5 aria-pressed:bg-emerald-300/20 aria-pressed:text-emerald-200 aria-pressed:hover:bg-emerald-300/25 motion-reduce:transition-none"
        >
          <Eye size={15} />
          Tập trung linh kiện
        </button>
        <div className="col-span-full mt-auto rounded-xl border border-white/7 bg-white/3 p-3">
          <p className="mb-2 flex items-center gap-2 text-rf-caption font-medium text-slate-200">
            <span
              className={`size-1.5 rounded-full ${finished ? "bg-emerald-300" : "bg-amber-300"}`}
            />
            {finished ? "Đã chọn đủ 8 nhóm" : "Bộ máy đang thành hình"}
          </p>
          <p className="m-0 text-rf-caption leading-relaxed text-slate-400">
            Bộ ảnh dựng đi theo sản phẩm đang chọn; hình học và tỷ lệ lắp thực
            tế cần đối chiếu.
          </p>
        </div>
      </aside>
    </div>
  );
}
