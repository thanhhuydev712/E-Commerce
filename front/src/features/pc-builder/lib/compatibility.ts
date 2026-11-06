import type { Product } from "@/src/catalog/model";
type Lookup = (id: string) => Product | undefined;
export const slots = [
  "cpu",
  "mainboard",
  "ram",
  "gpu",
  "ssd",
  "psu",
  "case",
  "cooler",
] as const;
export type Slot = (typeof slots)[number];
export type Build = Partial<Record<Slot, string>>;
export type Check = { level: "error" | "warning" | "ok"; message: string };

export function checkBuild(build: Build, productById: Lookup): Check[] {
  const selected = Object.fromEntries(
    slots.map((s) => [s, productById(build[s] ?? "")]),
  ) as Partial<Record<Slot, Product>>;
  const { cpu, mainboard, ram, gpu, psu, cooler } = selected;
  const chassis = selected.case;
  const checks: Check[] = [];
  if (cpu && mainboard)
    checks.push(
      cpu.technical.socket === mainboard.technical.socket
        ? { level: "ok", message: "CPU và mainboard cùng socket." }
        : {
            level: "error",
            message: `CPU ${cpu.technical.socket} không phù hợp mainboard ${mainboard.technical.socket}.`,
          },
    );
  if (mainboard && ram)
    checks.push(
      mainboard.technical.ddr === ram.technical.ddr
        ? { level: "ok", message: "RAM đúng thế hệ mainboard hỗ trợ." }
        : { level: "error", message: "RAM và mainboard khác thế hệ DDR." },
    );
  if (
    mainboard &&
    chassis &&
    mainboard.technical.form === "ATX" &&
    chassis.technical.form === "mATX"
  )
    checks.push({
      level: "error",
      message: "Mainboard ATX không vừa case mATX đã chọn.",
    });
  if (
    gpu &&
    chassis &&
    (gpu.technical.length ?? 0) > (chassis.technical.gpuMax ?? 0)
  )
    checks.push({
      level: "error",
      message: "Card đồ họa dài hơn khoảng trống của case.",
    });
  if (
    cooler &&
    chassis &&
    (cooler.technical.clearance ?? 0) > (chassis.technical.coolerMax ?? 0)
  )
    checks.push({
      level: "error",
      message: "Tản nhiệt cao hơn giới hạn của case.",
    });
  if (cpu && !cpu.technical.integrated && !gpu)
    checks.push({
      level: "error",
      message: "CPU không có đồ họa tích hợp: cần chọn VGA.",
    });
  const watts = estimateWatts(build, productById);
  if (psu)
    checks.push(
      (psu.technical.watts ?? 0) < watts * 1.3
        ? {
            level: "error",
            message: "Nguồn chưa đủ khoảng dự phòng 30% theo ước tính demo.",
          }
        : {
            level: "ok",
            message: "Nguồn đủ khoảng dự phòng theo ước tính demo.",
          },
    );
  checks.push({
    level: "warning",
    message:
      "Chưa xác minh BIOS, đầu cấp nguồn, lane M.2 và khoảng hở thực tế. Mô hình 3D chỉ minh họa.",
  });
  return checks;
}
export const estimateWatts = (build: Build, productById: Lookup) =>
  80 +
  (productById(build.cpu ?? "")?.technical.watts ?? 0) +
  (productById(build.gpu ?? "")?.technical.watts ?? 0);
export const missingSlots = (build: Build, productById: Lookup) =>
  slots.filter(
    (s) =>
      !build[s] &&
      (s !== "gpu" || !productById(build.cpu ?? "")?.technical.integrated),
  );
