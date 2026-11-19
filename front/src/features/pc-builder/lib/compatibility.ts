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
export type Check = {
  level: "error" | "warning" | "ok";
  message: string;
  slots?: readonly Slot[];
  blocksSelection?: boolean;
};

const positive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const normalized = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : undefined;
const formRank = (value: unknown): number | undefined => {
  switch (normalized(value)) {
    case "ITX":
      return 1;
    case "MATX":
      return 2;
    case "ATX":
      return 3;
    default:
      return undefined;
  }
};

export function checkBuild(build: Build, productById: Lookup): Check[] {
  const selected: Partial<Record<Slot, Product>> = {};
  const checks: Check[] = [];
  const add = (
    level: Check["level"],
    message: string,
    related: readonly Slot[],
    blocksSelection = false,
  ) => checks.push({ level, message, slots: related, blocksSelection });
  const limit = (
    actual: unknown,
    maximum: unknown,
    related: readonly Slot[],
    unknownMessage: string,
    errorMessage: string,
  ) => {
    if (!positive(actual) || !positive(maximum))
      add("warning", unknownMessage, related);
    else if (actual > maximum) add("error", errorMessage, related, true);
  };
  for (const slot of slots) {
    if (!build[slot]) continue;
    const product = productById(build[slot]!);
    if (
      !product ||
      product.builderEligible !== true ||
      product.category !== slot
    ) {
      add(
        "error",
        `Linh kiện ở nhóm ${slot} không còn phù hợp. Vui lòng chọn lại.`,
        [slot],
        true,
      );
      continue;
    }
    selected[slot] = product;
    const variant = Array.isArray(product.variants)
      ? product.variants[0]
      : undefined;
    if (!variant || !normalized(variant.id) || !normalized(variant.sku))
      add(
        "error",
        `${product.name} chưa có SKU mặc định khả dụng.`,
        [slot],
        true,
      );
    else if (!positive(variant.stock))
      add(
        "error",
        `${product.name} hiện hết hàng ở phiên bản mặc định.`,
        [slot],
        true,
      );
  }
  const { cpu, mainboard, ram, gpu, psu, cooler } = selected;
  const chassis = selected.case;
  if (cpu && mainboard) {
    const cpuSocket = normalized(cpu.technical.socket),
      boardSocket = normalized(mainboard.technical.socket);
    if (!cpuSocket || !boardSocket)
      add(
        "warning",
        "Chưa có đủ thông tin socket để đối chiếu CPU và mainboard.",
        ["cpu", "mainboard"],
      );
    else if (cpuSocket !== boardSocket)
      add(
        "error",
        `CPU ${cpuSocket} không phù hợp mainboard ${boardSocket}.`,
        ["cpu", "mainboard"],
        true,
      );
    else add("ok", "CPU và mainboard cùng socket.", ["cpu", "mainboard"]);
  }
  if (mainboard && ram) {
    const boardDdr = normalized(mainboard.technical.ddr),
      ramDdr = normalized(ram.technical.ddr);
    if (!boardDdr || !ramDdr)
      add("warning", "Chưa có đủ thông tin thế hệ DDR để đối chiếu RAM.", [
        "mainboard",
        "ram",
      ]);
    else if (boardDdr !== ramDdr)
      add(
        "error",
        "RAM và mainboard khác thế hệ DDR.",
        ["mainboard", "ram"],
        true,
      );
    else add("ok", "RAM đúng thế hệ mainboard hỗ trợ.", ["mainboard", "ram"]);
    limit(
      ram.technical.capacity,
      mainboard.technical.capacity,
      ["mainboard", "ram"],
      "Chưa đủ thông tin dung lượng để đối chiếu RAM và mainboard.",
      "Dung lượng RAM vượt giới hạn mainboard hỗ trợ.",
    );
    limit(
      ram.technical.slots,
      mainboard.technical.slots,
      ["mainboard", "ram"],
      "Chưa đủ thông tin số khe để đối chiếu RAM và mainboard.",
      "RAM cần nhiều khe hơn mainboard hiện có.",
    );
  }
  if (mainboard && chassis) {
    const boardForm = formRank(mainboard.technical.form),
      caseForm = formRank(chassis.technical.form);
    if (boardForm === undefined || caseForm === undefined)
      add(
        "warning",
        "Chưa đủ thông tin chuẩn kích thước để đối chiếu mainboard và case.",
        ["mainboard", "case"],
      );
    else if (boardForm > caseForm)
      add(
        "error",
        `Mainboard ${mainboard.technical.form} không vừa case ${chassis.technical.form} đã chọn.`,
        ["mainboard", "case"],
        true,
      );
  }
  if (gpu && chassis)
    limit(
      gpu.technical.length,
      chassis.technical.gpuMax,
      ["gpu", "case"],
      "Chưa đủ kích thước để kiểm tra VGA có vừa case.",
      "Card đồ họa dài hơn khoảng trống của case.",
    );
  if (cooler && chassis)
    limit(
      cooler.technical.clearance,
      chassis.technical.coolerMax,
      ["cooler", "case"],
      "Chưa đủ kích thước để kiểm tra tản nhiệt có vừa case.",
      "Tản nhiệt cao hơn giới hạn của case.",
    );
  if (cpu && cpu.technical.integrated === false && !gpu)
    add(
      "error",
      "CPU không có đồ họa tích hợp: cần chọn VGA.",
      ["cpu", "gpu"],
      false,
    );
  if (psu) {
    const powerScope: readonly Slot[] = ["psu", "cpu", "gpu"];
    if (
      !cpu ||
      !positive(psu.technical.watts) ||
      !positive(cpu.technical.watts) ||
      (gpu && !positive(gpu.technical.watts)) ||
      (!gpu && cpu.technical.integrated !== true)
    )
      add(
        "warning",
        "Chưa đủ dữ liệu công suất để kết luận nguồn phù hợp.",
        powerScope,
      );
    else {
      const required =
        (80 + cpu.technical.watts + (gpu?.technical.watts ?? 0)) * 1.3;
      if (!Number.isFinite(required))
        add(
          "warning",
          "Dữ liệu công suất vượt phạm vi tính toán; cần đối chiếu lại.",
          powerScope,
        );
      else if (psu.technical.watts < required)
        add(
          "error",
          "Nguồn chưa đủ khoảng dự phòng 30% theo ước tính demo.",
          powerScope,
          true,
        );
      else
        add("ok", "Nguồn đủ khoảng dự phòng theo ước tính demo.", powerScope);
    }
  }
  checks.push({
    level: "warning",
    message:
      "Chưa xác minh BIOS, đầu cấp nguồn, lane M.2 và khoảng hở thực tế. Ảnh dựng chỉ minh họa.",
    blocksSelection: false,
  });
  return checks;
}

export function getCandidateCompatibility(
  build: Build,
  slot: Slot,
  candidate: Product,
  lookup: Lookup,
): {
  errors: Check[];
  warnings: Check[];
  disabled: boolean;
} {
  if (!normalized(candidate.id))
    return {
      errors: [
        {
          level: "error",
          message: "Linh kiện chưa có mã định danh khả dụng.",
          slots: [slot],
          blocksSelection: true,
        },
      ],
      warnings: [],
      disabled: true,
    };
  const checks = checkBuild({ ...build, [slot]: candidate.id }, (id) =>
    id === candidate.id ? candidate : lookup(id),
  );
  const related = checks.filter((check) => check.slots?.includes(slot));
  const errors = related.filter(
    (check) => check.level === "error" && check.blocksSelection === true,
  );
  const warnings = related.filter((check) => check.level === "warning");
  return { errors, warnings, disabled: errors.length > 0 };
}

export const estimateWatts = (build: Build, productById: Lookup) => {
  const cpu = productById(build.cpu ?? "")?.technical.watts;
  const gpu = productById(build.gpu ?? "")?.technical.watts;
  return 80 + (positive(cpu) ? cpu : 0) + (positive(gpu) ? gpu : 0);
};
export const missingSlots = (build: Build, productById: Lookup) =>
  slots.filter(
    (s) =>
      (!build[s] ||
        !productById(build[s]!)?.builderEligible ||
        productById(build[s]!)?.category !== s) &&
      (s !== "gpu" || !productById(build.cpu ?? "")?.technical.integrated),
  );
