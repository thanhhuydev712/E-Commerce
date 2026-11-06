"use client";
import { useCatalog } from "@/src/catalog/catalog-provider";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion } from "@/src/components/ui/motion";
import { money } from "@/src/catalog/model";
import { normalizeSearch } from "@/src/features/catalog/catalog-query";
import { ProductImage } from "@/src/components/storefront";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  search: [
    "rf-search flex items-center bg-[#f7f9f7] bg-none min-w-0 flex-1 h-11 pl-3.75 text-[#7c8981] border-[#e0e7e2]",
    "border-solid border rounded-[7px] [&_input]:bg-transparent [&_input]:bg-none [&_input]:text-rf-text [&_input]:w-full",
    "[&_input]:[outline:0] [&_input]:text-[12px] [&_input]:px-3 [&_input]:py-2.5 [&_input]:border-current",
    "[&_input]:border-none [&_input]:[border-width:0] [&_button]:self-stretch [&_button]:bg-transparent",
    "[&_button]:bg-none [&_button]:text-rf-green [&_button]:text-[11px] [&_button]:font-bold [&_button]:whitespace-nowrap",
    "[&_button]:px-4.5 [&_button]:py-0 [&_button]:border-current [&_button]:border-none [&_button]:[border-width:0]",
    "max-[1024px]:order-5 max-[1024px]:basis-full max-[1024px]:h-9.75 focus-within:border-rf-green",
  ].join(" "),
  search_suggestions: [
    "rf-search-suggestions absolute top-[calc(100%_+_8px)] right-0 bottom-auto left-0 z-55 bg-white bg-none",
    "shadow-[0_12px_35px_#072a3026] border-rf-border border-solid border rounded-[10px] overflow-hidden [&_ul]:list-none",
    "[&_ul]:p-0 [&_ul]:m-0 [&_li_a]:flex [&_li_a]:items-center [&_li_a]:text-[12px] [&_li_a]:border-b",
    "[&_li_a]:[border-bottom-style:solid] [&_li_a]:border-b-rf-border [&_li_a]:px-3.5 [&_li_a]:py-2.5 [&_li_a]:gap-3",
    '[&_li[aria-selected="true"]]:bg-[#ecf7f2] [&_li[aria-selected="true"]]:bg-none [&_strong]:block [&_strong]:mt-1.25',
    "[&_strong]:text-rf-sale [&_p]:block [&_p]:text-[12px] [&_p]:px-3.75 [&_p]:py-3.25 [&_li_.rf-product-photo]:w-13.75",
    "[&_li_.rf-product-photo]:h-13.75 [&_li_.rf-product-photo]:min-h-13.75 [&_li_.rf-product-photo]:flex-[0_0_55px]",
    "[&_li_.rf-product-art]:w-13.75 [&_li_.rf-product-art]:h-13.75 [&_li_.rf-product-art]:min-h-13.75",
    "[&_li_.rf-product-art]:flex-[0_0_55px] [&_li_.rf-component-art]:w-13.75 [&_li_.rf-component-art]:h-13.75",
    "[&_li_.rf-component-art]:min-h-13.75 [&_li_.rf-component-art]:flex-[0_0_55px]",
  ].join(" "),
  search_suggestions_head: [
    "rf-search-suggestions-head flex justify-between text-[13px] font-bold bg-[#f5f8f8] bg-none px-3.75 py-3",
    "[&_small]:text-[10px] [&_small]:text-rf-muted [&_small]:font-normal",
  ].join(" "),
};

/** Gợi ý local; Enter gửi từ khóa, mũi tên chọn gợi ý, Escape đóng. */
export function StoreSearch() {
  const { products } = useCatalog();

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const words = normalizeSearch(value).split(/\s+/);
  const results = value.trim()
    ? products.filter((p) =>
        words.every((word) =>
          normalizeSearch(`${p.name} ${p.brand} ${p.specs.join(" ")}`).includes(
            word,
          ),
        ),
      )
    : [];
  const suggestions = results.slice(0, 5);
  const visible = open && value.trim().length > 0;
  return (
    <div
      className="rf-search-wrap relative flex-1 min-w-0"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <form
        className={tw.search + " " + motion.search}
        action="/search"
        onSubmit={() => setOpen(false)}
      >
        <input
          name="q"
          aria-label="Tìm kiếm sản phẩm"
          placeholder="Bạn tìm gì…"
          autoComplete="off"
          value={value}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls="store-search-results"
          aria-activedescendant={
            visible && active >= 0 ? `search-result-${active}` : undefined
          }
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive((i) =>
                e.key === "ArrowDown"
                  ? Math.min(i + 1, suggestions.length - 1)
                  : Math.max(i - 1, -1),
              );
            }
            if (
              e.key === "Enter" &&
              visible &&
              active >= 0 &&
              suggestions[active]
            ) {
              e.preventDefault();
              setOpen(false);
              router.push(`/products/${suggestions[active].slug}`);
            }
          }}
        />
        <button type="submit">
          <Search size={17} />
          <span>Tìm kiếm</span>
        </button>
      </form>
      {visible && (
        <div className={tw.search_suggestions + " " + motion.enter}>
          <div className={tw.search_suggestions_head}>Sản phẩm gợi ý</div>
          <ul
            id="store-search-results"
            role="listbox"
            aria-label="Gợi ý sản phẩm"
          >
            {suggestions.map((p, index) => (
              <li
                role="option"
                aria-selected={active === index}
                id={`search-result-${index}`}
                key={p.id}
              >
                <Link
                  href={`/products/${p.slug}`}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActive(index)}
                  tabIndex={-1}
                >
                  <ProductImage product={p} />
                  <span>
                    {p.name}
                    <strong>{money(p.price)}</strong>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!suggestions.length && (
            <p role="status">Không tìm thấy sản phẩm phù hợp.</p>
          )}
          <Link
            className="rf-search-all block text-[12px] text-rf-green text-center font-semibold px-3.75 py-3.25"
            href={`/search?q=${encodeURIComponent(value)}`}
            onClick={() => setOpen(false)}
          >
            Xem {results.length} kết quả cho “{value}” →
          </Link>
        </div>
      )}
    </div>
  );
}
