# Ảnh sản phẩm và ảnh ghép PC — 19/11/2026

Theo yêu cầu mới nhất, chi tiết nghiêng nhẹ ảnh phẳng; PC Builder ghép **bộ máy lắp bên trong case**, dùng bộ cutout riêng theo SKU/case. Ngày 19/11 đã sửa trạng thái trống bằng manifest gồm 2 case, 16 sản phẩm linh kiện và 76 entry, gắn 18 tên PNG dựng bằng imagegen tích hợp. Không còn renderer WebGL, model GLB hay chế độ 3D. Three.js, React Three Fiber, Drei và types Three đã được gỡ khỏi package/lockfile. [Contract và bộ ảnh](ASSEMBLY_ASSET_PACK.md).

## Luồng dữ liệu

`GET /api/v1/storefront` → CatalogProvider → `Product.image` cho chi tiết/inspector/picker. Ảnh lắp dùng slug + SKU mặc định để resolve `public/images/pc-assembly/manifest.json`.

- Chi tiết: `ProductGallery` → `PhotoTilt` → `ProductImage`. Rê chuột hoặc kéo ảnh để nghiêng tối đa 5° dọc/7° ngang; phím mũi tên chỉnh góc, Home đặt lại. Phóng to ảnh vẫn dùng Dialog. Reduced motion giữ ảnh đứng yên. Hiệu ứng CSS không tạo góc chụp mặt sau hay xoay 360°.
- PC Builder: `build[slot]` → `productById` → binding slug/SKU + profile case → ảnh lắp/điểm neo/thứ tự lớp/mặt nạ. Bộ hiện tại là `verified: false`, `illustrative: true`, có nhãn chưa xác minh tỷ lệ. Không dùng bảng ô ảnh, ảnh catalog hay ảnh chung theo nhóm đặt vào case. Đổi case/mainboard sẽ resolve entry tương ứng; thiếu binding sẽ gỡ ảnh cũ và báo thiếu.
- Ảnh catalog lỗi/thiếu hiện placeholder. Ảnh lắp chưa có/lỗi sẽ bỏ lớp đó, giữ lựa chọn và báo thiếu tư liệu. Lỗi case hoặc foreground sẽ gỡ các lớp phụ thuộc. Không lấy ảnh chung thay sản phẩm.
- Tách linh kiện, tập trung, preset góc, zoom, giảm chuyển động vẫn hoạt động trên ảnh. “Làm mờ case” chỉ giảm độ rõ ô case; “Bật nền sáng” chỉ đổi nền trình diễn. Giá, tương thích, lưu cấu hình và giỏ dùng luồng hiện có.

Manifest runtime đã có bộ minh họa; chưa có bộ ảnh/số đo lắp thật được xác minh. Nguồn/prompt ở `public/images/pc-assembly/SOURCES.json`, không dùng link hãng giả. Tầng `verified: true` vẫn cần tư liệu thật và nguồn HTTPS. `crop` ghi vùng alpha PNG, renderer clip bằng wrapper theo metadata và giữ tỷ lệ placement; không cắt bitmap, không crop case. Nút “Xem mẫu phối cảnh” vẫn chỉ mở ý tưởng độc lập, không giả thành lựa chọn đang xem. Ảnh catalog còn dữ liệu mẫu sai model; xem [đối chiếu ảnh](PRODUCT_IMAGE_AUDIT.md).

Đã kiểm bằng PNG thật: case Mini + MSI, cấu hình đủ nhóm, đổi tám nhóm và đổi case, CPU che/tách, mobile không cắt case. Tổng 53 kiểm tra có mục tiêu qua ngày 19/11; report `front/.visual-review/assembly-assets/core-results.json` + `readiness-results.json`. Đây là kiểm hiển thị/tương tác, không xác minh kích thước cơ khí; xem [PROJECT_STATUS](../../docs/PROJECT_STATUS.md).

## Cách bổ sung ảnh đúng sản phẩm

Thực hiện ở môi trường development/quản trị cho phép ghi. Public showcase dùng `PREVIEW_READ_ONLY` chặn upload/cập nhật; giữ nguyên chốt này.

1. Chuẩn bị ảnh rõ, có quyền sử dụng, đối chiếu hãng + mã model + màu/biến thể. Ưu tiên ảnh nền trắng/trong suốt, sản phẩm nằm trọn khung.
2. Gán ảnh vào media của đúng sản phẩm qua luồng quản trị catalog/media; không hardcode ảnh theo nhóm trong frontend. `seed-storefront.cjs` chỉ dành cho dữ liệu phát triển, không chạy lại seed để sửa DB đang dùng.
3. Kiểm API storefront trả `image` mới cho đúng ID. Chi tiết/inspector/picker cập nhật sau khi catalog nạp lại. Ảnh lắp cần bộ cutout và manifest riêng theo [hướng dẫn bộ ảnh](ASSEMBLY_ASSET_PACK.md); upload catalog không tự làm ảnh lắp. Dùng URL/version mới khi thay nội dung để tránh cache ảnh cũ.
4. Kiểm hai sản phẩm khác nhau cùng nhóm có ảnh phù hợp; đổi qua lại trong builder, thử bỏ/hoàn tác và kiểm mobile. Nếu thiếu ảnh đúng model, giữ placeholder thay vì ảnh gần giống.

API hiện có `POST /api/v1/admin/media` nhận multipart `file` (PNG/JPEG, tối đa 5 MB, cần quyền `media.write`). Sau khi upload, lấy `data.id` làm `assetId` để gọi `POST /api/v1/admin/products/{productId}/media` với quyền `catalog.write`, `isPrimary: true`, `sortOrder: 0` và `altText` đúng sản phẩm. Không gửi token vào tài liệu/chat. Đây là hướng dẫn theo controller/service hiện có; chưa thực hiện upload hay thay ảnh DB trong lượt này.

Hiện snapshot/frontend dùng một ảnh cấp sản phẩm. Backend đã hỗ trợ liên kết media với `variantId`; nếu nhiều biến thể có ngoại hình khác nhau cần nối dữ liệu đó vào snapshot/gallery trước khi có thể đảm bảo ảnh đúng từng SKU. Gallery ghi rõ khi nhiều biến thể dùng chung ảnh. Không có pipeline tự biến một ảnh thành ảnh mặt sau hay model.

## File và kiểm tra

| File                                                      | Vai trò                                                 |
| --------------------------------------------------------- | ------------------------------------------------------- |
| `src/components/storefront/photo-tilt.tsx`                | Tương tác nghiêng ảnh chi tiết, bàn phím/reduced motion |
| `src/components/storefront/product-art.tsx`               | ProductImage và placeholder ảnh lỗi/thiếu               |
| `src/features/catalog/product-gallery.tsx`                | Gallery và phóng to ảnh                                 |
| `src/features/pc-builder/components/assembled-layers.tsx` | Ghép bộ máy theo profile, clipping/che khuất và ảnh lỗi |
| `src/features/pc-builder/lib/assembly-visuals.ts`         | Resolver ảnh lắp theo SKU/case, metadata hợp lệ         |
| `src/features/pc-builder/components/photo-assembly.tsx`   | Điều khiển góc/zoom/inspector và lựa chọn               |
| `src/features/pc-builder/components/photo-assembly.css`   | Phép chiếu/chuyển tiếp ảnh                              |
| `tests/e2e/product-photos.spec.ts`                        | Tilt, mobile, đổi GPU/case, phục hồi sau lỗi ảnh        |

`pc-scene.tsx` chỉ còn module rỗng: Windows từ chối xóa file do quyền sở hữu. Toàn bộ mã Three và đường import đã gỡ; file này không chạy và không giữ dependency. Không thay quyền toàn thư mục để xử lý một file.

Kết quả kiểm tra thực tế và giới hạn xem [PROJECT_STATUS](../../docs/PROJECT_STATUS.md).
