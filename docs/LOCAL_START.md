# Mở dự án trên Windows

Hướng dẫn ngày 12/11/2026. Dùng PowerShell trong Cursor/VS Code. Mỗi khối bên dưới chạy trong một terminal riêng; giữ terminal chạy server mở.

## Backend — terminal 1

```powershell
Set-Location D:\Cursor\E-Commerce\api
npm.cmd run prisma:generate
npm.cmd run start:dev
```

Chờ `Found 0 errors` và `Nest application successfully started`. Mở <http://localhost:3001/api/v1/health/ready>; kết quả mong đợi là `{"status":"ready"}`. Swagger: <http://localhost:3001/api/docs>.

`api/.env` phải có DATABASE_URL và hai JWT secret hợp lệ theo `.env.example`. Giữ PORT=3001. Không ghi đè `.env` đã cấu hình. Database hiện có không cần chạy migration/seed lại chỉ để mở ứng dụng.

## Frontend — terminal 2

```powershell
Set-Location D:\Cursor\E-Commerce\front
npm.cmd run dev -- --port 3000
```

Chờ `Ready`, mở <http://localhost:3000>. Next chuyển tiếp `/api/v1` sang backend cổng 3001 theo cấu hình mặc định. Dùng địa chỉ localhost nhất quán với ALLOWED_ORIGINS và STOREFRONT_URL trong backend.

## Stripe — terminal 3, khi thử thanh toán

```powershell
stripe listen --events checkout.session.completed,checkout.session.expired --forward-to http://localhost:3001/api/v1/webhooks/stripe
```

Lấy signing secret `whsec_...` của listener này để đặt STRIPE_WEBHOOK_SECRET trong `api/.env`, rồi khởi động lại backend. Backend cũng cần STRIPE_SECRET_KEY dạng `sk_test_...`. Giữ listener mở. Trang `Authorization successful` chỉ xác nhận CLI đã đăng nhập; có thể đóng trang đó. Không cần `stripe agent setup` để chạy thanh toán của dự án.

## Khi có lỗi

| Biểu hiện | Cách kiểm tra/xử lý |
| --- | --- |
| `npm.ps1 cannot be loaded` | Dùng `npm.cmd` và `npx.cmd`; không cần đổi ExecutionPolicy. |
| `ENOENT ... package.json` | Chạy trong `api` hoặc `front`, không chạy npm ở root. |
| `EADDRINUSE` / port 3000 đang bận | Dừng server cũ bằng Ctrl+C tại terminal đã mở nó. Chỉ chạy một backend và một frontend; giữ đúng cổng 3001/3000. |
| `EPERM ... dist` hoặc cache Next | Dùng npm scripts hiện tại với cùng tài khoản Windows. Scripts tách output theo tài khoản; không cần xóa cache cũ hay chạy Administrator. Tránh build và dev cùng ứng dụng đồng thời. |
| `DATABASE_UNAVAILABLE`, readiness 503 | Kiểm tra PostgreSQL/dịch vụ database, mạng/VPN/firewall và DATABASE_URL; Swagger/trang chủ mở được chưa xác nhận database hoạt động. Không reset database. |
| Thiếu module hoặc Prisma client | Khi chưa cài dependencies: `npm.cmd ci` trong từng ứng dụng; sau đó `npm.cmd run prisma:generate` trong api. Dừng server trước khi cài lại. |
| Thiếu bảng trên database mới | Đọc migration trước, kiểm tra `npx.cmd prisma migrate status`, áp migration phù hợp rồi mới build/seed; xem DEVELOPMENT.md. Không reset dữ liệu đang dùng. |

Để dừng dự án: Ctrl+C ở từng terminal. Kiểm thử và giới hạn được ghi trong PROJECT_STATUS.md; hướng dẫn này không xác nhận toàn bộ nghiệp vụ đã hoàn thiện.
