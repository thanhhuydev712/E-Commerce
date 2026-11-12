# PC Studio: ghép ảnh linh kiện — 08/11/2026

## Trải nghiệm

Tab **Ảnh ghép** là chế độ mặc định: tám lớp ảnh tách nền tạo thành một bộ máy, có góc nghiêng nhẹ, phóng to/thu nhỏ, mở kính và tách/lắp linh kiện. Chọn một lớp hoặc nút nhóm phía dưới để xem sản phẩm đang chọn, giá và mở picker thay linh kiện. Khu vực xem máy nằm trước danh sách cấu hình; inspector xuống dưới trên màn hình nhỏ. Tab **3D** giữ mô hình hình học và OrbitControls hiện có, được tải động khi mở.

Ảnh ghép dùng phép chiếu CSS có chiều sâu (2.5D), không phải mô hình có thể xoay 360 độ. Các lớp chỉ xuất hiện khi slot có sản phẩm còn hợp lệ trong catalog; nguồn dữ liệu cấu hình, giá và tương thích vẫn là CatalogProvider/ShopProvider. Không lưu thêm cấu hình vào localStorage hoặc tạo catalog giả.

## Nâng cấp trình diễn — 12/11/2026

- Sub-agent `frontend` nâng cảnh Three.js trong `components/pc-scene.tsx`: khung/đường thoáng/vít case, lớp kính, mạch PCB/VRM/heatsink, quạt và VGA chi tiết hơn, dây nguồn có điều kiện theo linh kiện đang có, đế showroom cùng ánh sáng studio. Tất cả là geometry local, không tải model/HDR hoặc thêm dependency.
- Thanh xem chung có ba preset góc và ba màu LED. Camera/OrbitControls được cập nhật trên canvas hiện hành; đổi preset hoặc reset không cấp lại WebGL context. Bản ghép ảnh nhận cùng preset/màu; chỉ nghiêng trong giới hạn do nguồn là ảnh phẳng, không mô tả là xoay 360 độ.
- Ảnh ghép có bố cục tách riêng từng nhóm và nhãn để CPU/SSD không bị lớp lớn che; chế độ **Tập trung linh kiện** làm mờ lớp khác, giữ bộ linh kiện đã chọn. Reset góc/zoom không remount editor hoặc xóa nhóm đang xem.
- Inspector dưới 1100 px dùng ảnh và nội dung cạnh nhau để giảm chiều dài cuộn. Phần đầu builder dùng hướng dẫn gọn ba bước, đưa khu vực xem máy lên sớm hơn.
- Giữ render theo nhu cầu, ánh sáng khi giảm chuyển động, xử lý ảnh/WebGL lỗi và cảnh rỗng. Preset/màu/focus là trạng thái trình diễn, không đổi giá, kiểm tương thích, API hoặc dữ liệu cấu hình đã lưu.

## Tinh chỉnh góc 3/4 và RGB theo phản hồi — 12/11/2026

Camera thấp hơn và hướng về mặt kính, tự fit các góc của máy/đế theo tỷ lệ viewport và chế độ tách. Vật liệu kim loại/kính nhận phản xạ từ bốn softbox dựng cục bộ bằng Environment/Lightformer (capture một frame), không tải HDR qua mạng. Chỉ bo cạnh các khối lớn; trace PCB và chi tiết nhỏ giữ geometry nhẹ. Đế mỏng hơn và bỏ bóng sàn polygon cứng; caption nằm dưới vùng render.

Màu LED bão hòa riêng cho ba theme, halo quạt là shader tĩnh; nền navy có halo CSS chuyển mềm khi bật nguồn. Không thêm hoạt ảnh idle liên tục. Container studio có `w-full` để canvas co lại khi đổi desktop → mobile. Ca hình ảnh kiểm màu trên canvas với halo CSS bị ẩn tạm trong phép đo, đồng thời kiểm console không có lỗi shader và resize không thay canvas. Kết quả UI dùng fixture public chỉ đọc do hostname DB test không phân giải được trong lượt này; không xem đây là kiểm FE–BE. Bằng chứng cuối ở PROJECT_STATUS.

## Nguồn ảnh và giới hạn

- Tám asset WebP trong `public/images/pc-studio/`: `case`, `mainboard`, `cpu`, `ram`, `ssd`, `psu`, `gpu`, `cooler`.
- Tạo bằng công cụ **image_gen tích hợp**, yêu cầu alpha trong suốt, cùng góc nhìn, linh kiện đen trung tính, không hộp/nhãn/thương hiệu. Đây là hình minh họa theo nhóm, **không phải ảnh đúng từng SKU**. Ảnh catalog gốc vẫn xuất hiện ở inspector và picker.
- PNG gốc được giữ ở thư mục generated_images của công cụ. Asset phục vụ website được trim khoảng trong suốt, giảm kích thước và nén WebP bằng Sharp, giữ alpha; tổng dung lượng khoảng 493 KiB trước tối ưu ảnh của Next. Không sửa/ghi đè ảnh catalog.
- Không dùng hình minh họa để quyết định socket, công suất hoặc kích thước vừa case. Kiểm tra tương thích tiếp tục nằm trong `lib/compatibility.ts`; chưa mô phỏng dây, va chạm hay clearance thực.
- Muốn phản ánh đúng ngoại hình từng SKU cần bộ cutout riêng cùng góc chụp, dữ liệu ánh xạ asset và điểm neo/tỷ lệ theo chassis. Không thể ghép chính xác các ảnh catalog có hộp và góc chụp tùy ý chỉ bằng xóa nền.

## Cài đặt

`components/photo-assembly.tsx` đọc build đã lọc, đặt lớp theo tọa độ tương đối và thứ tự chiều sâu, giữ state góc nhìn/zoom/nhóm đang xem riêng khỏi state nghiệp vụ. `photo-assembly.css` chỉ chứa phép chiếu, kính và keyframe nhiều lớp; bố cục và controls dùng Tailwind v4. Stylesheet được import từ `app/globals.css` với tên class có prefix riêng, phù hợp loader Tailwind hiện có; không dựa vào CSS Modules export của loader này.

Ảnh lỗi có icon/tên nhóm thay thế và không xóa lựa chọn. Kéo vùng trống thay đổi góc nghiêng trong giới hạn; không chiếm thao tác cuộn dọc trên touch. Có nút chính diện/zoom cho bàn phím, nút lớp có nhãn, và giảm chuyển động tắt animation/transition của phép ghép. Nguồn bật tạo ánh sáng minh họa tĩnh, không tạo vòng lặp render liên tục. Khi WebGL không khả dụng, chế độ 3D quay về bản ghép ảnh và giữ build.

## Bộ prompt cuối

Các asset được tạo độc lập, không chỉnh ảnh catalog thành sản phẩm khác. Prompt case:

> Use case: product-mockup. Create a premium photorealistic isolated cutout asset for a PC assembly configurator website. Subject: one EMPTY black mid-tower PC chassis, perfectly straight-on left SIDE view, camera at window height, orthographic lens with almost no perspective. The large open side faces viewer, front of case at RIGHT edge with a narrow deep metal front column containing three unlit fans, PSU compartment at bottom. REMOVE glass side panel. Interior is empty matte charcoal metal motherboard tray; no motherboard, no GPU, no RAM, no CPU cooler, no PSU, no cables. Thin black metal frame, realistic screws, ventilation, brushed metal, crisp professional studio light. Entire case visible, centered, occupies 90% of square canvas height. Genuine transparent alpha outside silhouette, no floor or cast shadow outside silhouette. Interior tray remains dark solid so other cutouts can be layered on top. NO text, labels, logos, brands, hands, packaging, surrounding objects, colored RGB glow. This is a generic illustrative chassis, not an exact commercial SKU.

Với bảy asset còn lại, ghép prefix + subject tương ứng + suffix dưới đây:

**Prefix:** `Use case: product-mockup. Create a single production-quality photorealistic cutout layer for a PC assembly configurator.`

| File | Subject |
| --- | --- |
| mainboard.webp | ONE black ATX computer motherboard, viewed exactly straight-on perpendicular to the board, rear IO at LEFT, CPU socket EMPTY upper center, four empty DIMM slots on RIGHT, empty PCIe slots below, two dark angular heatsinks, intricate black PCB and silver connectors, photorealistic. No CPU, RAM, GPU or packaging. Portrait orientation entire board centered occupying 90% of square canvas height. |
| gpu.webp | ONE black high-end computer graphics card, SIDE ELEVATION as installed horizontally in a tower, connectors/metal bracket at LEFT, long black side shroud with a thin silver stripe, a glimpse of three cooling fans along lower edge. Wide horizontal aspect product. Entire card centered occupying 90% of square canvas width. Photorealistic real metal and molded plastic, absolutely no box. |
| ram.webp | ONE pair of two slim black RGB DDR5 RAM memory sticks, standing VERTICALLY in parallel side by side as installed in motherboard slots, flat straight-on view, cool white translucent light bars at their tops/right edges UNLIT, gold contacts at bottom, realistic matte black aluminum. Portrait narrow assembly centered occupying 90% of square canvas height. No box. |
| cooler.webp | ONE premium black CPU tower air cooler, front orthographic view, square 120mm black cooling fan facing directly towards viewer, dense realistic silver aluminum cooling fins behind fan, metal heatpipes at bottom. Entire cooler isolated centered occupying 85% of square canvas height. No CPU/motherboard, no packaging. Photorealistic. |
| cpu.webp | ONE desktop CPU processor, top orthographic view, square silver brushed metal heat spreader with a slim dark green circuit board rim, perfectly aligned horizontal and vertical edges, tiny subtle machining details, NO readable text or branding. Entire square processor centered occupying 80% of square canvas. Photorealistic. |
| ssd.webp | ONE M.2 NVMe SSD drive with matte black metal heatspreader, straight-on top orthographic view, HORIZONTAL long narrow drive with gold connector at RIGHT and screw notch at LEFT. Fine subtle machined heatsink grooves. Photorealistic. Entire drive centered occupying 90% of square canvas width. No packaging. |
| psu.webp | ONE black modular desktop PC power supply, SIDE ELEVATION as installed horizontally in bottom compartment, broad rectangular brushed black metal side panel with subtle ventilation and silver screws, grille at LEFT, cables absent. Photorealistic entire PSU centered occupying 90% square canvas width. NO packaging. |

**Suffix:** `Soft neutral professional studio lighting matching dark charcoal PC chassis. Genuine transparent alpha background, no floor, no external cast shadows, no surrounding objects, no labels, NO text, logos, brand marks, watermark, RGB glow. This image will be overlaid inside a black computer case; precise clear silhouette is essential. Generic illustrative component, not a commercial SKU.`

## Kiểm chứng

Ca mới ở `tests/e2e/photo-assembly.spec.ts`; runtime/readiness được cập nhật để WebGL fallback về ảnh ghép. Kết quả cuối, artifact và giới hạn môi trường ghi trong [PROJECT_STATUS](../../docs/PROJECT_STATUS.md).
