"use client";
import { useId } from "react";
import Image from "next/image";
import type { Product, CategoryId } from "@/src/catalog/model";
import { CategoryIcon } from "./category-icon";

// Utility Tailwind v4; marker rf-* chỉ phục vụ trạng thái, selector và kiểm thử.
const tw = {
  component_art_art_glow_art_cpu_art_mainboard_art_ssd_art_psu_art_cooler_art_label:
    [
      "relative flex items-center justify-center flex-col min-h-43.5 text-[#566e62] isolate gap-2",
      "[&>svg]:[filter:drop-shadow(0_7px_5px_#1c2f2120)] [&>span]:text-[9px] [&>span]:tracking-[2px] [&>span]:font-bold",
      "[&.rf-art-glow]:absolute [&.rf-art-glow]:w-30 [&.rf-art-glow]:h-30",
      "[&.rf-art-glow]:bg-[radial-gradient(ellipse,_#c9ded0,_transparent_70%)] [&.rf-art-glow]:bg-transparent",
      "[&.rf-art-glow]:z-[-1] [&.rf-art-cpu]:text-[#6e777c] [&.rf-art-cpu>svg]:text-[#7b8286]",
      "[&.rf-art-cpu>svg]:bg-[#d5d9d7] [&.rf-art-cpu>svg]:bg-none [&.rf-art-cpu>svg]:w-20.75 [&.rf-art-cpu>svg]:h-20.75",
      "[&.rf-art-cpu>svg]:p-2 [&.rf-art-cpu>svg]:border-[#485453] [&.rf-art-cpu>svg]:border-solid",
      "[&.rf-art-cpu>svg]:border-5 [&.rf-art-cpu>svg]:rounded-[5px] [&.rf-art-mainboard>svg]:bg-[#35473f]",
      "[&.rf-art-mainboard>svg]:bg-none [&.rf-art-mainboard>svg]:text-[#c0cdba] [&.rf-art-mainboard>svg]:w-25",
      "[&.rf-art-mainboard>svg]:h-29.25 [&.rf-art-mainboard>svg]:p-2.5 [&.rf-art-mainboard>svg]:border-[#748278]",
      "[&.rf-art-mainboard>svg]:border-solid [&.rf-art-mainboard>svg]:border-6 [&.rf-art-mainboard>svg]:rounded-[3px]",
      "[&.rf-art-ssd>svg]:bg-[#253b32] [&.rf-art-ssd>svg]:bg-none [&.rf-art-ssd>svg]:text-[#b6c6b6]",
      "[&.rf-art-ssd>svg]:w-32.5 [&.rf-art-ssd>svg]:h-12 [&.rf-art-ssd>svg]:border-l-7",
      "[&.rf-art-ssd>svg]:[border-left-style:solid] [&.rf-art-ssd>svg]:border-l-[#c9b16c] [&.rf-art-ssd>svg]:p-2",
      "[&.rf-art-psu>svg]:bg-[#253432] [&.rf-art-psu>svg]:bg-none [&.rf-art-psu>svg]:text-[#a1b8ac] [&.rf-art-psu>svg]:w-25",
      "[&.rf-art-psu>svg]:h-23.25 [&.rf-art-psu>svg]:p-4 [&.rf-art-psu>svg]:border-[#61776b]",
      "[&.rf-art-psu>svg]:border-solid [&.rf-art-psu>svg]:border-3 [&.rf-art-psu>svg]:rounded-[6px]",
      "[&.rf-art-cooler>svg]:bg-[#e0e7e2] [&.rf-art-cooler>svg]:bg-none [&.rf-art-cooler>svg]:text-[#61746c]",
      "[&.rf-art-cooler>svg]:p-1 [&.rf-art-cooler>svg]:border-[#a1aba7] [&.rf-art-cooler>svg]:border-double",
      "[&.rf-art-cooler>svg]:border-7 [&.rf-art-cooler>svg]:rounded-[5px] [&.rf-art-label]:absolute",
      "[&.rf-art-label]:text-[#a2c2ae] [&.rf-art-label]:bottom-[-12px] [&.rf-art-label]:right-16.25",
      "[&.rf-art-label]:text-[7px] [&.rf-art-label]:font-semibold [&.rf-art-label]:tracking-[1.2px]",
      "[&.rf-art-label]:gap-1.25 [&.rf-art-label_i]:block [&.rf-art-label_i]:w-1 [&.rf-art-label_i]:h-1",
      "[&.rf-art-label_i]:bg-[#79cb9d] [&.rf-art-label_i]:bg-none",
    ].join(" "),
};

// Component độc lập; nhận dữ liệu qua props, không truy cập API thật.
export function ProductArt({
  category,
  className = "",
}: {
  category: CategoryId;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  // SVG được dựng tại chỗ: landing có hình ngay, không tải ảnh ngoài hoặc thư viện 3D.
  // Đây là hình đại diện nhóm sản phẩm, không tuyên bố đúng ngoại hình từng SKU.
  if (category === "gear")
    return (
      <svg
        className={`rf-product-art ${className}` + " " + "block w-full h-auto"}
        viewBox="0 0 260 220"
        role="img"
        aria-label="Hình minh họa bàn phím cơ"
      >
        <ellipse
          cx="131"
          cy="177"
          rx="105"
          ry="10"
          fill="#111827"
          opacity=".08"
        />
        <g transform="translate(20 63) rotate(-8 110 55)">
          <rect width="220" height="102" rx="8" fill="#354842" />
          <rect x="3" y="3" width="214" height="89" rx="6" fill="#87978a" />
          {/* Keycap dùng cùng lưới; các phím nhấn màu giúp nhìn rõ chiều sâu của bộ bàn phím. */}
          {Array.from({ length: 5 }, (_, row) =>
            Array.from({ length: 13 }, (_, col) => (
              <g
                key={`${row}-${col}`}
                transform={`translate(${8 + col * 15.7} ${7 + row * 15.5})`}
              >
                <rect
                  width="13"
                  height="13"
                  rx="2"
                  fill={
                    col === 12 || (row === 0 && col === 0)
                      ? "#356f57"
                      : "#aab2a8"
                  }
                />
                <rect
                  y="-1"
                  width="13"
                  height="10"
                  rx="2"
                  fill={
                    col === 12 || (row === 0 && col === 0)
                      ? "#5c977b"
                      : row % 2 === 0
                        ? "#dde0d2"
                        : "#cbd3c8"
                  }
                />
                <path
                  d="M5 3h3"
                  stroke={col === 12 ? "#e1f0de" : "#8b9b8c"}
                  strokeWidth=".8"
                />
              </g>
            )),
          )}
          <rect x="57" y="70" width="93" height="13" rx="2" fill="#b6cbb9" />
          <path d="M8 96h204" stroke="#5bd69e" strokeWidth="1.5" />
        </g>
      </svg>
    );
  if (category === "pc" || category === "case")
    return (
      <svg
        className={`rf-product-art ${className}` + " " + "block w-full h-auto"}
        viewBox="0 0 260 220"
        role="img"
        aria-label="Hình minh họa case PC"
      >
        <defs>
          <linearGradient id={uid} x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#071f1b" />
            <stop offset=".5" stopColor="#39f3a5" />
            <stop offset="1" stopColor="#9568ff" />
          </linearGradient>
        </defs>
        <ellipse
          cx="134"
          cy="204"
          rx="85"
          ry="8"
          fill="#111827"
          opacity=".08"
        />
        <path d="M66 35 165 20 208 45 208 187 108 204 66 180Z" fill="#1b232d" />
        <path d="M66 35 108 60 208 45 165 20Z" fill="#34414d" />
        <path d="M108 60 208 45 208 187 108 204Z" fill="#111820" />
        <path d="M72 46 101 64 101 185 72 169Z" fill="#273744" />
        <path
          d="M114 68 199 55 199 176 114 191Z"
          fill="#162d31"
          stroke="#607078"
          strokeWidth="1"
        />
        <path d="M123 80 168 73 168 143 123 151Z" fill="#252e33" />
        <path d="M141 93 160 90 160 113 141 116Z" fill="#67727b" />
        <path d="M127 139 190 129 190 145 127 155Z" fill="#40494d" />
        <path d="M126 164 193 153 193 171 126 183Z" fill="#0d1117" />
        {[89, 130, 170].map((y) => (
          <g key={y}>
            <ellipse cx="86" cy={y} rx="10" ry="16" fill="#0a1116" />
            <ellipse
              cx="86"
              cy={y}
              rx="8"
              ry="13"
              fill="none"
              stroke={`url(#${uid})`}
              strokeWidth="3"
            />
            <path d={`M86 ${y - 10}q10 12-3 17q-8-11 3-17`} fill="#52716c" />
          </g>
        ))}
        <path d="M176 76 181 75 181 119 176 120Z" fill="#5bf7ba" />
        <path d="M186 74 191 73 191 117 186 118Z" fill="#aa83ff" />
        <path d="M66 35 108 60 108 204" fill="none" stroke="#5d6c75" />
        <circle cx="119" cy="53" r="2" fill="#67efbb" />
      </svg>
    );
  if (category === "gpu")
    return (
      <svg
        className={`rf-product-art ${className}` + " " + "block w-full h-auto"}
        viewBox="0 0 260 220"
        role="img"
        aria-label="Hình minh họa card đồ họa"
      >
        <ellipse
          cx="130"
          cy="181"
          rx="100"
          ry="9"
          fill="#111827"
          opacity=".08"
        />
        <path d="M30 78 208 57 235 90 57 114Z" fill="#43505b" />
        <path d="M30 78 57 114 57 172 30 136Z" fill="#101820" />
        <path
          d="M57 114 235 90 235 149 57 172Z"
          fill="#232e37"
          stroke="#68717c"
        />
        {[105, 182].map((x) => (
          <g key={x} transform={`translate(${x} ${143 - (x - 105) * 0.14})`}>
            <ellipse rx="29" ry="23" fill="#11181e" stroke="#65727b" />
            {[0, 60, 120, 180, 240, 300].map((r) => (
              <path
                key={r}
                transform={`rotate(${r})`}
                d="M0 0 Q26 -19 16 -1 Q12 7 0 0"
                fill="#46515b"
              />
            ))}
            <circle r="6" fill="#8a969e" />
          </g>
        ))}
        <path d="M70 169 70 180 128 173 128 161" fill="#cfa35b" />
        <text
          x="83"
          y="90"
          fill="#c7d3dc"
          fontSize="10"
          fontWeight="700"
          transform="rotate(-7 83 90)"
        >
          GEFORCE RTX
        </text>
      </svg>
    );
  if (category === "ram")
    return (
      <svg
        className={`rf-product-art ${className}` + " " + "block w-full h-auto"}
        viewBox="0 0 260 220"
        role="img"
        aria-label="Hình minh họa RAM"
      >
        <path d="m30 117 187-38 13 66-187 38Z" fill="#182e29" />
        <path d="m39 126 175-35 7 41-175 35Z" fill="#273334" />
        <path d="m39 117 176-36 3 8-176 36Z" fill="#63e8c4" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`m${52 + i * 27} ${134 - i * 5.5} 18-4 3 20-18 4Z`}
            fill="#0b1419"
          />
        ))}
        <path d="m49 173 174-35 2 9-174 35Z" fill="#d8b268" />
        <text
          x="82"
          y="148"
          fontSize="14"
          fill="#d6e4e3"
          transform="rotate(-12 82 148)"
        >
          FURY BEAST
        </text>
      </svg>
    );
  if (["monitor", "laptop"].includes(category))
    return (
      <svg
        className={`rf-product-art ${className}` + " " + "block w-full h-auto"}
        viewBox="0 0 260 220"
        role="img"
        aria-label={`Hình minh họa ${category}`}
      >
        <defs>
          <linearGradient id={uid} x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#032e2a" />
            <stop offset=".5" stopColor="#10b981" />
            <stop offset="1" stopColor="#5b4cce" />
          </linearGradient>
        </defs>
        <rect x="29" y="34" width="202" height="132" rx="6" fill="#1d2630" />
        <rect
          x="35"
          y="40"
          width="190"
          height="116"
          rx="2"
          fill={`url(#${uid})`}
        />
        <path
          d="m35 135 80-74-14 62 72-66-24 67 76-51v83H35Z"
          fill="#b3ffdd"
          opacity=".2"
        />
        {category === "monitor" ? (
          <>
            <path d="M121 166h18v24h-18Z" fill="#3e4852" />
            <path d="m91 197 39-13 39 13Z" fill="#29333f" />
          </>
        ) : (
          <path d="M29 166h202l18 20q0 7-12 7H23q-12 0-12-7Z" fill="#9aa6b1" />
        )}
      </svg>
    );
  return (
    <div
      className={
        `rf-component-art rf-art-${category} ${className}` +
        " " +
        tw.component_art_art_glow_art_cpu_art_mainboard_art_ssd_art_psu_art_cooler_art_label
      }
    >
      <div className="rf-art-glow absolute w-30 h-30 bg-[radial-gradient(ellipse,_#c9ded0,_transparent_70%)] bg-transparent z-[-1]" />
      <CategoryIcon id={category} size={88} />
      <span>
        {
          (
            {
              cpu: "RYZEN",
              mainboard: "PRO SERIES",
              ssd: "NVMe",
              psu: "80 PLUS",
              cooler: "AIR COOLING",
              gear: "PLAY YOUR WAY",
            } as Record<string, string>
          )[category]
        }
      </span>
    </div>
  );
}
export function ProductImage({ product }: { product: Product }) {
  // Ảnh tĩnh được tối ưu sẵn, giữ SVG khi sản phẩm chưa có ảnh public.
  if (product.image.startsWith("/"))
    return (
      <div className="rf-product-photo relative w-full h-44.5 bg-white bg-none max-[768px]:h-36.25">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 639px) 44vw, (max-width: 1023px) 30vw, 210px"
          className="rf-product-photo-img object-contain p-2"
        />
      </div>
    );
  return <ProductArt category={product.category} />;
}
