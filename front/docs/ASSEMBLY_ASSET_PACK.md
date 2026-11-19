# Bộ ảnh lắp PC theo SKU — 19/11/2026

## Mục tiêu và trạng thái thật

Sửa trạng thái case trống ngày 19/11: `public/images/pc-assembly/manifest.json` đã có **2 profile case và 76 entry cho 16 sản phẩm linh kiện**, liên kết 18 tên PNG riêng `/images/pc-assembly/{slug}-v1.png`. Các ảnh được dựng bằng imagegen tích hợp theo từng sản phẩm; bộ ảnh không lấy fixture SVG của kiểm thử để chạy thật. Trạng thái manifest rỗng trước đó là lịch sử.

Bộ hiện tại dùng **`verified: false`, `illustrative: true`**. Đây là ảnh dựng minh họa theo lựa chọn, chưa chứng nhận ngoại hình, màu hay kích thước lắp thật. Viewport ghi “Ảnh dựng minh họa · Chưa xác minh tỷ lệ lắp thực tế”. Nguồn/prompt được quản lý ở `public/images/pc-assembly/SOURCES.json`; `sourceUrl` trỏ đúng `/images/pc-assembly/SOURCES.json`, không dùng link HTTPS bịa hoặc ngụ ý nguồn hãng. Tiến độ đủ file và kết quả kiểm cuối xem [PROJECT_STATUS](../../docs/PROJECT_STATUS.md).

Đã lưu đủ 18 PNG riêng cho hai case và 16 linh kiện. Chạy `node scripts/measure-assembly-cutouts.mjs` trong `front/` để đo lại alpha khi thay ảnh. Script chỉ đọc pixel để ghi `crop` và `aspectRatio` vào manifest, không sửa bitmap hay kích thước vật lý. Wrapper giữ tỷ lệ ảnh trong vị trí lắp, tránh khoảng trong suốt khiến RAM/tản/GPU trông quá nhỏ. PNG được Next Image tối ưu khi phục vụ; SVG chỉ phục vụ các fixture kiểm thử.

Xác nhận tiếp ngày 19/11: **case phải theo chính sản phẩm đang chọn**, không chọn một chassis chung cho mọi cấu hình. Mỗi sản phẩm case cần profile/bộ ảnh riêng; đổi case sẽ resolve lại mọi lớp theo profile mới. Chọn cùng tên nhóm hoặc case gần giống không đủ để tái sử dụng ảnh.

Ảnh `reference-concept-v1.png` là bản ý tưởng tạo bằng imagegen tích hợp trong cuộc trao đổi (tham chiếu RTX 5070 FE và DeepCool AG400 BK ARGB). Chỉ mở trong dialog “Xem mẫu phối cảnh”, ghi rõ không phải cấu hình đang chọn và chưa xác minh tỷ lệ. Hai sản phẩm đó chưa có trong catalog; không ánh xạ nhầm sang RTX 4060/AK400 Digital.

## Luồng chạy

`build[slot]` → Product từ CatalogProvider → `product.slug` + `variants[0].sku` → manifest bộ ảnh → profile case → cutout đúng SKU và vị trí lắp của profile đó.

- Ảnh catalog chỉ phục vụ chi tiết/inspector/picker. Không lấy hộp sản phẩm đặt vào case.
- `assembled-layers.tsx` tải manifest cùng origin. JSON lỗi/thiếu phiên bản/không có bộ ảnh thì hiển thị trạng thái thiếu, giữ nguyên cấu hình và giá.
- `assembly-visuals.ts` nhận hai tầng: `verified: true` với nguồn HTTPS, hoặc `verified: false` + `illustrative: true`. Chỉ tầng minh họa được dùng đường dẫn provenance local chính xác nêu trên. Cả hai vẫn bắt buộc binding slug/SKU/case, file local trong `/images/pc-assembly/`, số đo dương/hữu hạn, tọa độ hợp lệ; không dò theo category hoặc fallback sang SKU khác.
- Mỗi case dùng ảnh mở hông riêng. Các lớp đặt trên một canvas chuẩn; `aperture` giới hạn cửa sổ nhìn, `foregroundSrc` che lại khung/shroud. `maskSrc` là mặt nạ alpha riêng của linh kiện nếu cần.
- `requires` khóa vị trí theo SKU linh kiện liên quan. Bộ minh họa có entry CPU/RAM/GPU/SSD/tản cho từng SKU của ba mainboard, nên thay mainboard sẽ resolve lại entry tương ứng; đổi case đổi profile. Binding thiếu/không khớp sẽ gỡ lớp cũ. Layout minh họa dùng chung không chứng minh cấu hình tương thích cơ khí.
- `hiddenBy` khai báo phần bị che hoàn toàn; ví dụ CPU bị tản che. Chế độ tách hoặc tập trung cho xem riêng, không giả vờ CPU vẫn lộ ra ngoài bộ máy đã lắp.
- Lỗi ảnh gắn với profile + SKU + URL; không giữ ảnh của linh kiện trước. Lỗi case/foreground sẽ gỡ cả các lớp phụ thuộc. Không đổi màu ảnh bằng filter khi chọn màu nền.

Build hiện giữ product ID và dùng biến thể đầu cho giỏ; renderer tuân thủ cùng lựa chọn. Chưa thêm picker biến thể/màu mới vào nghiệp vụ. Một SKU màu trắng không được dùng ảnh SKU đen. CSS chỉ nghiêng ảnh nhẹ, không tạo góc chụp mặt sau hoặc 360°; không cài lại dependency 3D.

## Điều kiện để nâng lên ảnh đã xác minh

Các yêu cầu sau áp dụng khi chuyển sang `verified: true`; ảnh AI hiện tại và số đo ước lượng không đáp ứng thay cho tư liệu thật.

1. Tên model đầy đủ, màu và mã SKU đúng catalog; ảnh có quyền sử dụng và link nguồn/ghi nhận duyệt.
2. Case: ảnh mở hông đã bỏ linh kiện, ảnh khung/shroud phía trước nếu cần, kích thước và hệ tọa độ. Không lấy ảnh case của hãng khác cho tên RIGFORGE giả định.
3. Linh kiện: ảnh nền trong suốt ở **góc lắp tương ứng**, không phải ảnh hộp; đủ bề mặt cần thấy. Kích thước rộng/cao/sâu thực tính bằng mm. Một ảnh thiếu góc không đủ để xác minh các mặt bị khuất.
4. Hiệu chuẩn điểm lắp và phối cảnh trên từng case/mainboard. Pixel ảnh không phải mm; không kéo giãn GPU hoặc tô RGB cho quạt cũ để giả model mới.
5. Đối chiếu với ảnh bộ máy lắp thật, kiểm che khuất và màu. `verified` là xác nhận duyệt thủ công, không phải thuật toán chứng nhận ảnh chính xác hay kiểm cơ khí.

## Cấu trúc manifest

File ảnh phục vụ từ `front/public/images/pc-assembly/`. Profile case dùng toàn canvas; `aperture` và `placement` dùng phần trăm canvas bố cục. `dimensionsMm` của tầng minh họa là ước lượng phục vụ bố cục, không phải số đo mm đã xác minh; renderer không tự suy vị trí từ chúng.

`crop` tùy chọn của part là vùng alpha thật, tính theo phần trăm canvas PNG gốc. Renderer dùng wrapper clip và dịch/phóng ảnh theo metadata; không sửa hay cắt bitmap. Placement cần giữ tỷ lệ vùng alpha. Case không dùng crop để bảo toàn hệ tọa độ lắp. PNG tiếp tục qua Next Image; SVG fixture không tối ưu.

```json
{
  "version": 1,
  "cases": [
    {
      "id": "case-model-black-side-v1",
      "productSlug": "slug-case-trong-catalog",
      "variantSku": "SKU-CASE-DUNG-MAU",
      "src": "/images/pc-assembly/case-model/side-v1.webp",
      "foregroundSrc": "/images/pc-assembly/case-model/frame-v1.webp",
      "aperture": { "x": 8, "y": 8, "width": 84, "height": 84 },
      "dimensionsMm": { "width": 400, "height": 450, "depth": 220 },
      "verified": false,
      "illustrative": true,
      "sourceUrl": "/images/pc-assembly/SOURCES.json"
    }
  ],
  "parts": [
    {
      "productSlug": "slug-gpu-trong-catalog",
      "variantSku": "SKU-GPU-DUNG-MODEL",
      "slot": "gpu",
      "caseProfileId": "case-model-black-side-v1",
      "src": "/images/pc-assembly/gpu-model/installed-side-v1.webp",
      "placement": { "x": 15, "y": 62, "width": 65, "height": 13 },
      "zIndex": 7,
      "dimensionsMm": { "width": 242, "height": 112, "depth": 40 },
      "requires": { "mainboard": "SKU-MAINBOARD-DA-HIEU-CHUAN" },
      "verified": false,
      "illustrative": true,
      "sourceUrl": "/images/pc-assembly/SOURCES.json"
    }
  ]
}
```

Ví dụ trên giải thích schema, không thay manifest thật. `verified: false` không có `illustrative: true` vẫn bị từ chối. `maskSrc` và `hiddenBy: ["cooler"]` là tùy chọn ở part; bộ hiện tại che CPU khi có tản. Z-index part nằm trong 0–50, foreground case ở 60. Mỗi profile cần ID riêng; thay asset dùng tên/version mới tránh cache.

## Phạm vi bộ ảnh minh họa

Đã đọc API Docker lab `GET /api/v1/storefront` ngày 19/11/2026, có 18 sản phẩm builder. SKU mặc định hiện là `DEMO-{slug}-standard`. Đây là dữ liệu phát triển, không phải catalogue kinh doanh đã xác minh.

| Nhóm      | Slug có binding trong manifest             |
| --------- | ------------------------------------------ |
| Case      | `case-air`, `case-mini`                    |
| Mainboard | `msi-b650`, `asus-b760`, `gigabyte-b650`   |
| CPU       | `ryzen-7600`, `ryzen-7700`, `intel-14400f` |
| RAM       | `ram-ddr5`, `ram-ddr4`                     |
| GPU       | `rtx-4060`, `rtx-4070`                     |
| SSD       | `ssd-kingston`, `ssd-samsung`              |
| PSU       | `psu-650`, `psu-750`                       |
| Tản       | `cooler-ak400`, `cooler-assassin`          |

Seed thiếu nhiều số đo thực; GPU length và case clearance hiện có chỉ là dữ liệu demo. [Đối chiếu ảnh catalog](PRODUCT_IMAGE_AUDIT.md) còn ghi ảnh sai model. Chưa sửa seed/DB, chưa thêm SKU của hai mẫu preview vào giỏ/catalog.

## Nghiệm thu một bộ ảnh

Đổi từng linh kiện phải đổi đúng `data-variant-sku`/`data-assembly-src`; đổi case/mainboard phải resolve đúng entry hoặc báo thiếu. Kiểm CPU bị che/tách, crop/placement, ảnh thiếu/lỗi, đổi tiếp sang sản phẩm có ảnh, bỏ/hoàn tác, bàn phím, mobile, reduced motion và không tạo WebGL. Cơ chế chạy đúng không xác nhận hình học, màu hay độ chính xác mm của ảnh AI.

Test `assembly-visuals.spec.ts` kiểm resolver; `assembled-builder.spec.ts` kiểm tám nhóm, clipping/foreground/occlusion và lỗi manifest. `tests/support/assembly-fixtures.ts` mock ảnh SVG + metadata **chỉ trong browser test**, không được dùng làm bộ ảnh thật. Test xanh xác nhận cơ chế, không chứng nhận ngoại hình/tỷ lệ của sản phẩm chưa có tư liệu.

Đã kiểm bằng manifest/PNG thực: case Mini + MSI với hai lớp, cấu hình đề xuất có bảy lớp nhìn thấy (CPU bị tản che), tách đủ tám và đổi cả tám nhóm, đổi case cùng kiểm mobile không cắt case/tràn ngang. **53 kiểm tra có mục tiêu qua** gồm 29 resolver/file-asset và 24 Chromium; report `front/.visual-review/assembly-assets/core-results.json` và `readiness-results.json`. Ảnh chụp thật ở `core-output/`; kết quả này xác nhận bộ ảnh hiển thị và đổi lớp, không xác minh hình học/mm. Kết quả 45 test/manifest rỗng của lượt trước là lịch sử.

Khi có bộ ảnh đã duyệt, thêm file và manifest, kiểm lại rồi phát hành asset cùng frontend. Đây chưa phải workflow upload/quản trị ảnh lắp; upload media catalog hiện không tự ghi vào manifest. Giữ `PREVIEW_READ_ONLY`, không mở quyền ghi trên public showcase để nạp ảnh. Xem kết quả và giới hạn tại [PROJECT_STATUS](../../docs/PROJECT_STATUS.md).
