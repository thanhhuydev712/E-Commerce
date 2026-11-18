# Đối chiếu ảnh catalog — 18/11/2026

Đổi ảnh trong PC Builder đã lấy theo ID sản phẩm thay vì theo nhóm. Tuy nhiên dữ liệu phát triển còn gán ảnh khác model cho một số sản phẩm. Không được xem việc URL đổi đúng là đã xác minh đúng ngoại hình SKU.

## Các trường hợp đã xác minh

| Sản phẩm trong catalog                | File gán hiện tại | Sản phẩm thể hiện trong nguồn ảnh |
| ------------------------------------- | ----------------- | --------------------------------- |
| ASUS RTX 4060 (`rtx-4060`)            | `gpu-1.webp`      | Gigabyte RTX 3050 Windforce 6GB   |
| MSI RTX 4070 SUPER (`rtx-4070`)       | `gpu-2.webp`      | ASUS Radeon RX 6500 XT            |
| Kingston Beast 32GB DDR5 (`ram-ddr5`) | `ram-1.webp`      | OCPC 8GB DDR4                     |
| Corsair LPX 16GB DDR4 (`ram-ddr4`)    | `ram-2.webp`      | VSP 16GB DDR5                     |
| RIGFORGE Airflow M                    | `case-1.webp`     | LinkTech Bahamut M                |
| RIGFORGE Compact                      | `case-2.webp`     | StarOffice CS600                  |

Đây là các ví dụ đã đối chiếu, không phải danh sách đầy đủ mọi ảnh cần duyệt. Case RIGFORGE là tên dữ liệu mẫu, chưa có ảnh sản phẩm thương mại được xác nhận.

## Bằng chứng và giới hạn

- Mapping nằm trong `api/prisma/seed-storefront.cjs`; thông tin nguồn tại `front/public/images/catalog/SOURCES.json`.
- Đã đọc API media tương ứng sáu trường hợp: HTTP 200, SHA-256 khớp file catalog local. Lỗi không đến từ proxy ảnh hay fallback frontend.
- Mỗi record đang có một media cấp sản phẩm, chưa có bộ ảnh theo biến thể. Không có ảnh đúng thay thế cho sáu mẫu này trong 18 ảnh GPU/RAM/case đã đối chiếu.
- Chưa sửa DB, seed, SKU, giá hay thông số để làm chúng khớp ảnh. Chưa tải/đăng ảnh thay thế chưa xác minh. UI tiếp tục có nhãn ảnh/dữ liệu minh họa.

## Cần bổ sung

Chuẩn bị ảnh đúng hãng/model/màu cho sản phẩm thực tế hoặc quyết định thay dữ liệu mẫu bằng danh mục thật. Gán media vào đúng product ID, đối chiếu API và kiểm cả chi tiết lẫn builder theo [hướng dẫn ảnh](PHOTO_ASSEMBLY.md). Nếu chưa có ảnh đúng, để thiếu ảnh để UI hiện placeholder; không dùng ảnh cùng nhóm để ngụ ý đó là sản phẩm thật.
