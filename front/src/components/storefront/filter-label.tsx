import { SlidersHorizontal } from "lucide-react";
// Component độc lập; nhận dữ liệu qua props, không truy cập API thật.
export function FilterLabel() {
  return (
    <>
      <SlidersHorizontal size={16} /> Bộ lọc sản phẩm
    </>
  );
}
