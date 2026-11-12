# Phát triển trên máy cá nhân

Hướng dẫn mở nhanh trên Windows: [LOCAL_START.md](LOCAL_START.md).

Ngày **06/11/2026**, backend có identity/catalog và commerce COD tích hợp; kết quả kiểm tra tại [PROJECT_STATUS.md](PROJECT_STATUS.md), contract [danh tính](API_IDENTITY_V2.md) và [catalog/giá/ảnh/kho](API_CATALOG_V2.md). Kế hoạch Docker/CI/staging/demo và AWS nằm ở [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md), chưa có cấu hình chạy tương ứng trong repository.

Cập nhật **08/11/2026**: có [Stripe Checkout sandbox v2](STRIPE_V2.md). Hướng dẫn đó bổ sung/thay thế các ghi chú payment v2 chưa triển khai ở mốc cũ bên dưới; Stripe vẫn không bắt buộc để boot và chạy COD.

## Điều kiện

- Windows/PowerShell là môi trường chủ dự án đang dùng.
- Có Node.js/npm tương thích với dependencies và PostgreSQL dành riêng cho local/test. Repository chưa pin Node bằng `engines` hoặc file phiên bản; đề xuất xác minh rồi pin Node 24 patch phù hợp trước khi chuẩn hóa Docker/CI.
- Backend hiện nạp platform/auth/accounts/access/catalog/pricing/media/inventory/storefront/commerce v2, không nạp Payments v1 trong legacy; không yêu cầu Stripe key để boot. Khi triển khai payment v2 chỉ dùng Stripe test key ở local/test/demo.
- Chạy lệnh dưới đây từ root repository, trừ các khối ghi rõ thư mục.

Các lệnh backend đã chạy được ghi theo từng mốc ở PROJECT_STATUS; các lệnh/môi trường frontend và deployment có phạm vi xác minh riêng.

## 1. Cài dependencies

```powershell
npm --prefix api ci
npm --prefix front ci
```

Hai thư mục có lockfile riêng. `api` có postinstall `prisma skills sync || exit 0`, có thể đồng bộ tài nguyên hướng dẫn; đây không phải bước generate Prisma Client.

## 2. Cấu hình backend

Tạo hoặc cập nhật `api/.env` theo [`api/.env.example`](../api/.env.example), không commit giá trị thật. Hai JWT secret phải khác nhau và dài ít nhất 32 ký tự. Bảng dưới mô tả tên biến, không chứa credential thật.

| Biến | Mục đích / lưu ý |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL dùng cho Prisma CLI và adapter-pg |
| `JWT_SECRET` | Secret access JWT; strategy yêu cầu giá trị |
| `JWT_REFRESH_SECRET` | Secret refresh JWT khác access secret; validator yêu cầu hai secret dài tối thiểu 32 ký tự |
| `JWT_EXPIRES_IN` | Số giây của access token, validator mặc định 900 và tối đa 3600 |
| `REFRESH_TTL_SECONDS` | Validator mặc định 604800, tối đa 2592000 giây |
| `PORT` | Validator mặc định `3001`, tránh trùng Next.js cổng 3000 |
| `DATABASE_SCHEMA` | Schema nghiệp vụ, mặc định từ URL hoặc `public`; validator không cho dùng `legacy_v1` |
| `ALLOWED_ORIGINS` | Local: `http://localhost:3000,http://localhost:3001` để gọi từ frontend và đăng nhập ngay trên Swagger; nhiều origin phân cách bằng dấu phẩy |
| `NODE_ENV` | `development` cho local; `production` bật Secure cookie, yêu cầu origin HTTPS và hiện chặn email challenge local |
| `TEST_DATABASE_URL` | Tùy chọn kết nối riêng cho E2E; runner tạo schema test ngẫu nhiên, không reset/truncate public |
| `MEDIA_ROOT` | Thư mục ảnh upload local, mặc định `.local-media` tương đối working directory api; cần storage bền vững/backup khi triển khai |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Tùy chọn, chỉ sandbox; cả hai cần có để bật Stripe Checkout v2 |
| `STOREFRONT_URL` | Origin frontend dùng cho URL quay lại Stripe; phải nằm trong ALLOWED_ORIGINS, mặc định origin đầu tiên |

Nguồn hiện tại: `api/src/platform/environment.ts` và `app.module.ts`. Npm scripts Nest nạp `.env` bằng `--env-file`, Prisma config dùng `dotenv/config`, ConfigModule hiện cũng trỏ `.env`. Khi làm CI phải truyền env test một cách rõ ràng, không để ConfigModule vô tình dùng database phát triển. Các biến Stripe/Observe từng xuất hiện ở v1 không phải yêu cầu boot của AppModule hiện tại.

## 3. Prisma và database local

Trong `api/`, sau khi cấu hình DATABASE_URL tới database phát triển:

```powershell
Set-Location api
npx prisma generate
npm.cmd run build
npx.cmd prisma migrate status
# Lịch sử hiện có bao gồm upgrade v2; đọc SQL và phần cảnh báo bên dưới trước khi áp dụng:
npx.cmd prisma migrate deploy
npm.cmd run seed:access
```

`migrate deploy` áp dụng migration đã có. Khi phát triển thay đổi schema mới, cân nhắc `migrate dev --name <ten_thay_doi>` trên database phát triển riêng và xem lại SQL. Không dùng reset/cleanDatabase cho dữ liệu cần giữ.

Generator `prisma-client-js` có output `api/generated/prisma-v2`; PrismaService hiện đã import client này. Chạy generate v2 trước build; script `prisma:generate:legacy` chỉ phục vụ đối chiếu mã cũ, không phải bước boot v2. AppModule có nền tảng/danh tính, catalog/giá/ảnh/kho, storefront/commerce COD. Stripe processor v2 chưa có. Xem [setup và seed tích hợp](STOREFRONT_INTEGRATION.md). Xem [Prisma v2](database/PRISMA_V2.md) cho lịch sử thiết kế/migration, đối chiếu mã hiện tại khi tài liệu còn ghi v1. Migration upgrade lưu bảng nguồn ở `legacy_v1`, giữ user/catalog/cart, không đưa đơn/payment cũ vào public v2; không chạy `db push` hoặc reset để bỏ qua bước kiểm tra dữ liệu. Giai đoạn 2 không thêm migration.

## 4. Chạy hai ứng dụng

Terminal 1, từ root:

```powershell
Set-Location api
$env:PORT = '3001'
npm.cmd run start:dev
```

Terminal 2, từ root:

```powershell
Set-Location front
npm.cmd run dev -- --port 3000
```

Storefront: `http://localhost:3000`. API: `http://localhost:3001/api/v1`. Swagger: `http://localhost:3001/api/docs`.

HTTP setup hiện nằm ở `api/src/platform/http.ts`, không còn hardcode Swagger server cổng 3000 trong `main.ts`. Frontend đã gọi API thật qua /api/v1 cùng origin, server Next dùng API_INTERNAL_URL; cần seed database/media trước khi chạy. Health liveness ở `/api/v1/health`, readiness kiểm database ở `/api/v1/health/ready`; sự tồn tại của endpoint chưa phải bằng chứng đã chạy thành công.

## 5. Lệnh kiểm tra có sẵn

| Vị trí | Lệnh | Mục đích |
| --- | --- | --- |
| `api/` | `npm run build` | Biên dịch NestJS |
| `api/` | `npm run lint` | Oxlint type-aware |
| `api/` | `npm test` | Vitest unit specs |
| `api/` | `npm run test:cov` | Coverage |
| `api/` | `npm run test:e2e` | Vitest + Supertest; chuẩn bị database test và env riêng |
| `front/` | `npm run lint` | ESLint |
| `front/` | `npm run format:check` | Kiểm tra định dạng bằng Prettier |
| `front/` | `npm run build` | Next production build |
| `front/` | `npm run test:e2e` | Playwright UI + FE–BE thật, schema/cổng/cache riêng |

E2E backend scaffold đã lưu trong legacy, thay bằng `test/identity.e2e-spec.ts` và `test/catalog.e2e-spec.ts`. Chạy `npm.cmd run test:e2e:isolated`: runner ưu tiên TEST_DATABASE_URL, nếu thiếu dùng DATABASE_URL development, tạo/dọn schema riêng; suite media dùng thư mục tạm riêng. Chạy trực tiếp `test:e2e` cần đặt TEST_DATABASE_URL, nếu không suite được skip; không dùng kết quả skip như pass tính năng. Kết quả danh tính/catalog và unit tại PROJECT_STATUS, đã có E2E giỏ/đơn COD và FE–BE thật. Playwright runner không reuse server và chạy `next dev`; khi kiểm deployment phải có mode production, không reuse server bất kỳ, kiểm API thật theo phạm vi. Build Next.js có thể cần mạng để tải font; ghi đúng nguyên nhân nếu môi trường không cho phép.

Để thấy tiến độ từng ca khi PostgreSQL ở xa, dùng `npm.cmd run test:e2e:isolated -- --reporter=verbose`. Runner chuyển các tham số phía sau `--` cho Vitest, vẫn giữ cơ chế tạo/dọn schema riêng. Không chạy đồng thời nhiều lượt E2E trên cùng DB chỉ để chờ kết quả nhanh hơn.

## Production

Backend có `start:prod` gọi `scripts/run-built.cjs api`; Windows dùng output `dist-local-<hash-tài-khoản>`, Linux giữ `dist`. Build/start cần cùng tài khoản Windows. `tsconfig.build.json` override `rootDir` thành `./src`. Phải kiểm entrypoint và đường dẫn generated client từ artifact Linux thực tế khi đóng gói. Frontend có `npm run start` sau build; kế hoạch Docker chọn standalone nhưng chưa sửa config. Chưa có runbook deployment đã kiểm chứng.

Thiết kế đích: Nginx nhận HTTPS, Next/Nest chạy container nội bộ, RDS private, image phát hành theo digest qua GitHub Actions/ECR/SSM. Cần kiểm env production, proxy/cookie/Origin, TLS DB, migration và rollback theo [kế hoạch hạ tầng](DEPLOYMENT_PLAN.md). Email challenge hiện chỉ có adapter local và sẽ từ chối ở production; phải giải quyết hoặc ghi rõ giới hạn chức năng trước nghiệm thu. Không đổi `NODE_ENV` thành development trên AWS để bỏ qua điều kiện này.
