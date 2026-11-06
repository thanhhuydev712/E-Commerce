# E-Commerce API

Backend NestJS cho PostgreSQL v2. Runtime có Platform/Auth/Accounts/Access, Catalog/Pricing/Media/Inventory, Storefront và Commerce (giỏ, COD, cấu hình PC, yêu thích, hỗ trợ). Mã v1 lưu tại legacy/, không đăng ký route.

Đọc hướng dẫn: [API danh tính](../docs/API_IDENTITY_V2.md), [catalog/giá/ảnh/kho](../docs/API_CATALOG_V2.md), [thiết kế backend](../docs/BACKEND_DESIGN.md), [phát triển](../docs/DEVELOPMENT.md).

Từ thư mục api/, sau khi điền .env theo .env.example:

```powershell
npm.cmd run prisma:generate
npm.cmd run build
npm.cmd run seed:access
npm.cmd run start:prod
```

Swagger: /api/docs. Health: /api/v1/health và /api/v1/health/ready. Seed không tự nâng quyền tài khoản người dùng.

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e:isolated
```

E2E ưu tiên TEST_DATABASE_URL hoặc kết nối development DATABASE_URL, tạo/dọn schema ngẫu nhiên riêng. Không dùng kết nối production hoặc reset/truncate public/legacy_v1.

Auth POST cần Origin trong allowlist. Refresh token chỉ ở HttpOnly cookie; response dùng data/meta, roleCodes/permissions. Reset/verify hiện dùng adapter local, không gửi email thật và không bật ở production.

Catalog public: GET /api/v1/products, /products/:slug, /categories, /brands, /currencies. Admin cần permission đã seed; seed tổng cộng 10 permission và không tự cấp ADMIN cho người dùng. Giá nhận/trả chuỗi số nguyên VND. Điều chỉnh kho cần Idempotency-Key, expectedVersion và reason; retry cùng key/payload chỉ áp dụng một lần.

Upload PNG/JPEG tối đa 5 MiB lưu ở MEDIA_ROOT (mặc định .local-media, gitignore). Seed có thêm ảnh WebP local. Chỉ ảnh READY được liên kết với nội dung public hợp lệ mới phục vụ; bốn ảnh migrate PENDING chưa được import. Local adapter cần storage bền vững trước deployment.

Frontend đọc `/api/v1/storefront` và gọi API tài khoản/giỏ/đặt COD thật. [Hướng dẫn setup, seed và fullstack test](../docs/STOREFRONT_INTEGRATION.md), [contract Commerce và giới hạn](../docs/API_STOREFRONT_COMMERCE_V2.md). Stripe test chưa bật vì thiếu webhook/processor v2; không có thanh toán giả. `npm run test:fullstack` chạy Next/Nest/PostgreSQL trong schema test riêng, không sửa public.
