import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Công cụ chuẩn bị asset tĩnh một lần; browser của ứng dụng không gọi API cửa hàng tham khảo.
const collections = {
  pc: "pc-gaming",
  laptop: "laptop",
  cpu: "cpu-bo-vi-xu-ly",
  mainboard: "bo-mach-chu",
  gpu: "card-man-hinh",
  ram: "bo-nho-ram",
  ssd: "o-cung-ssd",
  hdd: "o-cung-hdd",
  monitor: "man-hinh-may-tinh",
  gear: "ban-phim",
  mouse: "chuot",
  headset: "toan-bo-tai-nghe",
  case: "case-thung-may",
  psu: "psu-nguon-may-tinh",
  cooler: "tan-nhiet-pc",
  fan: "fan-case",
  camera: "camera",
  webcam: "webcam",
  printer: "may-in",
  ups: "bo-luu-dien",
  network: "thiet-bi-mang",
  accessory: "phu-kien",
  software: "phan-mem",
  projector: "may-chieu",
  chair: "ghe-gaming",
  desk: "ban-gaming",
};
await mkdir("public/images/catalog", { recursive: true });
const rows = [];
const sources = [];
const entries = Object.entries(collections);
let cursor = 0;
async function worker() {
  while (cursor < entries.length) {
    const [category, handle] = entries[cursor++];
    const endpoint = `https://tinhocngoisao.com/collections/${handle}/products.json?limit=8`;
    try {
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(20000),
      });
      const payload = await response.json();
      const items = payload.products?.slice(0, 6) ?? [];
      for (const [index, product] of items.entries()) {
        const source = product.images?.[0]?.src;
        if (!source) continue;
        const image = await fetch(source, {
          signal: AbortSignal.timeout(20000),
        });
        if (!image.ok) continue;
        const path = `/images/catalog/${category}-${index + 1}.webp`;
        await sharp(Buffer.from(await image.arrayBuffer()))
          .resize(480, 480, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(`public${path}`);
        const parts = product.title
          .split(/[|,]/)
          .map((s) => s.trim())
          .filter(Boolean);
        rows.push({
          id: `demo-${category}-${index + 1}`,
          category,
          name: product.title.replace(/\bSTAR\b/g, "RIGFORGE"),
          brand: product.vendor || "Rigforge",
          image: path,
          price: String(
            Math.round(Number(product.variants?.[0]?.price || 990000) / 1000) *
              1000,
          ),
          specs: parts.slice(1, 5),
        });
        sources.push({
          file: path,
          source,
          page: `https://tinhocngoisao.com/products/${product.handle}`,
        });
      }
      console.log(`${category}: ${items.length} static images`);
    } catch (error) {
      console.log(`${category}: ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
rows.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(
  "../api/prisma/seed-data/reference-import.json",
  JSON.stringify(rows, null, 2) + "\n",
);
await writeFile(
  "public/images/catalog/SOURCES.json",
  JSON.stringify(
    {
      purpose:
        "Static product imagery for the requested reference-based UI demo; no runtime API integration",
      downloaded: "2026-11-06",
      assets: sources,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Prepared ${rows.length} local product images.`);
