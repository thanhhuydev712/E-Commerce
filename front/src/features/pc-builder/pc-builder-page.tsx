"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Box,
  Check,
  ChevronRight,
  CircleAlert,
  Expand,
  Layers3,
  Plus,
  Power,
  RotateCcw,
  Save,
  ShoppingCart,
  Trash2,
  Undo2,
  Zap,
} from "lucide-react";
import {
  Build,
  checkBuild,
  estimateWatts,
  missingSlots,
  Slot,
  slots,
} from "@/src/features/pc-builder/lib/compatibility";
import { money } from "@/src/catalog/model";
import {
  Breadcrumb,
  CategoryIcon,
  Dialog,
  Empty,
  ProductArt,
  ProductImage,
} from "@/src/components/storefront";
import { useShop } from "@/src/providers/shop-provider";
import { PhotoAssembly } from "./components/photo-assembly";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  loader: [
    "rf-loader w-6 h-6 border-t-transparent border-r-[#6fa18c] border-b-[#6fa18c] border-l-[#6fa18c]",
    "animate-spin border-solid border-2 rounded-full",
  ].join(" "),
  empty: [
    "rf-empty flex items-center flex-col text-center bg-white bg-none px-6 py-17.5 border-[#d5e1db] border-dashed border",
    "rounded-[12px] [&>svg]:mb-5.5 [&>svg]:text-rf-green [&_h2]:mb-2.5 [&_h2]:text-[22px] [&_p]:text-rf-muted",
    "[&_p]:max-w-112.5 [&_p]:mb-6.25",
  ].join(" "),
  page_heading: [
    "rf-page-heading flex justify-between items-center mx-0 my-7.5 gap-5 [&_h1]:text-[32px] [&_h1]:tracking-[-1px]",
    "[&_h1]:leading-[1.2] [&_h1]:mt-2 [&_h1]:mb-2.5 [&_h1]:mx-0 [&_h1_small]:text-[20px] [&_h1_small]:text-rf-muted",
    "[&_p]:text-rf-muted [&_p]:text-rf-body [&_p]:mb-0 max-[768px]:flex-wrap max-[768px]:mx-0 max-[768px]:my-6",
    "max-[768px]:[&_h1]:text-[27px]",
  ].join(" "),
  btn_btn_outline: [
    "rf-btn rf-btn-outline inline-flex items-center justify-center min-h-11 bg-transparent bg-none text-rf-text",
    "text-rf-small font-bold leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-rf-border",
    "border-solid border rounded-[6px] gap-2.5 print:hidden hover:bg-[#edf4ef] hover:bg-none hover:border-[#9ccab5]",
  ].join(" "),
  build_cost_bar: [
    "rf-build-cost-bar flex items-center border-t border-t-rf-border border-r border-r-rf-border border-b",
    "border-b-rf-border border-l-5 border-l-rf-green bg-white bg-none mb-5 p-5.5 border-solid rounded-[15px] gap-3.5",
    "[&>div]:flex [&>div]:items-center [&>div]:flex-wrap [&>div]:mr-auto [&>div]:gap-5 [&_span]:text-rf-small [&_span]:text-rf-muted",
    "[&_strong]:text-[26px] [&_strong]:text-rf-sale max-[768px]:flex-wrap max-[768px]:p-3.75 max-[768px]:gap-2.5",
    "max-[768px]:[&>div]:w-full max-[768px]:[&_.rf-btn]:text-rf-control max-[768px]:[&_.rf-btn]:flex-1",
    "max-[768px]:[&_.rf-btn]:px-2.5",
  ].join(" "),
  btn: [
    "rf-btn inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-rf-small font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-transparent border-solid border",
    "rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
  builder_toolbar: [
    "rf-builder-toolbar flex justify-between items-center rounded-tl-[8px] rounded-tr-[8px] rounded-br-[0] rounded-bl-[0]",
    "bg-white bg-none text-rf-caption px-4.25 py-3.25 border-rf-border border-solid border [&>span]:flex",
    "[&>span]:items-center [&>span]:gap-2.25 [&>div]:flex [&>div]:items-center [&>div]:gap-2.25 [&_button]:flex",
    "[&_button]:items-center [&_button]:bg-transparent [&_button]:bg-none [&_button]:text-rf-caption [&_button]:px-2",
    "[&_button]:py-1.5 [&_button]:border-current [&_button]:border-none [&_button]:[border-width:0] [&_button]:gap-2.25",
    "max-[768px]:flex-wrap max-[768px]:gap-2.5 max-[768px]:[&>span]:hidden max-[768px]:[&>div]:flex-wrap",
    "max-[768px]:[&>div]:gap-0.75 max-[768px]:[&_button]:text-rf-caption print:hidden!",
  ].join(" "),
  builder_layout_builder_reference_layout: [
    "rf-builder-layout rf-builder-reference-layout grid grid-cols-[minmax(0,_1fr)_320px] [border-top-width:0]",
    "[border-top-style:none] border-t-current border-r [border-right-style:solid] border-r-rf-border border-b",
    "[border-bottom-style:solid] border-b-rf-border border-l [border-left-style:solid] border-l-rf-border rounded-tl-[0]",
    "rounded-tr-[0] rounded-br-[10px] rounded-bl-[10px] overflow-hidden max-[1200px]:grid-cols-[minmax(0,_1fr)]",
    "max-[768px]:flex max-[768px]:flex-col max-[768px]:grid-cols-[1fr] print:block",
    "[&_.rf-build-slot]:min-h-19 [&_.rf-build-slot]:px-5 [&_.rf-build-slot]:py-3.75 [&_.rf-slot-select]:grid",
    "[&_.rf-slot-select]:grid-cols-[minmax(90px,0.7fr)_minmax(0,1.5fr)_minmax(110px,1fr)] [&_.rf-slot-select]:items-center [&_.rf-slot-select]:gap-3.75",
    "[&_.rf-slot-select>small]:text-rf-small [&_.rf-slot-select>strong]:text-rf-body [&_.rf-slot-select>span]:text-right",
    "[&_.rf-studio]:self-start [&_.rf-build-summary]:self-start max-[768px]:[&_.rf-build-slot]:p-3",
    "max-[768px]:[&_.rf-slot-select]:flex max-[768px]:[&_.rf-slot-select]:flex-col",
    "max-[768px]:[&_.rf-slot-select]:items-start max-[768px]:[&_.rf-slot-select]:gap-1",
    "max-[768px]:[&_.rf-slot-select>small]:text-rf-caption max-[768px]:[&_.rf-slot-select>strong]:text-rf-body",
  ].join(" "),
  build_slots: [
    "rf-build-slots bg-white bg-none border-r [border-right-style:solid] border-r-rf-border px-3 py-4.5 [&_h2]:flex",
    "[&_h2]:justify-between [&_h2]:items-center [&_h2]:text-[18px] [&_h2]:pt-0 [&_h2]:pb-3.5 [&_h2]:border-b",
    "[&_h2]:[border-bottom-style:solid] [&_h2]:border-b-rf-border [&_h2]:px-1.5 [&_h2_span]:text-rf-caption",
    "[&_h2_span]:text-rf-green max-[768px]:[border-right-width:0] max-[768px]:[border-right-style:none]",
    "max-[768px]:border-r-current",
  ].join(" "),
  build_slot: [
    "flex items-center border-b [border-bottom-style:solid] border-b-[#edf0ed] px-1.25 py-3.5 gap-2",
    "[&>svg]:text-[#8ba293] [&>svg]:w-5.25 max-[768px]:py-3 print:[break-inside:avoid] [&>.rf-icon-btn]:min-w-6.25",
    "[&>.rf-icon-btn]:w-6.25 [&>.rf-icon-btn]:p-1",
  ].join(" "),
  slot_select: [
    "rf-slot-select bg-transparent bg-none text-left flex-1 min-w-0 p-0 border-current border-none [border-width:0]",
    "[&_small]:block [&_small]:text-rf-caption [&_small]:text-[#819086] [&_strong]:[display:-webkit-box]",
    "[&_strong]:[-webkit-line-clamp:3] [&_strong]:[-webkit-box-orient:vertical] [&_strong]:text-rf-body",
    "[&_strong]:leading-[1.5] [&_strong]:mt-0.5 [&_strong]:overflow-hidden [&_span]:block [&_span]:text-rf-caption",
    "[&_span]:text-rf-green [&_span]:mt-1 max-[768px]:[&_strong]:text-rf-body",
  ].join(" "),
  icon_btn: [
    "rf-icon-btn inline-flex items-center justify-center bg-transparent bg-none min-w-9 min-h-9 p-2 border-current",
    "border-none [border-width:medium] rounded-[6px] print:hidden! hover:bg-[#edf4f0] hover:bg-none",
  ].join(" "),
  build_summary: [
    "rf-build-summary bg-white bg-none border-l [border-left-style:solid] border-l-rf-border px-4.5 py-5.5",
    "[&_h2]:text-[18px] [&_h2]:mb-5.5 max-[1200px]:col-span-full max-[1200px]:[border-left-width:0]",
    "max-[1200px]:[border-left-style:none] max-[1200px]:border-l-current max-[1200px]:border-t",
    "max-[1200px]:[border-top-style:solid] max-[1200px]:border-t-rf-border [&_.rf-btn]:text-rf-control [&_.rf-btn]:mt-2.25",
    "[&_.rf-btn]:px-2.5 max-[1200px]:[&_.rf-btn]:w-auto max-[1200px]:[&_.rf-btn]:mr-2.5 max-[768px]:[&_.rf-btn]:w-full",
  ].join(" "),
  budget_label: [
    "rf-budget-label flex flex-wrap justify-between items-center text-rf-caption gap-2.5 [&_select]:text-rf-control [&_select]:p-1.25",
    "[&_select]:border-rf-border [&_select]:border-solid [&_select]:border [&_select]:rounded-[4px]",
  ].join(" "),
  budget_meter: [
    "rf-budget-meter h-1.25 bg-[#e6eee7] bg-none mt-3.5 mb-2 mx-0 rounded-[10px] overflow-hidden [&>span]:block",
    "[&>span]:h-full [&>span]:bg-rf-green [&>span]:bg-none [&>span]:[transition:width_0.3s]",
  ].join(" "),
  build_total: [
    "rf-build-total flex flex-col border-t [border-top-style:solid] border-t-rf-border border-b",
    "[border-bottom-style:solid] border-b-rf-border px-0 py-5.5 mx-0 my-4.5 [&>span]:text-rf-caption [&>span]:text-[#74857a]",
    "[&_strong]:text-rf-sale [&_strong]:text-[27px] [&_strong]:tracking-[-1px] [&_strong]:my-1 [&_small]:text-[#8b9b90]",
    "[&_small]:text-rf-caption",
  ].join(" "),
  check_check_label_check_ok_check_error_check_warning: [
    "flex items-start mb-2.5 text-rf-caption gap-1.75 [&.rf-check-label]:font-normal [&.rf-check-ok]:text-[#548365]",
    "[&.rf-check-error]:text-[#ad4244] [&.rf-check-warning]:text-[#9b8349]",
  ].join(" "),
  btn_full: [
    "rf-btn rf-full inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-rf-small font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] w-full px-5.25 py-2.75 border-transparent border-solid",
    "border rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
  btn_btn_outline_full: [
    "rf-btn rf-btn-outline rf-full inline-flex items-center justify-center min-h-11 bg-transparent bg-none text-rf-text",
    "text-rf-small font-bold leading-[1.5] [transition:background_0.2s,_transform_0.2s] w-full px-5.25 py-2.75",
    "border-rf-border border-solid border rounded-[6px] gap-2.5 print:hidden hover:bg-[#edf4ef] hover:bg-none",
    "hover:border-[#9ccab5]",
  ].join(" "),
  text_link_print_build: [
    "rf-text-link rf-print-build flex items-center bg-transparent bg-none text-rf-green text-rf-caption font-semibold mt-4",
    "mb-0 p-0 mx-auto border-current border-none [border-width:0] gap-1.75 print:hidden hover:underline",
    "hover:[text-underline-offset:4px]",
  ].join(" "),
  picker_list:
    "rf-picker-list grid gap-3 [&>div]:grid [&>div]:grid-cols-[80px_minmax(0,1fr)_auto] [&>div]:items-center [&>div]:gap-4 [&>div]:rounded-xl [&>div]:border [&>div]:border-rf-border [&>div]:p-4 [&>div]:transition-colors [&>div:hover]:border-rf-green/30 [&>div>div]:min-w-0 [&_strong]:block [&_strong]:text-rf-small [&_strong]:leading-relaxed [&_small]:mt-1 [&_small]:block [&_small]:text-rf-caption [&_small]:leading-relaxed [&_small]:text-rf-muted [&_b]:mt-2 [&_b]:block [&_b]:text-rf-small [&_b]:text-rf-sale [&_.rf-btn]:min-h-11 [&_.rf-btn]:px-4 max-[640px]:[&>div]:grid-cols-[64px_minmax(0,1fr)] max-[640px]:[&>div]:gap-3 max-[640px]:[&>div]:p-3 max-[640px]:[&>div>div:first-child]:size-16 max-[640px]:[&_.rf-btn]:col-start-2 max-[640px]:[&_.rf-btn]:justify-self-start",
  form: [
    "rf-form grid gap-4.5 [&>label]:grid [&>label]:text-rf-small [&>label]:font-semibold [&>label]:gap-1.75",
    "[&_select]:w-full [&_select]:bg-white [&_select]:bg-none [&_select]:min-h-10.75 [&_select]:text-rf-control",
    "[&_select]:px-3 [&_select]:py-2.75 [&_select]:border-[#dce4dd] [&_select]:border-solid [&_select]:border",
    "[&_select]:rounded-[5px] [&_textarea]:w-full [&_textarea]:bg-white [&_textarea]:bg-none [&_textarea]:min-h-27.5",
    "[&_textarea]:text-rf-control [&_textarea]:resize-y [&_textarea]:px-3 [&_textarea]:py-2.75 [&_textarea]:border-[#dce4dd]",
    "[&_textarea]:border-solid [&_textarea]:border [&_textarea]:rounded-[5px] [&_p]:text-rf-body [&_p]:text-rf-muted",
    "[&_.rf-btn]:justify-self-start [&_.rf-full]:justify-self-stretch [&_.rf-check-label]:flex",
    "[&_.rf-check-label]:items-center [&_.rf-check-label]:text-rf-small [&_.rf-check-label]:font-normal",
    '[&_.rf-check-label]:gap-2.25 [&_input:not([type="radio"]):not([type="checkbox"])]:w-full',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:bg-white',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:bg-none',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:min-h-10.75',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:text-rf-control',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:px-3',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:py-2.75',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:border-[#dce4dd]',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:border-solid',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:border',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:rounded-[5px]',
  ].join(" "),
  saved_grid: [
    "rf-saved-grid grid grid-cols-[repeat(3,_1fr)] gap-5 [&_h2]:text-[20px] [&_p]:text-rf-body [&_p]:text-rf-muted",
    "max-[768px]:grid-cols-[1fr] [&_.rf-product-art]:max-h-50 [&_.rf-product-photo]:h-36.25",
  ].join(" "),
  panel: [
    "rf-panel bg-rf-surface bg-none mb-5 p-6.5 border-rf-border border-solid border rounded-[var(--rf-radius)]",
    "[&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-rf-small font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
};

export default function BuilderPage({ savedId }: { savedId?: string }) {
  const shop = useShop();
  // Chờ khôi phục phiên và cấu hình đã lưu trước khi khởi tạo editor.
  if (!shop.ready)
    return (
      <div className={tw.empty} role="status">
        Đang mở cấu hình…
      </div>
    );
  return <BuilderEditor key={savedId ?? "new"} savedId={savedId} />;
}

function BuilderEditor({ savedId }: { savedId?: string }) {
  const { starterBuild } = useCatalog().presentation;
  const { productById, categories, products } = useCatalog();

  const shop = useShop();
  const saved = shop.builds.find((b) => b.id === savedId);
  const [build, setBuild] = useState<Build>(saved?.build ?? {});
  const [history, setHistory] = useState<Build[]>([]);
  const [picker, setPicker] = useState<Slot | null>(null);
  const [exploded, setExploded] = useState(false);
  const [powered, setPowered] = useState(false);
  const [open, setOpen] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [budget, setBudget] = useState("25000000");
  const [save, setSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [name, setName] = useState("Cấu hình của tôi");
  const [search, setSearch] = useState("");
  const [reset, setReset] = useState(false);
  const [camera, setCamera] = useState(0);
  const [cameraView, setCameraView] = useState<
    "perspective" | "front" | "side"
  >("perspective");
  const [accent, setAccent] = useState("#6ee7b7");
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduce(media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  // Mỗi thao tác chụp state cũ trước khi đổi, dùng cho undo; scene chỉ đọc state cuối.
  const change = (next: Build) => {
    setHistory((h) => [...h, build].slice(-20));
    setBuild(next);
    setPowered(false);
  };
  const checks = checkBuild(build, productById);
  const errors = checks.filter((c) => c.level === "error");
  const missing = missingSlots(build, productById);
  const total = Object.values(build).reduce(
    (s, id) => s + BigInt(productById(id)?.price ?? "0"),
    BigInt(0),
  );
  const selectedSlots = slots.filter((slot) => {
    const product = productById(build[slot] ?? "");
    return product?.builderEligible && product.category === slot;
  });
  const selected = selectedSlots.length;
  const sceneBuild: Build = Object.fromEntries(
    selectedSlots.map((slot) => [slot, build[slot]]),
  );
  if (savedId && shop.ready && !saved)
    return (
      <Empty
        title="Không tìm thấy cấu hình đã lưu"
        href="/pc-builder/saved"
        label="Xem cấu hình đã lưu"
      />
    );
  return (
    <>
      <Breadcrumb current="PC Studio" />
      <div className={tw.page_heading}>
        <div>
          <span className="rf-eyebrow inline-flex items-center text-rf-caption font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-rf-caption max-[768px]:tracking-[1px]">
            RIGFORGE PC STUDIO
          </span>
          <h1>Xây dựng cấu hình</h1>
          <p>
            Tự chọn linh kiện, đối chiếu thông số và theo dõi chi phí cấu hình.
          </p>
        </div>
        <Link className={tw.btn_btn_outline} href="/pc-builder/saved">
          <Save size={16} />
          Cấu hình đã lưu ({shop.builds.length})
        </Link>
      </div>
      <div
        className="mb-6 grid gap-3 sm:grid-cols-3"
        aria-label="Cách xây dựng cấu hình"
      >
        {[
          [
            "01",
            "Chọn linh kiện",
            "Tự chọn hoặc bắt đầu với cấu hình đề xuất.",
          ],
          [
            "02",
            "Khám phá bộ máy",
            "Xem ảnh minh họa và đối chiếu linh kiện đã chọn.",
          ],
          [
            "03",
            "Lưu cấu hình",
            "Lưu vào tài khoản hoặc thêm linh kiện vào giỏ.",
          ],
        ].map(([index, title, description]) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-xl border border-rf-border bg-white px-4 py-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-rf-green/8 text-rf-caption font-semibold text-rf-green">
              {index}
            </span>
            <div>
              <strong className="text-rf-small font-semibold">{title}</strong>
              <p className="mb-0 mt-1 text-rf-body leading-relaxed text-rf-muted">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className={tw.build_cost_bar}>
        <div>
          <span>CHI PHÍ DỰ TÍNH</span>
          <strong>{money(total)}</strong>
        </div>
        <button
          className={tw.btn}
          disabled={!!missing.length || !!errors.length}
          onClick={() => shop.addBuild(build)}
        >
          <ShoppingCart size={16} />
          Thêm giỏ hàng
        </button>
        <button className={tw.btn_btn_outline} onClick={() => setReset(true)}>
          <RotateCcw size={16} />
          Xây dựng lại
        </button>
      </div>
      <div className={tw.builder_toolbar}>
        <span>
          <span className="rf-dot w-1.5 h-1.5 bg-[#80edbd] bg-none inline-block shadow-[0_0_0_4px_#80edbd15] rounded-full" />
          Không gian của bạn
        </span>
        <div>
          <button onClick={() => change(starterBuild)}>
            <Zap size={15} />
            Dùng cấu hình đề xuất
          </button>
          <button
            disabled={!history.length}
            onClick={() => {
              setBuild(history[history.length - 1]);
              setHistory((h) => h.slice(0, -1));
              setPowered(false);
            }}
          >
            <Undo2 size={15} />
            Hoàn tác
          </button>
          <button onClick={() => setReset(true)}>
            <RotateCcw size={15} />
            Làm mới
          </button>
        </div>
      </div>
      <div className={tw.builder_layout_builder_reference_layout}>
        <section className={tw.build_slots}>
          <h2>
            Linh kiện của bạn <span>{selected}/8</span>
          </h2>
          {slots.map((slot, i) => {
            const p = productById(build[slot] ?? "");
            return (
              <div
                className={
                  `rf-build-slot ${p ? "selected" : ""}` + " " + tw.build_slot
                }
                key={slot}
              >
                <span className="rf-slot-index text-rf-caption text-[#a4b2a8]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <CategoryIcon id={slot} size={24} />
                <button
                  className={tw.slot_select}
                  onClick={() => {
                    setPicker(slot);
                    setSearch("");
                  }}
                >
                  <small>{categories.find((c) => c.id === slot)?.short}</small>
                  <strong>
                    {p
                      ? p.name.replace(
                          /^(CPU|Mainboard|VGA|RAM|SSD|Nguồn|Case|Tản nhiệt) /,
                          "",
                        )
                      : "Chọn linh kiện"}
                  </strong>
                  {p && <span>{money(p.price)}</span>}
                </button>
                {p ? (
                  <button
                    className={tw.icon_btn}
                    onClick={() => {
                      const next = { ...build };
                      delete next[slot];
                      change(next);
                    }}
                    aria-label={`Bỏ ${slot}`}
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <button
                    className={tw.icon_btn}
                    aria-label={`Chọn ${slot}`}
                    onClick={() => setPicker(slot)}
                  >
                    <Plus size={17} />
                  </button>
                )}
              </div>
            );
          })}
        </section>
        <section
          className="rf-studio col-span-full row-start-1 w-full min-w-0 overflow-hidden bg-[#0c151b] text-slate-300 max-[768px]:-order-1 print:hidden"
          aria-label="Không gian lắp ráp PC"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
            <span className="inline-flex items-center gap-2 text-rf-caption font-semibold tracking-widest text-white">
              <Box size={17} className="text-emerald-300" /> PC STUDIO
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-rf-caption text-slate-200">
              Ảnh ghép sản phẩm
            </span>
          </div>
          <p
            id="pc-studio-photo-status"
            className="m-0 border-b border-white/8 bg-[#101c24] px-5 py-3 text-rf-caption leading-relaxed text-slate-300"
          >
            Ảnh ghép lấy từ từng sản phẩm đang chọn trong catalog, chưa phải ảnh
            bộ máy đã lắp. Một số ảnh dữ liệu mẫu cần được xác minh đúng SKU.
          </p>
          <div className="rf-studio-appearance flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-[#101c24] px-4 py-3">
            <div
              className="flex flex-wrap gap-1"
              role="group"
              aria-label="Góc xem bộ máy"
            >
              {(
                [
                  ["perspective", "Góc 3/4"],
                  ["front", "Trực diện"],
                  ["side", "Góc bên"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={cameraView === value}
                  onClick={() => {
                    setCameraView(value);
                    setCamera((version) => version + 1);
                  }}
                  className={`min-h-10 rounded-lg px-3 text-rf-caption transition-colors motion-reduce:transition-none ${cameraView === value ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              className="flex items-center gap-2"
              role="group"
              aria-label="Màu ánh sáng"
            >
              <span className="mr-1 text-rf-caption text-slate-400">
                Ánh sáng
              </span>
              {(
                [
                  ["#6ee7b7", "Ngọc lục bảo"],
                  ["#c4b5fd", "Tím"],
                  ["#67e8f9", "Xanh băng"],
                ] as const
              ).map(([color, label]) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Ánh sáng ${label}`}
                  aria-pressed={accent === color}
                  onClick={() => setAccent(color)}
                  className={`grid size-10 place-items-center rounded-full border transition-colors motion-reduce:transition-none ${accent === color ? "border-white/60 bg-white/10" : "border-transparent hover:bg-white/5"}`}
                >
                  <span
                    className="grid size-5 place-items-center rounded-full text-[#10202a]"
                    style={{ backgroundColor: color }}
                  >
                    {accent === color && <Check size={13} />}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className={`rf-viewport relative ${powered ? "powered" : ""}`}>
            <PhotoAssembly
              cameraReset={camera}
              cameraView={cameraView}
              onFrontView={() => {
                setCameraView("front");
                setCamera((version) => version + 1);
              }}
              accent={accent}
              build={sceneBuild}
              exploded={exploded}
              powered={powered}
              panelOpen={open}
              reduceMotion={reduce}
              onChoose={(slot) => {
                setPicker(slot);
                setSearch("");
              }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/8 bg-[#0e1b22] p-4 [&>button]:inline-flex [&>button]:min-h-11 [&>button]:items-center [&>button]:gap-2 [&>button]:rounded-lg [&>button]:border [&>button]:border-white/10 [&>button]:bg-white/4 [&>button]:px-3 [&>button]:text-rf-caption [&>button]:transition-colors [&>button:hover]:bg-white/10 [&>button[aria-pressed=true]]:bg-emerald-300/20 [&>button[aria-pressed=true]:hover]:bg-emerald-300/25 [&>button[aria-pressed=true]]:border-emerald-300/30 [&>button[aria-pressed=true]]:text-emerald-200">
            <button
              aria-pressed={exploded}
              onClick={() => setExploded(!exploded)}
            >
              <Layers3 size={16} />
              {exploded ? "Thu gọn" : "Tách linh kiện"}
            </button>
            <button aria-pressed={open} onClick={() => setOpen(!open)}>
              <Expand size={16} />
              {open ? "Hiện rõ case" : "Làm mờ case"}
            </button>
            <button onClick={() => setCamera((c) => c + 1)}>
              <RotateCcw size={16} />
              Góc nhìn
            </button>
            <button
              className={powered ? "on" : ""}
              disabled={!selected}
              aria-pressed={powered}
              onClick={() => setPowered(!powered)}
            >
              <Power size={17} />
              {powered ? "Tắt nền sáng" : "Bật nền sáng"}
            </button>
          </div>
          <label className="rf-motion-toggle flex items-center justify-center gap-2 bg-[#0e1b22] px-4 pb-4 text-rf-caption text-slate-400">
            <input
              type="checkbox"
              checked={reduce}
              onChange={(e) => setReduce(e.target.checked)}
            />
            Giảm chuyển động
          </label>
        </section>
        <aside className={tw.build_summary}>
          <h2>Cấu hình của bạn</h2>
          <label className={tw.budget_label}>
            Ngân sách dự kiến
            <select value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option value="15000000">15 triệu</option>
              <option value="25000000">25 triệu</option>
              <option value="40000000">40 triệu</option>
              <option value="60000000">60 triệu</option>
            </select>
          </label>
          <div className={tw.budget_meter}>
            <span
              className={total > BigInt(budget) ? "bg-[#d97706]!" : ""}
              style={{
                width: `${Math.min(100, (Number(total) * 100) / Number(budget))}%`,
              }}
            />
          </div>
          <div className="rf-budget-text flex justify-between text-rf-caption text-[#819086]">
            <span>
              {total > BigInt(budget)
                ? "Vượt ngân sách"
                : "Còn trong ngân sách"}
            </span>
            <strong>{money(budget)}</strong>
          </div>
          <div className={tw.build_total}>
            <span>Tổng linh kiện</span>
            <strong>{money(total)}</strong>
            <small>Ước tính điện: ~{estimateWatts(build, productById)}W</small>
          </div>
          <div className="rf-compatibility [&_h3]:flex [&_h3]:items-center [&_h3]:text-rf-body [&_h3]:gap-1.5">
            <h3>
              <ShieldIcon />
              Kiểm tra tương thích
            </h3>
            {checks.map((c, i) => (
              <div
                key={i}
                className={
                  `rf-check rf-check-${c.level}` +
                  " " +
                  tw.check_check_label_check_ok_check_error_check_warning
                }
              >
                {c.level === "ok" ? (
                  <Check size={15} />
                ) : (
                  <CircleAlert size={15} />
                )}
                <span>{c.message}</span>
              </div>
            ))}
            {missing.length > 0 && (
              <p className="rf-missing text-rf-caption text-[#88978c]">
                Cần chọn thêm {missing.length} nhóm linh kiện để hoàn thiện.
              </p>
            )}
          </div>
          <button
            className={tw.btn_full}
            disabled={!!missing.length || !!errors.length}
            onClick={() => shop.addBuild(build)}
          >
            <ShoppingCart size={16} />
            Thêm cấu hình vào giỏ
          </button>
          <button
            className={tw.btn_btn_outline_full}
            disabled={!selected}
            onClick={() => {
              setSaveError("");
              setSave(true);
            }}
          >
            <Save size={16} />
            Lưu cấu hình
          </button>
          <button
            className={tw.text_link_print_build}
            disabled={!selected}
            onClick={() => window.print()}
          >
            In bảng kê cấu hình <ArrowRight size={14} />
          </button>
        </aside>
      </div>
      {picker && (
        <Dialog
          title={`Chọn ${categories.find((c) => c.id === picker)?.name}`}
          onClose={() => setPicker(null)}
          toolbar={
            <input
              className="rf-picker-search min-h-12 w-full rounded-xl border border-rf-border bg-white px-4 py-3 text-rf-control outline-none transition-shadow focus:border-rf-green focus:ring-3 focus:ring-rf-green/10"
              autoFocus
              aria-label="Tìm linh kiện"
              placeholder="Tìm theo tên linh kiện…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          }
        >
          <div className={tw.picker_list}>
            {!products.some(
              (p) =>
                p.builderEligible &&
                p.category === picker &&
                p.name.toLowerCase().includes(search.toLowerCase()),
            ) && (
              <p role="status">
                Không tìm thấy linh kiện phù hợp. Thử từ khóa khác.
              </p>
            )}
            {products
              .filter(
                (p) =>
                  // Chỉ đưa sản phẩm có dữ liệu tương thích vào picker; ảnh catalogue không đủ để kiểm ráp PC.
                  p.builderEligible &&
                  p.category === picker &&
                  p.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((p) => {
                const candidate = checkBuild(
                  {
                    ...build,
                    [picker]: p.id,
                  },
                  productById,
                ).filter((c) => c.level === "error");
                return (
                  <div key={p.id}>
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg [&_.rf-product-photo]:h-full [&_.rf-product-photo]:min-h-0 [&_.rf-product-photo]:w-full">
                      <ProductImage product={p} />
                    </div>
                    <div>
                      <strong>{p.name}</strong>
                      <small>{p.specs.join(" · ")}</small>
                      <b>{money(p.price)}</b>
                      {candidate.length > 0 && (
                        <span className="rf-picker-warning block text-[#ab6b39] text-rf-caption mt-1.5">
                          {candidate.map((c) => c.message).join(" ")}
                        </span>
                      )}
                    </div>
                    <button
                      className={tw.btn}
                      disabled={
                        !p.variants.some((variant) => variant.stock > 0)
                      }
                      onClick={() => {
                        change({ ...build, [picker]: p.id });
                        setPicker(null);
                      }}
                    >
                      Chọn
                      <Plus size={15} />
                    </button>
                  </div>
                );
              })}
          </div>
        </Dialog>
      )}
      {save && (
        <Dialog title="Lưu cấu hình của bạn" onClose={() => setSave(false)}>
          <form
            aria-busy={saving}
            onSubmit={async (e) => {
              e.preventDefault();
              if (saving) return;
              setSaving(true);
              setSaveError("");
              try {
                if (
                  await shop.saveBuild(name.trim() || "Cấu hình của tôi", build)
                )
                  setSave(false);
                else
                  setSaveError(
                    "Chưa lưu được cấu hình. Kiểm tra kết nối và thử lại; các linh kiện vẫn được giữ.",
                  );
              } finally {
                setSaving(false);
              }
            }}
            className={tw.form}
          >
            <label>
              Tên cấu hình
              <input
                autoFocus
                value={name}
                maxLength={80}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <p>Cấu hình được lưu vào tài khoản của bạn.</p>
            {saveError && <p role="alert">{saveError}</p>}
            <button className={tw.btn} disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu cấu hình"} <Save size={16} />
            </button>
          </form>
        </Dialog>
      )}
      {reset && (
        <Dialog title="Bắt đầu cấu hình mới?" onClose={() => setReset(false)}>
          <p>Các linh kiện đang chọn sẽ được bỏ. Bạn có thể hoàn tác sau đó.</p>
          <div className="rf-dialog-actions flex items-center flex-wrap mt-5.5 gap-3">
            <button
              className={tw.btn_btn_outline}
              onClick={() => setReset(false)}
            >
              Giữ cấu hình
            </button>
            <button
              className={tw.btn}
              onClick={() => {
                change({});
                setReset(false);
              }}
            >
              Làm mới
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
function ShieldIcon() {
  return <Check size={15} />;
}
export function SavedBuilds() {
  const { productById } = useCatalog();

  const shop = useShop();
  return (
    <>
      <Breadcrumb current="Cấu hình đã lưu" />
      <div className={tw.page_heading}>
        <div>
          <span className="rf-eyebrow inline-flex items-center text-rf-caption font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-rf-caption max-[768px]:tracking-[1px]">
            BỘ SƯU TẬP CỦA BẠN
          </span>
          <h1>Những ý tưởng đã thành hình.</h1>
          <p>Cấu hình đã lưu trong tài khoản</p>
        </div>
        <Link href="/pc-builder" className={tw.btn}>
          <Plus size={16} />
          Tạo cấu hình
        </Link>
      </div>
      {!shop.builds.length ? (
        <Empty
          title="Chưa có cấu hình đã lưu"
          href="/pc-builder"
          label="Bước vào PC Studio"
        />
      ) : (
        <div className={tw.saved_grid}>
          {shop.builds.map((b) => (
            <article className={tw.panel} key={b.id}>
              <ProductArt category="pc" />
              <h2>{b.name}</h2>
              <p>
                {Object.keys(b.build).length} linh kiện ·{" "}
                {money(
                  Object.values(b.build).reduce(
                    (s, id) => s + BigInt(productById(id)?.price ?? "0"),
                    BigInt(0),
                  ),
                )}
              </p>
              <Link href={`/pc-builder/saved/${b.id}`} className={tw.text_link}>
                Mở trong Studio <ChevronRight size={16} />
              </Link>
              <button
                className={tw.icon_btn}
                aria-label={`Xóa ${b.name}`}
                onClick={() => shop.deleteBuild(b.id)}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
