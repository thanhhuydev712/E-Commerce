# Logo trong khối thương hiệu — 17/11/2026

Asset được lưu tại `front/public/images/brands/`, phục vụ từ cùng origin, không hotlink và không dùng chữ/font thay logo. Giữ hình dáng/tỷ lệ/màu nguồn, không filter đổi màu. SVG được kiểm tra không có script, event handler, foreignObject hoặc tham chiếu tài nguyên ngoài. `next/image` dùng object-contain và unoptimized: tổng asset nhỏ, SVG/PNG không cần mã hóa lại qua image proxy.

| Hãng | File | Kích thước/viewBox | Nguồn |
| --- | --- | --- | --- |
| ASUS | `asus.svg` | 400 × 84 | [SVG trên website ASUS](https://www.asus.com/media/img/2017/images/n-logo-asus.svg), được tham chiếu trong [trang chủ ASUS](https://www.asus.com/) |
| AMD | `amd.svg` | 139.72 × 33.32 | [SVG header AMD](https://www.amd.com/content/dam/code/images/header/amd-header-logo.svg), bản trắng được giữ nguyên và đặt trên nền tối |
| MSI | `msi.png` | 155 × 65 | [Logo trên CDN MSI](https://storage-asset.msi.com/global/picture/image/icons/logo.png), được tham chiếu trong [trang chủ MSI](https://www.msi.com/); giới hạn khung rộng 144px để tránh phóng quá lớn ảnh raster |
| GIGABYTE | `gigabyte.svg` | 160 × 20.92 | SVG inline `GIGABYTECiLogo` trích nguyên từ [trang chủ GIGABYTE](https://www.gigabyte.com/), giữ nguyên path và màu mặc định đen |
| Kingston | `kingston.png` | 512 × 104 | [File Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Kingston_Technology_Corporation_logo.png), [file gốc](https://upload.wikimedia.org/wikipedia/commons/e/ef/Kingston_Technology_Corporation_logo.png); nguồn lưu trữ thay thế vì website Kingston trả 403 trong môi trường kiểm tra |
| Corsair | `corsair.svg` | 221.59 × 52.38 | [SVG từ CDN Corsair](https://cwsmgmt.corsair.com/img/reusable/corsair-logo.svg), được tham chiếu trong [trang chủ Corsair](https://www.corsair.com/us/en) |

Kingston: tác giả upload **2DEEPCOOL1**, ngày 04/09/2022; trang nguồn có nhãn [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) và PD-textlogo. File PNG giữ nguyên, không chỉnh sửa. Tên và nhãn hiệu thuộc chủ sở hữu tương ứng; việc hiển thị trong bản demo không xác nhận quan hệ đối tác/phân phối thực tế.

Không tạo logo bằng imagegen, không vẽ lại đường nét bằng tay. Các file preview nền sáng/tối chỉ phục vụ kiểm tra local trong `front/.visual-review/brands/`, không phải asset ứng dụng.
