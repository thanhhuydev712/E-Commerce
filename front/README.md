# Rigforge Frontend

Storefront Next.js App Router cho dự án E-Commerce. Landing tham khảo cấu trúc nội dung của Tin Học Ngôi Sao, giữ nhận diện Rigforge; catalog, tài khoản, giỏ, cấu hình PC và COD đã **nối API NestJS/PostgreSQL**. Dữ liệu development vẫn là dữ liệu giả phục vụ thử nghiệm; fixture frontend đã xoá sau khi test tích hợp qua.

## Chạy local

```powershell
# Từ thư mục front/
npm ci
npm run dev
```

Mở http://localhost:3000. Cần backend cổng 3001, database đã migration/seed và MEDIA_ROOT. Xem [setup đầy đủ](../docs/STOREFRONT_INTEGRATION.md). Next server dùng API_INTERNAL_URL; browser gọi /api/v1 cùng origin. Không cần Stripe để chạy COD.

Trên Windows, dev/build/start dùng `.next-local-<hash-tài-khoản>/` (cấu hình `distDir`), tách cache của người phát triển khỏi tài khoản sandbox để tránh `EPERM unlink`. Hash lấy từ danh tính thực qua `whoami.exe`, không dùng `USERNAME` có thể bị kế thừa sai khi chạy sandbox. Không cần xóa `.next/` hoặc `.next-local/` cũ, đổi quyền hay chạy terminal Administrator; lần chạy đầu sẽ tạo cache mới. Build và start cần chạy cùng tài khoản Windows. Linux giữ `.next-local/` cố định để build/start có thể dùng UID khác trong container. Kết quả Playwright mới nằm trong `test-results-local/`; các thư mục generated/cache đều được gitignore.

## Cấu trúc

- `src/app/(store)/`: route mỏng và layout dùng chung, URL công khai không chứa tên group.
- `src/features/landing/`: các section trang chủ, nội dung chiến dịch và danh sách sản phẩm chọn theo ID.
- `src/features/`: catalog, giỏ, checkout, tài khoản, đơn, nội dung và PC Builder theo từng nghiệp vụ.
- `src/components/layout/`: header, mega menu, footer và điều hướng nhanh.
- `src/components/storefront/`: product card, hình minh họa, dialog và thành phần dùng lại.
- `src/catalog/`: model, API client, server runtime fetch và CatalogProvider.
- `src/providers/shop-provider.tsx`, `src/hooks/use-api-resource.ts`: phiên, dữ liệu và thao tác qua API; chỉ so sánh là tuỳ chọn local.
- `src/styles/`: token và `@theme` Tailwind v4, CSS mặc định/accessibility và chuyển layout theo route. Kiểu dáng các feature dùng utility trong từng component, nhóm dài nằm ở hằng `tw` cùng file.

Chiều rộng toàn bộ storefront được chỉnh tại `--rf-home-width` trong `src/styles/tokens.css` (hiện 1540 px): trang chủ, catalog, chi tiết, giỏ/checkout, tài khoản, auth, PC Builder, nội dung và minisite dùng cùng giới hạn với showroom/footer. Gutter 64 px mỗi bên từ 1024 px, 16 px trên màn hình nhỏ hơn; grid/rail vẫn giảm số cột và cuộn riêng trên mobile. Header giữ full width với padding riêng; dialog và bảng/form nhỏ bên trong giữ giới hạn phù hợp.

Transition chung nằm ở `src/components/ui/motion.ts`: control/menu/tab 200 ms, ảnh 300 ms, dialog 150 ms; có hover, trạng thái nhấn và đóng/mở mềm. `prefers-reduced-motion` bỏ chuyển động khi người dùng chọn giảm hiệu ứng.
- `tests/e2e/`: kiểm tra tương tác và responsive bằng Playwright.

Xem [kiến trúc frontend](docs/FRONTEND_ARCHITECTURE.md) để hiểu luồng dữ liệu, server/client, cách thêm component và chú thích logic. [Kế hoạch UI/UX](docs/UI_UX_PLAN.md) mô tả phạm vi đích, không phải tất cả chức năng đã hoàn thành.

## Phần đang có

Landing ngày 06/11/2026 bám bố cục ảnh full-page người dùng cung cấp: header/search, hero 6 tab, 4 banner dịch vụ, flash sale, chiến dịch 6 card, 9 dải danh mục, danh mục nhanh, thương hiệu, khuyến mãi, blog, showroom và footer. Hero căn giữa và có giới hạn chiều rộng riêng, tự chuyển sau 3 giây, kéo chuột/vuốt và chọn slide bằng caption; nút mũi tên giữ kiểu cũ. Hai banner quảng cáo dọc bám hai mép màn hình, khuất 50% và hiện đủ khi hover/focus. Header full width với padding ngang 50 px (mobile 16 px). Màu chủ đạo là xanh ngọc và xanh đen. Các rail sản phẩm cuộn được, giữ 2 card trên điện thoại và tăng số card trên màn hình rộng. Các trang tìm kiếm/lọc/chi tiết dùng catalog API; giỏ, checkout, tài khoản và cấu hình lưu trên server.

153 ảnh sản phẩm WebP được lưu local trong `public/images/catalog/` (khoảng 2,3 MB cả metadata); nguồn được ghi tại `SOURCES.json`. Nguồn seed nằm ở `api/prisma/seed-data/`, không còn fixture runtime frontend. Seed copy ảnh sang MEDIA_ROOT và API kiểm visibility trước khi phục vụ; không gọi API cửa hàng tham khảo lúc render. Giá, tồn và thông số là dữ liệu demo. Xem [quy trình đối chiếu ảnh](docs/REFERENCE_LANDING.md) để chụp lại desktop/mobile/tablet.

PC Studio mặc định dùng [ảnh tách nền ghép thành bộ máy có chiều sâu](docs/PC_STUDIO.md), có lắp/tách, mở kính, zoom và inspector đổi linh kiện; tab 3D giữ mô hình hình học xoay tự do. Cả hai dùng asset minh họa theo nhóm, chưa chính xác từng SKU. Admin là tổng quan số liệu thực có guard; yêu cầu hậu mãi ghi ticket, chưa phải workflow phê duyệt/hoàn tiền hoàn chỉnh. Chỉ nhập thông tin giả, không nhập mật khẩu/thông tin thẻ thật.

Khảo sát website trực tiếp ngày 06/11/2026 đã mở rộng các template: catalog có bộ lọc ngang và grid 5 cột; chi tiết có zoom/ưu đãi/thông số; builder có danh sách trước studio; campaign/tin/showroom/bảo hành có trang và tương tác riêng. Checkout là form một trang với giỏ/coupon/tổng bên phải, COD được tạo ở server, giữ tồn và ghi UNPAID; cần đăng nhập thật. Từ 08/11 có [Stripe Checkout sandbox v2](../docs/STRIPE_V2.md), bật theo cấu hình backend; frontend chuyển tới URL Stripe và đọc lại trạng thái đơn từ server. [Báo cáo đối chiếu](../docs/REFERENCE_SITE_AUDIT.md) và [ma trận 103 mục](../docs/REFERENCE_SITE_TEST_MATRIX.csv) ghi rõ phần đã kiểm và còn thiếu. Các báo cáo đối chiếu cũ là mốc lịch sử UI. [Hiện trạng](../docs/PROJECT_STATUS.md) ghi kết quả API thật mới nhất; không đồng nghĩa giống pixel toàn bộ website nguồn.

## Kiểm tra

```powershell
npm run lint
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run format` chuẩn hóa code bằng Prettier. Playwright chạy qua runner tạo schema PostgreSQL riêng, Next cổng 3002/Nest 3401 và cache test riêng; không tái dùng server local. Backend phải build trước. Suite chạy 1 worker, `retries=0`: một lượt chạy song song trên Windows gặp lỗi Next dev đọc manifest đang được ghi; chưa có mode kiểm thử production trong cấu hình này. Ảnh/trace/report mới trong `.visual-review/codex_live_test_*/` được gitignore; trace có thể chứa token test, không commit. Các lệnh trên là hướng dẫn; bằng chứng chạy và giới hạn của lượt gần nhất xem [PROJECT_STATUS.md](../docs/PROJECT_STATUS.md).

`npm run test:e2e` kiểm UI và luồng thật trên development stack riêng. `api/npm run test:fullstack` chỉ chạy hành trình tích hợp trọng tâm. Các script smoke/audit tham khảo cũ không thay thế runner này. Chưa kiểm production qua Nginx.

Không tự commit, push hoặc deploy trong quy trình local này.
