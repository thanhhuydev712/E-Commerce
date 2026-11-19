import type { Slot } from "../../src/features/pc-builder/lib/compatibility";

// Exercise every visual slot while respecting actual socket, DDR and case limits.
// Switching platform requires removing the old CPU/RAM before selecting the new board.
export const compatibleAssemblySteps: {
  slot: Slot;
  slug: string;
  remove?: Slot[];
}[] = [
  { slot: "cpu", slug: "ryzen-7700" },
  { slot: "mainboard", slug: "gigabyte-b650" },
  { slot: "mainboard", slug: "asus-b760", remove: ["cpu", "ram"] },
  { slot: "cpu", slug: "intel-14400f" },
  { slot: "ram", slug: "ram-ddr4" },
  { slot: "gpu", slug: "rtx-4070" },
  { slot: "ssd", slug: "ssd-samsung" },
  { slot: "psu", slug: "psu-750" },
  { slot: "cooler", slug: "cooler-assassin" },
  { slot: "gpu", slug: "rtx-4060" },
  { slot: "case", slug: "case-mini" },
];
