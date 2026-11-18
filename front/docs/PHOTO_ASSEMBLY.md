# Ảnh sản phẩm và ảnh ghép PC — 18/11/2026

Theo yêu cầu mới nhất, website chỉ dùng ảnh phẳng: chi tiết nghiêng nhẹ theo chuột, PC Builder ghép ảnh của từng sản phẩm được chọn. Không còn renderer WebGL, model GLB hay chế độ 3D. Three.js, React Three Fiber, Drei và types Three đã được gỡ khỏi package/lockfile.

## Luồng dữ liệu

`GET /api/v1/storefront` → CatalogProvider → `Product.image`.

- Chi tiết: `ProductGallery` → `PhotoTilt` → `ProductImage`. Rê chuột hoặc kéo ảnh để nghiêng tối đa 5° dọc/7° ngang; phím mũi tên chỉnh góc, Home đặt lại. Phóng to ảnh vẫn dùng Dialog. Reduced motion giữ ảnh đứng yên. Hiệu ứng CSS không tạo góc chụp mặt sau hay xoay 360°.
- PC Builder: `build[slot]` → `productById` → `selectedProduct.image`. Mỗi ô ảnh có tên sản phẩm và giữ tỷ lệ gốc bằng `object-contain`. Chọn sản phẩm khác sẽ đổi nguồn ảnh; bỏ linh kiện sẽ bỏ ô tương ứng. Không còn dùng ảnh cố định `/images/pc-studio/{slot}.webp`, quạt hay kính giả lập.
- Ảnh lỗi/thiếu: hiển thị biểu tượng và “Chưa có ảnh sản phẩm”. Trạng thái lỗi được gắn với ID + URL ảnh, tránh ảnh cũ bị lỗi làm ảnh mới biến mất. Không lấy ảnh chung thay sản phẩm.
- Tách linh kiện, tập trung, preset góc, zoom, giảm chuyển động vẫn hoạt động trên ảnh. “Làm mờ case” chỉ giảm độ rõ ô case; “Bật nền sáng” chỉ đổi nền trình diễn. Giá, tương thích, lưu cấu hình và giỏ dùng luồng hiện có.

Đây là bảng ghép ảnh từng sản phẩm, **không phải ảnh bộ máy đã lắp**. Các ảnh catalog hiện còn dữ liệu mẫu gán sai model; xem [đối chiếu ảnh](PRODUCT_IMAGE_AUDIT.md). Việc lấy đúng `Product.image` chưa chứng nhận ảnh đúng SKU thật.

## Cách bổ sung ảnh đúng sản phẩm

1. Chuẩn bị ảnh rõ, có quyền sử dụng, đối chiếu hãng + mã model + màu/biến thể. Ưu tiên ảnh nền trắng/trong suốt, sản phẩm nằm trọn khung.
2. Gán ảnh vào media của đúng sản phẩm qua luồng quản trị catalog/media; không hardcode ảnh theo nhóm trong frontend. `seed-storefront.cjs` chỉ dành cho dữ liệu phát triển, không chạy lại seed để sửa DB đang dùng.
3. Kiểm API storefront trả `image` mới cho đúng ID. Chi tiết và PC Builder dùng cùng nguồn nên tự cập nhật sau khi catalog được nạp lại. Dùng URL/version mới khi thay nội dung để tránh cache ảnh cũ.
4. Kiểm hai sản phẩm khác nhau cùng nhóm có ảnh phù hợp; đổi qua lại trong builder, thử bỏ/hoàn tác và kiểm mobile. Nếu thiếu ảnh đúng model, giữ placeholder thay vì ảnh gần giống.

Hiện ảnh thuộc cấp sản phẩm; nếu nhiều biến thể có ngoại hình khác nhau cần bổ sung mapping media theo biến thể ở API/schema trước khi có thể đảm bảo ảnh đúng từng SKU. Gallery ghi rõ khi nhiều biến thể dùng chung ảnh. Không có pipeline tự biến một ảnh thành ảnh mặt sau hay model.

## File và kiểm tra

| File                                                    | Vai trò                                                 |
| ------------------------------------------------------- | ------------------------------------------------------- |
| `src/components/storefront/photo-tilt.tsx`              | Tương tác nghiêng ảnh chi tiết, bàn phím/reduced motion |
| `src/components/storefront/product-art.tsx`             | ProductImage và placeholder ảnh lỗi/thiếu               |
| `src/features/catalog/product-gallery.tsx`              | Gallery và phóng to ảnh                                 |
| `src/features/pc-builder/components/photo-assembly.tsx` | Ghép ảnh theo sản phẩm, đổi ảnh và trạng thái lỗi       |
| `src/features/pc-builder/components/photo-assembly.css` | Phép chiếu/chuyển tiếp ảnh                              |
| `tests/e2e/product-photos.spec.ts`                      | Tilt, mobile, đổi GPU/case, phục hồi sau lỗi ảnh        |

`pc-scene.tsx` chỉ còn module rỗng: Windows từ chối xóa file do quyền sở hữu. Toàn bộ mã Three và đường import đã gỡ; file này không chạy và không giữ dependency. Không thay quyền toàn thư mục để xử lý một file.

Kết quả kiểm tra thực tế và giới hạn xem [PROJECT_STATUS](../../docs/PROJECT_STATUS.md).
