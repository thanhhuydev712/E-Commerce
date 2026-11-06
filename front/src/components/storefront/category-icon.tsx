import {
  Cpu,
  Fan,
  Gamepad2,
  HardDrive,
  Laptop,
  MemoryStick,
  Monitor,
  PcCase,
  Zap,
  CircuitBoard,
  Mouse,
  Headphones,
  Armchair,
  Table2,
  Camera,
  Printer,
  Network,
  Cable,
  AppWindow,
  Projector,
  Webcam,
} from "lucide-react";
// Component độc lập; nhận dữ liệu qua props, không truy cập API thật.
export function CategoryIcon({ id, size = 22 }: { id: string; size?: number }) {
  const Icon =
    (
      {
        pc: PcCase,
        laptop: Laptop,
        cpu: Cpu,
        mainboard: CircuitBoard,
        gpu: CircuitBoard,
        ram: MemoryStick,
        ssd: HardDrive,
        monitor: Monitor,
        gear: Gamepad2,
        case: PcCase,
        psu: Zap,
        cooler: Fan,
        hdd: HardDrive,
        mouse: Mouse,
        headset: Headphones,
        chair: Armchair,
        desk: Table2,
        fan: Fan,
        camera: Camera,
        webcam: Webcam,
        printer: Printer,
        ups: Zap,
        network: Network,
        accessory: Cable,
        software: AppWindow,
        projector: Projector,
      } as Record<string, typeof Cpu>
    )[id] ?? Cpu;
  return <Icon size={size} strokeWidth={1.5} />;
}
