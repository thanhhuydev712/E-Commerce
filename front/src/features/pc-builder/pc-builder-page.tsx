"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
} from "@/src/components/storefront";
import { useShop } from "@/src/providers/shop-provider";

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
    "[&_p]:text-rf-muted [&_p]:text-[13px] [&_p]:mb-0 max-[768px]:flex-wrap max-[768px]:mx-0 max-[768px]:my-6",
    "max-[768px]:[&_h1]:text-[27px]",
  ].join(" "),
  btn_btn_outline: [
    "rf-btn rf-btn-outline inline-flex items-center justify-center min-h-11 bg-transparent bg-none text-rf-text",
    "text-[12px] font-bold leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-rf-border",
    "border-solid border rounded-[6px] gap-2.5 print:hidden hover:bg-[#edf4ef] hover:bg-none hover:border-[#9ccab5]",
  ].join(" "),
  builder_reference_hero: [
    "rf-builder-reference-hero grid grid-cols-[2.3fr_1fr] mb-6.25 gap-3.75 [&>a]:relative [&>a]:min-h-57.5",
    "[&>a]:rounded-[8px] [&>a]:overflow-hidden [&_img]:object-cover [&>a>strong]:relative [&>a>strong]:z-1",
    "[&>a>strong]:flex [&>a>strong]:flex-col [&>a>strong]:justify-center [&>a>strong]:h-full",
    "[&>a>strong]:bg-[linear-gradient(90deg,_#092c30ed_30%,_transparent_80%)] [&>a>strong]:bg-transparent",
    "[&>a>strong]:text-white [&>a>strong]:text-[38px] [&>a>strong]:p-7.5 [&_strong_span]:text-[13px]",
    "[&_strong_span]:text-[#bff5d6] [&>div]:grid [&>div]:gap-3 [&>div_a]:block [&>div_a]:relative [&>div_a]:min-h-25",
    "[&>div_a]:rounded-[8px] [&>div_a]:overflow-hidden max-[768px]:grid-cols-[1fr] max-[768px]:[&>div]:hidden",
    "max-[768px]:[&>a]:min-h-41.25 max-[768px]:[&>a>strong]:text-[28px] max-[768px]:[&>a>strong]:p-5",
    "max-[768px]:[&_strong_span]:text-[10px]",
  ].join(" "),
  build_cost_bar: [
    "rf-build-cost-bar flex items-center border-t border-t-rf-border border-r border-r-rf-border border-b",
    "border-b-rf-border border-l-5 border-l-rf-green bg-white bg-none mb-5 p-5.5 border-solid rounded-[15px] gap-3.5",
    "[&>div]:flex [&>div]:items-center [&>div]:mr-auto [&>div]:gap-5 [&_span]:text-[13px] [&_span]:text-rf-muted",
    "[&_strong]:text-[26px] [&_strong]:text-rf-sale max-[768px]:flex-wrap max-[768px]:p-3.75 max-[768px]:gap-2.5",
    "max-[768px]:[&>div]:w-full max-[768px]:[&_.rf-btn]:text-[11px] max-[768px]:[&_.rf-btn]:flex-1",
    "max-[768px]:[&_.rf-btn]:px-2.5",
  ].join(" "),
  btn: [
    "rf-btn inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-[12px] font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] px-5.25 py-2.75 border-transparent border-solid border",
    "rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
  builder_toolbar: [
    "rf-builder-toolbar flex justify-between items-center rounded-tl-[8px] rounded-tr-[8px] rounded-br-[0] rounded-bl-[0]",
    "bg-white bg-none text-[11px] px-4.25 py-3.25 border-rf-border border-solid border [&>span]:flex",
    "[&>span]:items-center [&>span]:gap-2.25 [&>div]:flex [&>div]:items-center [&>div]:gap-2.25 [&_button]:flex",
    "[&_button]:items-center [&_button]:bg-transparent [&_button]:bg-none [&_button]:text-[10px] [&_button]:px-2",
    "[&_button]:py-1.5 [&_button]:border-current [&_button]:border-none [&_button]:[border-width:0] [&_button]:gap-2.25",
    "max-[768px]:flex-wrap max-[768px]:gap-2.5 max-[768px]:[&>span]:hidden max-[768px]:[&>div]:flex-wrap",
    "max-[768px]:[&>div]:gap-0.75 max-[768px]:[&_button]:text-[9px] print:hidden!",
  ].join(" "),
  builder_layout_builder_reference_layout: [
    "rf-builder-layout rf-builder-reference-layout grid grid-cols-[minmax(0,_1fr)_320px] [border-top-width:0]",
    "[border-top-style:none] border-t-current border-r [border-right-style:solid] border-r-rf-border border-b",
    "[border-bottom-style:solid] border-b-rf-border border-l [border-left-style:solid] border-l-rf-border rounded-tl-[0]",
    "rounded-tr-[0] rounded-br-[10px] rounded-bl-[10px] overflow-hidden max-[1200px]:grid-cols-[255px_minmax(0,_1fr)]",
    "max-[768px]:flex max-[768px]:flex-col max-[768px]:grid-cols-[1fr] print:block [&_.rf-build-slots]:col-span-full",
    "[&_.rf-build-slot]:min-h-19 [&_.rf-build-slot]:px-5 [&_.rf-build-slot]:py-3.75 [&_.rf-slot-select]:grid",
    "[&_.rf-slot-select]:grid-cols-[130px_1fr_150px] [&_.rf-slot-select]:items-center [&_.rf-slot-select]:gap-3.75",
    "[&_.rf-slot-select>small]:text-[13px] [&_.rf-slot-select>strong]:text-[14px] [&_.rf-slot-select>span]:text-right",
    "[&_.rf-studio]:self-start [&_.rf-build-summary]:self-start max-[768px]:[&_.rf-build-slot]:p-3",
    "max-[768px]:[&_.rf-slot-select]:flex max-[768px]:[&_.rf-slot-select]:flex-col",
    "max-[768px]:[&_.rf-slot-select]:items-start max-[768px]:[&_.rf-slot-select]:gap-1",
    "max-[768px]:[&_.rf-slot-select>small]:text-[10px] max-[768px]:[&_.rf-slot-select>strong]:text-[12px]",
  ].join(" "),
  build_slots: [
    "rf-build-slots bg-white bg-none border-r [border-right-style:solid] border-r-rf-border px-3 py-4.5 [&_h2]:flex",
    "[&_h2]:justify-between [&_h2]:items-center [&_h2]:text-[14px] [&_h2]:pt-0 [&_h2]:pb-3.5 [&_h2]:border-b",
    "[&_h2]:[border-bottom-style:solid] [&_h2]:border-b-rf-border [&_h2]:px-1.5 [&_h2_span]:text-[10px]",
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
    "[&_small]:block [&_small]:text-[9px] [&_small]:text-[#819086] [&_strong]:[display:-webkit-box]",
    "[&_strong]:[-webkit-line-clamp:2] [&_strong]:[-webkit-box-orient:vertical] [&_strong]:text-[10px]",
    "[&_strong]:leading-[1.5] [&_strong]:mt-0.5 [&_strong]:overflow-hidden [&_span]:block [&_span]:text-[10px]",
    "[&_span]:text-rf-green [&_span]:mt-1 max-[768px]:[&_strong]:text-[12px]",
  ].join(" "),
  icon_btn: [
    "rf-icon-btn inline-flex items-center justify-center bg-transparent bg-none min-w-9 min-h-9 p-2 border-current",
    "border-none [border-width:medium] rounded-[6px] print:hidden! hover:bg-[#edf4f0] hover:bg-none",
  ].join(" "),
  studio_top: [
    "rf-studio-top flex items-center justify-between p-4.5 [&>span]:flex [&>span]:items-center [&>span]:text-[10px]",
    "[&>span]:tracking-[1px] [&>span]:gap-2 [&_small]:text-[8px] [&_small]:tracking-[0] [&_small]:opacity-[0.6]",
    "[&>div]:flex [&>div]:border-[#426052] [&>div]:border-solid [&>div]:border [&>div]:rounded-[5px]",
    "[&_button]:bg-transparent [&_button]:bg-none [&_button]:text-[#a4bcb0] [&_button]:text-[9px] [&_button]:px-2",
    "[&_button]:py-1 [&_button]:border-current [&_button]:border-none [&_button]:[border-width:0]",
    '[&_button[aria-pressed="true"]]:bg-[#41654f] [&_button[aria-pressed="true"]]:bg-none',
    '[&_button[aria-pressed="true"]]:text-[#d4f6e0]',
  ].join(" "),
  item_2d_machine: [
    "h-full flex flex-col items-center justify-center pt-0 pb-11.25 px-5 [&>p]:text-[11px] [&>p]:text-[#8eab9b]",
    "[&>p]:max-w-55 [&>p]:text-center [&>.rf-product-art]:w-85",
    "[&>.rf-product-art]:[filter:drop-shadow(0_20px_20px_#0004)]",
    "[&.exploded>.rf-product-art]:[transform:scale(0.85)_rotate(-7deg)]",
  ].join(" "),
  item_2d_tags: [
    "rf-2d-tags flex flex-wrap justify-center gap-1.5 [&>span]:flex [&>span]:items-center [&>span]:text-[8px]",
    "[&>span]:bg-[#42655222] [&>span]:bg-none [&>span]:px-1.75 [&>span]:py-1 [&>span]:border-[#486c5655]",
    "[&>span]:border-solid [&>span]:border [&>span]:rounded-[4px] [&>span]:gap-1",
  ].join(" "),
  viewport_caption: [
    "rf-viewport-caption absolute bottom-2 left-2.5 right-2.5 text-center pointer-events-none [&>span]:block",
    "[&>span]:text-[9px] [&>small]:block [&>small]:text-[8px] [&>small]:opacity-[0.5] [&>small]:mt-1.25",
  ].join(" "),
  scene_controls: [
    "rf-scene-controls flex flex-wrap justify-center border-t [border-top-style:solid] border-t-[#8aa79522] px-2.5 py-3.5",
    "gap-1.75 [&>button]:flex [&>button]:items-center [&>button]:bg-[#ffffff08] [&>button]:bg-none [&>button]:text-[8px]",
    "[&>button]:text-[#adc7b8] [&>button]:px-2 [&>button]:py-1.75 [&>button]:border-[#8aa79533] [&>button]:border-solid",
    "[&>button]:border [&>button]:rounded-[4px] [&>button]:gap-1.5 print:hidden! [&>button.on]:text-[#5af2ba]",
    "[&>button.on]:border-[#5af2ba55]",
  ].join(" "),
  build_summary: [
    "rf-build-summary bg-white bg-none border-l [border-left-style:solid] border-l-rf-border px-4.5 py-5.5",
    "[&_h2]:text-[15px] [&_h2]:mb-5.5 max-[1200px]:col-span-full max-[1200px]:[border-left-width:0]",
    "max-[1200px]:[border-left-style:none] max-[1200px]:border-l-current max-[1200px]:border-t",
    "max-[1200px]:[border-top-style:solid] max-[1200px]:border-t-rf-border [&_.rf-btn]:text-[10px] [&_.rf-btn]:mt-2.25",
    "[&_.rf-btn]:px-2.5 max-[1200px]:[&_.rf-btn]:w-auto max-[1200px]:[&_.rf-btn]:mr-2.5 max-[768px]:[&_.rf-btn]:w-full",
  ].join(" "),
  budget_label: [
    "rf-budget-label flex justify-between items-center text-[10px] gap-2.5 [&_select]:text-[10px] [&_select]:p-1.25",
    "[&_select]:border-rf-border [&_select]:border-solid [&_select]:border [&_select]:rounded-[4px]",
  ].join(" "),
  budget_meter: [
    "rf-budget-meter h-1.25 bg-[#e6eee7] bg-none mt-3.5 mb-2 mx-0 rounded-[10px] overflow-hidden [&>span]:block",
    "[&>span]:h-full [&>span]:bg-rf-green [&>span]:bg-none [&>span]:[transition:width_0.3s]",
  ].join(" "),
  build_total: [
    "rf-build-total flex flex-col border-t [border-top-style:solid] border-t-rf-border border-b",
    "[border-bottom-style:solid] border-b-rf-border px-0 py-5.5 mx-0 my-4.5 [&>span]:text-[10px] [&>span]:text-[#74857a]",
    "[&_strong]:text-rf-sale [&_strong]:text-[27px] [&_strong]:tracking-[-1px] [&_strong]:my-1 [&_small]:text-[#8b9b90]",
    "[&_small]:text-[9px]",
  ].join(" "),
  check_check_label_check_ok_check_error_check_warning: [
    "flex items-start mb-2.5 text-[9px] gap-1.75 [&.rf-check-label]:font-normal [&.rf-check-ok]:text-[#548365]",
    "[&.rf-check-error]:text-[#ad4244] [&.rf-check-warning]:text-[#9b8349]",
  ].join(" "),
  btn_full: [
    "rf-btn rf-full inline-flex items-center justify-center min-h-11 bg-rf-green bg-none text-white text-[12px] font-bold",
    "leading-[1.5] [transition:background_0.2s,_transform_0.2s] w-full px-5.25 py-2.75 border-transparent border-solid",
    "border rounded-[6px] gap-2.5 print:hidden hover:bg-rf-green-hover hover:bg-none",
  ].join(" "),
  btn_btn_outline_full: [
    "rf-btn rf-btn-outline rf-full inline-flex items-center justify-center min-h-11 bg-transparent bg-none text-rf-text",
    "text-[12px] font-bold leading-[1.5] [transition:background_0.2s,_transform_0.2s] w-full px-5.25 py-2.75",
    "border-rf-border border-solid border rounded-[6px] gap-2.5 print:hidden hover:bg-[#edf4ef] hover:bg-none",
    "hover:border-[#9ccab5]",
  ].join(" "),
  text_link_print_build: [
    "rf-text-link rf-print-build flex items-center bg-transparent bg-none text-rf-green text-[10px] font-semibold mt-4",
    "mb-0 p-0 mx-auto border-current border-none [border-width:0] gap-1.75 print:hidden hover:underline",
    "hover:[text-underline-offset:4px]",
  ].join(" "),
  picker_list: [
    "rf-picker-list mt-4.5 [&>div]:flex [&>div]:items-center [&>div]:border-b [&>div]:[border-bottom-style:solid]",
    "[&>div]:border-b-rf-border [&>div]:px-0 [&>div]:py-4 [&>div]:gap-3.75 [&>div>div]:flex-1 [&_strong]:block",
    "[&_strong]:text-[12px] [&_small]:block [&_small]:text-[10px] [&_small]:text-rf-muted [&_small]:my-1.25 [&_b]:block",
    "[&_b]:text-rf-red [&_b]:text-[12px] max-[768px]:[&>div]:flex-wrap max-[768px]:[&>div]:gap-2.5",
    "[&>div>.rf-product-art]:w-23.75 [&>div>.rf-product-art]:h-21.25 [&>div>.rf-product-art]:min-h-21.25",
    "[&>div>.rf-product-art]:shrink-0 [&>div>.rf-component-art]:w-23.75 [&>div>.rf-component-art]:h-21.25",
    "[&>div>.rf-component-art]:min-h-21.25 [&>div>.rf-component-art]:shrink-0 [&>div>.rf-component-art_svg]:w-16.25",
    "[&>div>.rf-component-art_svg]:h-16.25 [&>div>.rf-component-art>span]:hidden [&_.rf-btn]:text-[10px]",
    "[&_.rf-btn]:min-h-9 [&_.rf-btn]:px-3.25 [&_.rf-btn]:py-2 max-[768px]:[&>div>.rf-product-art]:w-16.25",
    "max-[768px]:[&>div>.rf-component-art]:w-16.25 max-[768px]:[&_.rf-btn]:ml-auto [&>div>.rf-product-photo]:w-23.75",
    "[&>div>.rf-product-photo]:h-21.25 [&>div>.rf-product-photo]:min-h-21.25 [&>div>.rf-product-photo]:flex-[0_0_95px]",
    "max-[768px]:[&>div>.rf-product-photo]:w-16.25 max-[768px]:[&>div>.rf-product-photo]:h-16.25",
    "max-[768px]:[&>div>.rf-product-photo]:min-h-16.25 max-[768px]:[&>div>.rf-product-photo]:basis-16.25",
  ].join(" "),
  form: [
    "rf-form grid gap-4.5 [&>label]:grid [&>label]:text-[12px] [&>label]:font-semibold [&>label]:gap-1.75",
    "[&_select]:w-full [&_select]:bg-white [&_select]:bg-none [&_select]:min-h-10.75 [&_select]:text-[12px]",
    "[&_select]:px-3 [&_select]:py-2.75 [&_select]:border-[#dce4dd] [&_select]:border-solid [&_select]:border",
    "[&_select]:rounded-[5px] [&_textarea]:w-full [&_textarea]:bg-white [&_textarea]:bg-none [&_textarea]:min-h-27.5",
    "[&_textarea]:text-[12px] [&_textarea]:resize-y [&_textarea]:px-3 [&_textarea]:py-2.75 [&_textarea]:border-[#dce4dd]",
    "[&_textarea]:border-solid [&_textarea]:border [&_textarea]:rounded-[5px] [&_p]:text-[12px] [&_p]:text-rf-muted",
    "[&_.rf-btn]:justify-self-start [&_.rf-full]:justify-self-stretch [&_.rf-check-label]:flex",
    "[&_.rf-check-label]:items-center [&_.rf-check-label]:text-[12px] [&_.rf-check-label]:font-normal",
    '[&_.rf-check-label]:gap-2.25 [&_input:not([type="radio"]):not([type="checkbox"])]:w-full',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:bg-white',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:bg-none',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:min-h-10.75',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:text-[12px]',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:px-3',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:py-2.75',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:border-[#dce4dd]',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:border-solid',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:border',
    '[&_input:not([type="radio"]):not([type="checkbox"])]:rounded-[5px]',
  ].join(" "),
  saved_grid: [
    "rf-saved-grid grid grid-cols-[repeat(3,_1fr)] gap-5 [&_h2]:text-[20px] [&_p]:text-[12px] [&_p]:text-rf-muted",
    "max-[768px]:grid-cols-[1fr] [&_.rf-product-art]:max-h-50 [&_.rf-product-photo]:h-36.25",
  ].join(" "),
  panel: [
    "rf-panel bg-rf-surface bg-none mb-5 p-6.5 border-rf-border border-solid border rounded-[var(--rf-radius)]",
    "[&_h2]:text-[19px] [&_h1]:text-[26px] [&_h1]:tracking-[-0.7px] max-[768px]:p-4.5",
  ].join(" "),
  text_link: [
    "rf-text-link inline-flex items-center bg-transparent bg-none text-rf-green text-[12px] font-semibold p-0",
    "border-current border-none [border-width:0] gap-1.75 hover:underline hover:[text-underline-offset:4px]",
  ].join(" "),
};

const Scene = dynamic(() => import("./components/pc-scene"), {
  ssr: false,
  loading: () => (
    <div className="rf-scene-fallback flex h-full items-center justify-center flex-col text-[11px] text-center p-6.25 gap-3.75">
      <span className={tw.loader} />
      Đang chuẩn bị không gian 3D…
    </div>
  ),
});
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
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [exploded, setExploded] = useState(false);
  const [powered, setPowered] = useState(false);
  const [open, setOpen] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [budget, setBudget] = useState("25000000");
  const [save, setSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [name, setName] = useState("Cấu hình của tôi");
  const [search, setSearch] = useState("");
  const [reset, setReset] = useState(false);
  const [camera, setCamera] = useState(0);
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
  const sceneError = useCallback(() => {
    setView("2d");
    shop.notify(
      "3D chưa khả dụng trên thiết bị này. Bạn vẫn tiếp tục chọn linh kiện ở chế độ 2D.",
    );
  }, [shop]);
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
          <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
            RIGFORGE PC STUDIO
          </span>
          <h1>Xây dựng cấu hình</h1>
          <p>Tự chọn cấu hình, xem máy thành hình và khám phá từng chi tiết.</p>
        </div>
        <Link className={tw.btn_btn_outline} href="/pc-builder/saved">
          <Save size={16} />
          Cấu hình đã lưu ({shop.builds.length})
        </Link>
      </div>
      <div className={tw.builder_reference_hero}>
        <Link href="/products?category=pc">
          <Image
            src="/images/banners/banner-slider1.webp"
            alt="PC Gaming minh họa"
            fill
            sizes="(max-width: 767px) 100vw, 800px"
          />
          <strong>
            PC RIGFORGE
            <br />
            <span>TỰ CHỌN CẤU HÌNH CỦA BẠN</span>
          </strong>
        </Link>
        <div>
          <Link href="/products?category=monitor">
            <Image
              src="/images/banners/banner-slider2.webp"
              alt="Màn hình gaming minh họa"
              fill
              sizes="350px"
            />
          </Link>
          <Link href="/products?category=gear">
            <Image
              src="/images/banners/banner-slider4.webp"
              alt="Gaming Gear minh họa"
              fill
              sizes="350px"
            />
          </Link>
        </div>
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
                <span className="rf-slot-index text-[8px] text-[#a4b2a8]">
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
        <section className="rf-studio min-w-0 bg-[radial-gradient(ellipse_at_45%_40%,_#344640,_#101c19_70%)] bg-transparent text-[#a4bcb0] max-[768px]:-order-1 print:hidden">
          <div className={tw.studio_top}>
            <span>
              <Box size={17} /> PC STUDIO <small>Hình minh họa</small>
            </span>
            <div>
              <button
                aria-pressed={view === "2d"}
                onClick={() => setView("2d")}
              >
                2D
              </button>
              <button
                aria-pressed={view === "3d"}
                onClick={() => setView("3d")}
              >
                3D
              </button>
            </div>
          </div>
          <div
            className={
              `rf-viewport ${powered ? "powered" : ""}` +
              " " +
              "relative h-120 max-[768px]:h-90 [&.powered]:bg-[radial-gradient(ellipse_at_50%_45%,_#40a77815,_transparent_60%)] [&.powered]:bg-transparent"
            }
          >
            {view === "3d" ? (
              <Scene
                cameraReset={camera}
                build={sceneBuild}
                exploded={exploded}
                powered={powered}
                panelOpen={open}
                reduceMotion={reduce}
                onError={sceneError}
              />
            ) : (
              <div
                className={
                  `rf-2d-machine ${exploded ? "exploded" : ""}` +
                  " " +
                  tw.item_2d_machine
                }
              >
                <ProductArt category="pc" />
                <div className={tw.item_2d_tags}>
                  {selectedSlots.map((s) => (
                    <span key={s}>
                      <CategoryIcon id={s} size={13} />
                      {categories.find((c) => c.id === s)?.short}
                      <Check size={12} />
                    </span>
                  ))}
                </div>
                {!selected && (
                  <p>Bắt đầu chọn linh kiện hoặc thử cấu hình đề xuất</p>
                )}
              </div>
            )}
            {view === "3d" && !selected && (
              <p className="pointer-events-none absolute inset-0 m-0 grid place-items-center px-8 text-center text-sm text-white">
                Chọn linh kiện hoặc dùng cấu hình đề xuất để xem mô hình 3D.
              </p>
            )}
            <div className={tw.viewport_caption}>
              <span>
                {view === "3d"
                  ? "Kéo để xoay · Cuộn để phóng to"
                  : "Bản xem tổng quan · Chuyển 3D để xem lắp ráp"}
              </span>
              <small>Model hình học minh họa, chưa đúng từng SKU</small>
            </div>
          </div>
          <div className={tw.scene_controls}>
            <button
              aria-pressed={exploded}
              onClick={() => setExploded(!exploded)}
            >
              <Layers3 size={16} />
              {exploded ? "Thu gọn" : "Tách linh kiện"}
            </button>
            <button
              disabled={view !== "3d"}
              aria-pressed={open}
              onClick={() => setOpen(!open)}
            >
              <Expand size={16} />
              {open ? "Đóng kính" : "Mở kính"}
            </button>
            <button
              disabled={view !== "3d"}
              onClick={() => setCamera((c) => c + 1)}
            >
              <RotateCcw size={16} />
              Góc nhìn
            </button>
            <button
              className={powered ? "on" : ""}
              disabled={!powered && (!!missing.length || !!errors.length)}
              aria-pressed={powered}
              onClick={() => setPowered(!powered)}
            >
              <Power size={17} />
              {powered ? "Tắt máy" : "Bật thử"}
            </button>
          </div>
          <label className="rf-motion-toggle flex justify-center text-[9px] pt-0 pb-3.5 px-2.5 gap-1.25">
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
          <div className="rf-budget-text flex justify-between text-[8px] text-[#819086]">
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
          <div className="rf-compatibility [&_h3]:flex [&_h3]:items-center [&_h3]:text-[11px] [&_h3]:gap-1.5">
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
              <p className="rf-missing text-[10px] text-[#88978c]">
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
        >
          <input
            className="rf-picker-search w-full bg-white bg-none min-h-10.75 text-[12px] px-3 py-2.75 border-[#dce4dd] border-solid border rounded-[5px]"
            autoFocus
            aria-label="Tìm linh kiện"
            placeholder="Tìm theo tên linh kiện…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                    <ProductArt category={p.category} />
                    <div>
                      <strong>{p.name}</strong>
                      <small>{p.specs.join(" · ")}</small>
                      <b>{money(p.price)}</b>
                      {candidate.length > 0 && (
                        <span className="rf-picker-warning block text-[#ab6b39] text-[9px] mt-1.5">
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
          <span className="rf-eyebrow inline-flex items-center text-[10px] font-bold tracking-[1.6px] text-rf-green gap-2 max-[768px]:text-[9px] max-[768px]:tracking-[1px]">
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
