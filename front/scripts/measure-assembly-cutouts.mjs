import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Reads existing alpha only. No pixels are edited or original images overwritten.
const front = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(front, "public/images/pc-assembly");
const manifestFile = path.join(directory, "manifest.json");
const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
const measurements = new Map();
const round = (value) => Number(value.toFixed(8));
for (const src of new Set(manifest.parts.map((part) => part.src))) {
  if (!src.startsWith("/images/pc-assembly/"))
    throw new Error("Unexpected asset prefix");
  const file = path.resolve(front, "public", `.${src}`);
  if (!file.startsWith(directory + path.sep))
    throw new Error("Asset escaped assembly directory");
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + info.channels - 1] < 24)
        continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error(`Empty cutout: ${src}`);
  const x = round((left / info.width) * 100),
    y = round((top / info.height) * 100);
  measurements.set(src, {
    crop: {
      x,
      y,
      width: Math.min(100 - x, round(((right - left + 1) / info.width) * 100)),
      height: Math.min(
        100 - y,
        round(((bottom - top + 1) / info.height) * 100),
      ),
    },
    aspectRatio: round((right - left + 1) / (bottom - top + 1)),
  });
}
for (const part of manifest.parts)
  Object.assign(part, measurements.get(part.src));
await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Measured ${measurements.size} distinct cutouts; updated ${manifest.parts.length} bindings without changing image pixels.`,
);
