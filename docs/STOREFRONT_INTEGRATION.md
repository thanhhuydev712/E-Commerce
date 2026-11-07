# Chạy database – backend – frontend

Checklist thao tác dành cho người tự test: [Thiết lập, import và test từng bước](MANUAL_TEST.md).

Ngày 06/11/2026: schema có 104 model. Hai model mới `SavedPcBuild` và `SavedPcBuildComponent` lưu cấu hình PC có người sở hữu, FK sản phẩm và slot duy nhất. Không thêm bảng chỉ để tăng số lượng công nghệ.

## Database phát triển

Dùng database development/test, không chạy seed lên production. Cấu hình `api/.env` theo `.env.example`; không đưa secret vào frontend.

```powershell
cd api
npm ci
npm run prisma:generate
npm run build
node prisma/apply-storefront.cjs
npm run seed:access
npm run seed:storefront -- --plan
npm run seed:storefront -- --apply
node prisma/audit-storefront.cjs --write-report
```

Migration dùng `migrate deploy`, không reset/truncate. Seed dùng deterministic ID, thêm khi chưa có, giữ dữ liệu hiện hữu; chạy lại không tăng gấp đôi tồn/ledger và không tự khôi phục hàng đã bán. Nếu sản phẩm có slug trùng nhưng ID khác, seed dừng để xử lý thay vì ghi đè. Editor dùng cho seed bị LOCKED, không nhận quyền ADMIN. Seed không tạo mật khẩu đăng nhập demo chung hoặc thanh toán giả.

Nguồn dữ liệu nằm ở `api/prisma/seed-data/`: 183 sản phẩm, 185 SKU, 26 danh mục, 8 bài, cùng trang nội dung/bố cục. Ảnh nguồn development ở `front/public/images/`; seed copy vào MEDIA_ROOT, liên kết qua MediaAsset/ProductMedia/Banner. Giữ `SOURCES.json` để ghi nguồn ảnh. Không tải dữ liệu website khác trong runtime.

[Báo cáo đối soát](database/DATABASE_AUDIT.json) chỉ chứa số lượng từng bảng và các bất biến tiền/tồn. Bảng refund/webhook/shipment/warranty trống khi chưa có nghiệp vụ tương ứng là hợp lệ; không chèn lịch sử thanh toán/giao vận giả chỉ để mọi bảng có dữ liệu.

## Chạy ứng dụng

Terminal thứ nhất:

```powershell
cd api
npm run start:dev
```

Terminal thứ hai:

```powershell
cd front
npm ci
npm run dev
```

Mở http://localhost:3000. API mặc định cổng 3001; Swagger `/api/docs`, readiness `/api/v1/health/ready`. Next server dùng `API_INTERNAL_URL=http://127.0.0.1:3001` nếu cần ghi rõ, browser luôn gọi `/api/v1`. Khi đổi đích rewrite, khởi động lại Next. Không đặt DATABASE_URL/JWT/Stripe secret trong `NEXT_PUBLIC_*`.

Đăng ký tài khoản bằng email giả, chọn sản phẩm và thêm giỏ, tải lại trang để kiểm dữ liệu đã lưu, nhập địa chỉ giả rồi đặt COD. Sau đó mở chi tiết và huỷ đơn để kiểm lịch sử/reservation. Khách chưa đăng nhập sẽ được yêu cầu đăng nhập. Admin API kiểm permission thật; không tự cấp admin cho tài khoản mới.

Đây vẫn là môi trường demo với dữ liệu giả; chưa có giao vận/thu tiền thực. Stripe chưa bật cho tới khi có processor/webhook v2. Xem [contract và giới hạn](API_STOREFRONT_COMMERCE_V2.md).

## Kiểm thử tự động

```powershell
cd api
npm run lint
npm test
npm run test:e2e:isolated
npm run test:fullstack
```

`TEST_DATABASE_URL` nếu có được ưu tiên; nếu không, runner development lấy DATABASE_URL để tạo schema test ngẫu nhiên rồi tự xoá schema đó. Không truncate hay seed public/legacy. Tài khoản kết nối test phải có quyền CREATE SCHEMA. Runner fullstack cần backend đã build, dependencies hai ứng dụng và Chromium Playwright đã cài; sử dụng cổng riêng 3401/3002 và cache Next riêng, không tái dùng server đang phát triển. Khoá độc quyền `api/.tmp/fullstack-run.lock` và kiểm tra cổng ngăn hai lượt UI chạy trùng; lượt sau phải chờ lượt trước hoàn tất. Runner chỉ dừng tiến trình và xoá schema/media do chính lượt đó tạo.

Bộ fullstack điều khiển trình duyệt qua Next → Nest → PostgreSQL thật, kiểm catalog/media, đăng ký, phục hồi phiên, giỏ sau xoá localStorage/reload, địa chỉ, cấu hình PC, COD, huỷ đơn, quyền admin và dữ liệu local giả không đăng nhập được. JSON/trace đặt trong `front/.visual-review/codex_live_test_*/`, bị gitignore vì trace có thể chứa token của tài khoản test.

Frontend kiểm tĩnh riêng:

```powershell
cd front
npm run lint
npm run format:check
npm run build
```

`front/npm run test:e2e` chạy cả UI và hành trình API thật qua runner riêng; `api/npm run test:fullstack` chạy ba ca tích hợp trọng tâm. Các test cũ dựa vào đăng nhập/đơn hàng/coupon/bảo hành giả trong localStorage đã được thay bằng hành trình thật và các trường hợp bị từ chối. Test hero, responsive, motion, tìm kiếm/lọc, so sánh và renderer 3D được giữ. Bảo hành không còn kết quả serial demo giả; email tài khoản lấy từ phiên đăng nhập; coupon phải được server xác nhận.

Có thể kiểm bản production local trong cùng schema test, từ `front/`:

```powershell
$env:LIVE_FRONTEND_MODE = 'production'
npm.cmd run test:e2e
Remove-Item Env:LIVE_FRONTEND_MODE
```

Runner build/start Next với cùng `API_INTERNAL_URL` trỏ backend test và output `.next-local-live-production`; mặc định vẫn là dev. Khóa runner và kiểm cổng vẫn áp dụng. Đây là production build local, chưa phải Docker/Nginx/AWS. [Rà soát FE và PC Studio](FRONTEND_READINESS_AUDIT.md) ghi ma trận UI/UX, lỗi đã sửa và giới hạn.

Build thành công không thay thế kiểm thử luồng FE–BE, và suite local chưa thay thế kiểm thử sau Nginx. Kết quả thật của lượt gần nhất được ghi ở PROJECT_STATUS; không suy diễn từ việc có file test.
