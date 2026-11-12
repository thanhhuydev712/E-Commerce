# E-Commerce Fullstack

Dự án website thương mại điện tử phục vụ hai mục tiêu: học và củng cố Fullstack từ nền tảng, đồng thời xây dựng sản phẩm portfolio có nghiệp vụ, kiểm thử và khả năng vận hành thực tế.

Frontend mang phong cách cửa hàng PC, linh kiện và gaming gear. Ngày 06/11/2026: đã nối PostgreSQL → backend v2 → frontend cho catalog, tài khoản, giỏ, cấu hình PC và đặt/huỷ COD; xem phạm vi và bằng chứng ở [Project status](docs/PROJECT_STATUS.md). Mã v1 và Stripe cũ nằm ở `api/legacy/`, ngoài runtime. Dự án đang phát triển; chưa xác nhận sẵn sàng production.

## Các thành phần

| Thành phần | Công nghệ trong manifest | Vị trí |
| --- | --- | --- |
| Storefront | Next.js 16.4.2, React 19.3.0, TypeScript, Tailwind CSS 4 | `front/` |
| REST API | NestJS 12, TypeScript 6, JWT, Swagger | `api/` |
| Database | PostgreSQL, Prisma 7.10.x, adapter-pg | `api/prisma/` |
| Thanh toán | Stripe SDK 23; Checkout sandbox v2, webhook chữ ký, chống lặp và expiry; refund chưa đầy đủ | `api/src/modules/commerce/` |
| Kiểm tra chất lượng | Vitest, Supertest, Oxlint, ESLint | Cấu hình riêng từng ứng dụng |

Phiên bản trên được đọc từ package.json ngày 05/11/2026; xem lockfile để biết phiên bản được khóa. Ngày 06/11/2026, người dùng yêu cầu bổ sung **Docker, CI/CD, Nginx và AWS Deployment sau FE–BE**; đã có [kế hoạch hạ tầng](docs/DEPLOYMENT_PLAN.md), chưa cài đặt hoặc nghiệm thu deployment. Admin UI đọc tổng quan có phân quyền thật; workflow quản trị/refund đầy đủ vẫn cần hoàn thiện. Từ 08/11 có [Stripe Checkout sandbox v2](docs/STRIPE_V2.md). [Chạy, seed và test tích hợp](docs/STOREFRONT_INTEGRATION.md).

## Bản đồ thư mục

```text
E-Commerce/
├── AGENTS.md                 # Điểm vào dành cho Codex
├── README.md                 # Tổng quan và chỉ mục tài liệu
├── docs/                     # Hồ sơ sản phẩm và kỹ thuật
├── api/
│   ├── src/common/           # Guards, decorators, interfaces
│   ├── src/modules/          # Identity, catalog, pricing, media, inventory v2
│   ├── src/platform/         # Config, HTTP, health
│   ├── legacy/               # Mã nghiệp vụ v1 để đối chiếu
│   ├── src/prisma/           # Prisma service/module
│   ├── prisma/               # Schema và migration SQL
│   └── test/                 # E2E
└── front/
    ├── AGENTS.md             # Hướng dẫn riêng Next.js
    ├── src/app/              # Layout và trang App Router
    ├── src/components/       # Layout, sections, product, UI, dữ liệu mẫu
    └── public/               # Hình ảnh và tài nguyên tĩnh
```

## Bắt đầu

### Chuẩn bị lần đầu

Dùng PowerShell trong Cursor/VS Code. Hai ứng dụng có dependencies riêng; nếu chưa cài, chạy từ root dự án:

```powershell
Set-Location D:\Cursor\E-Commerce
npm.cmd --prefix api ci
npm.cmd --prefix front ci
```

Cấu hình `api/.env` theo [file mẫu](api/.env.example): PostgreSQL, hai JWT secret khác nhau dài ít nhất 32 ký tự, `PORT=3001` và origin frontend `http://localhost:3000`. Giữ nguyên `.env` đã cấu hình. Database mới cần chuẩn bị migration/seed theo [hướng dẫn môi trường](docs/DEVELOPMENT.md); database đang dùng không cần chạy lại migration/seed chỉ để mở dự án.

### Backend — terminal 1

```powershell
Set-Location D:\Cursor\E-Commerce\api
npm.cmd run prisma:generate
npm.cmd run start:dev
```

Chờ `Found 0 errors` và `Nest application successfully started`.

### Frontend — terminal 2

```powershell
Set-Location D:\Cursor\E-Commerce\front
npm.cmd run dev -- --port 3000
```

Chờ `Ready`, sau đó mở:

- Website: <http://localhost:3000>.
- API: <http://localhost:3001/api/v1>.
- Swagger: <http://localhost:3001/api/docs>.
- Kiểm tra database: <http://localhost:3001/api/v1/health/ready> — cần trả `{"status":"ready"}`.

### Stripe sandbox — terminal 3, khi thử thanh toán

Đăng nhập CLI bằng `stripe login` nếu chưa đăng nhập, rồi chạy nguyên dòng:

```powershell
stripe listen --events checkout.session.completed,checkout.session.expired --forward-to http://localhost:3001/api/v1/webhooks/stripe
```

Lấy `whsec_...` listener hiển thị, cập nhật `STRIPE_WEBHOOK_SECRET` trong `api/.env`, rồi khởi động lại backend. Backend cũng cần `STRIPE_SECRET_KEY` dạng `sk_test_...`; xem [hướng dẫn Stripe](docs/STRIPE_V2.md). Không thêm dấu `\` trước dấu `:` hoặc cuối URL. Stripe không bắt buộc khi chạy COD.

Giữ các terminal server/listener mở; dùng Ctrl+C để dừng. Dùng `npm.cmd` trên PowerShell để tránh lỗi `npm.ps1`. Nếu cổng 3000/3001 đang bận, dừng server cũ trước khi chạy lại. Xem [cách xử lý lỗi khởi động Windows](docs/LOCAL_START.md) cho lỗi database, thiếu module hoặc quyền cache.

## Tài liệu dự án

| Tài liệu | Nội dung |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Bối cảnh và quy tắc cộng tác dành cho Codex |
| [Project context](docs/PROJECT_CONTEXT.md) | Mục tiêu, phạm vi, người dùng và giới hạn |
| [Requirements](docs/REQUIREMENTS.md) | Thành phần nghiệp vụ, user stories, tiêu chí nghiệm thu |
| [Architecture](docs/ARCHITECTURE.md) | Cấu trúc hệ thống, ERD, API và quyết định cần chốt |
| [Database v2](docs/database/README.md) | 102 bảng đã migrate sang VND, từ điển dữ liệu và transaction; mức triển khai API theo từng giai đoạn |
| [Thiết kế backend v2](docs/BACKEND_DESIGN.md) | Đã duyệt; triển khai tới catalog/giá/ảnh/kho cơ bản, mua hàng ở giai đoạn sau |
| [API nền tảng và danh tính](docs/API_IDENTITY_V2.md) | Auth/session/quyền, hồ sơ/địa chỉ, contract/cookie, lệnh chạy và giới hạn |
| [API catalog, giá, ảnh và kho](docs/API_CATALOG_V2.md) | Publish/SKU/thông số, VND, upload local và điều chỉnh tồn có chống lặp |
| [Development](docs/DEVELOPMENT.md) | Cấu hình, lệnh chạy và lưu ý môi trường |
| [Docker, CI/CD, Nginx và AWS](docs/DEPLOYMENT_PLAN.md) | Thiết kế local/test/staging/demo, pipeline, mạng/TLS, migration/rollback, backup và chi phí; chưa triển khai |
| [Project status](docs/PROJECT_STATUS.md) | Hiện trạng quan sát từ mã nguồn và ưu tiên rà soát |
| [Roadmap](docs/ROADMAP.md) | Khung phát triển 20 giai đoạn |
| [Quality](docs/QUALITY.md) | Quy trình Git, kiểm thử, bảo mật và Definition of Done |
| [Rà soát FE, UI/UX và PC Studio](docs/FRONTEND_READINESS_AUDIT.md) | Ma trận trình duyệt, các lỗi đã sửa, bản production local và những việc còn lại trước công khai |
| [Khảo sát Tin Học Ngôi Sao](docs/REFERENCE_SITE_AUDIT.md) | Bố cục, kết quả thao tác thực tế, ma trận 103 mục và khoảng cách còn lại của storefront |

Nguồn bối cảnh gồm bản bàn giao lịch sử (file được nhắc trước đây hiện không có ở root), các yêu cầu người dùng và rà soát mã nguồn. Ưu tiên hướng dẫn tại root, `docs/` và `front/docs/`; phân biệt mốc lịch sử v1 với trạng thái mới nhất trong PROJECT_STATUS. README frontend đã có hướng dẫn dự án, README backend còn cần đối chiếu với mã hiện tại.
