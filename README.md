# E-Commerce Fullstack

**20/11/2026:** đang chuẩn bị [khôi phục mật khẩu cho tài khoản thử trên AWS](docs/PASSWORD_RECOVERY_AWS.md); tính năng mặc định tắt cho tới khi Release/Deploy và kiểm email thật. Trạng thái thực tế tại [PROJECT_STATUS](docs/PROJECT_STATUS.md).

**17/11/2026:** chủ dự án xác nhận định hướng sản phẩm kinh doanh **RIGFORCE STORE** (công nghệ/gear cho người dùng laptop/PC). Chưa nghiệm thu production; xem [danh sách thiếu, thông tin cần bổ sung và điều kiện mở bán](docs/PRODUCTION_READINESS.md). Giữ tên SKU/coupon và dữ liệu lịch sử đến khi có kế hoạch thay dữ liệu thật, không đổi chuỗi đại trà hoặc xóa nhãn demo để giả trạng thái đã vận hành.

Dự án website thương mại điện tử phục vụ hai mục tiêu: học và củng cố Fullstack từ nền tảng, đồng thời xây dựng sản phẩm portfolio có nghiệp vụ, kiểm thử và khả năng vận hành thực tế.

Mốc tiếp theo được chốt **17/11/2026**: [đưa website hiện tại thành bản công khai để giới thiệu và trải nghiệm](docs/RELEASE_PLAN.md), **chưa nhận đơn thật**. Giữ giao diện hiện tại, hoàn thiện dần độ ổn định/nội dung/SEO và kiểm production trước khi triển khai theo kế hoạch Docker/Nginx/CI/CD/AWS.

Frontend mang phong cách cửa hàng PC, linh kiện và gaming gear. Ngày 06/11/2026: đã nối PostgreSQL → backend v2 → frontend cho catalog, tài khoản, giỏ, cấu hình PC và đặt/huỷ COD; xem phạm vi và bằng chứng ở [Project status](docs/PROJECT_STATUS.md). Mã v1 và Stripe cũ nằm ở `api/legacy/`, ngoài runtime. Dự án đang phát triển; chưa xác nhận sẵn sàng production.

## Các thành phần

| Thành phần | Công nghệ trong manifest | Vị trí |
| --- | --- | --- |
| Storefront | Next.js 16.4.6, React 19.3.0, TypeScript, Tailwind CSS 4 | `front/` |
| REST API | NestJS 12, TypeScript 6, JWT, Swagger | `api/` |
| Database | PostgreSQL, Prisma 7.10.x, adapter-pg | `api/prisma/` |
| Thanh toán | Stripe SDK 23; Checkout sandbox v2, webhook chữ ký, chống lặp và expiry; refund chưa đầy đủ | `api/src/modules/commerce/` |
| Kiểm tra chất lượng | Vitest, Supertest, Oxlint, ESLint | Cấu hình riêng từng ứng dụng |

Phiên bản trên được đọc từ package.json ngày 05/11/2026; xem lockfile để biết phiên bản được khóa. Ngày 06/11/2026, người dùng yêu cầu bổ sung **Docker, CI/CD, Nginx và AWS Deployment sau FE–BE**; đã có [kế hoạch hạ tầng](docs/DEPLOYMENT_PLAN.md), Docker local và bộ production/CI/CD/AWS; chưa nghiệm thu deployment AWS. Admin UI đọc tổng quan có phân quyền thật; workflow quản trị/refund đầy đủ vẫn cần hoàn thiện. Từ 08/11 có [Stripe Checkout sandbox v2](docs/STRIPE_V2.md). [Chạy, seed và test tích hợp](docs/STOREFRONT_INTEGRATION.md).

## Bản đồ thư mục

Next.js và eslint-config-next đã được cập nhật cùng patch 16.4.6 ngày 17/11/2026; các phiên bản khác trong bảng giữ theo manifest, xem [kết quả kiểm tra](docs/PROJECT_STATUS.md).

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
    ├── src/components/       # Header/footer và component UI dùng chung
    ├── src/features/         # Màn hình và logic theo nghiệp vụ
    ├── src/catalog/          # API client, kiểu dữ liệu và CatalogProvider
    ├── src/providers/        # Phiên và state mua sắm dùng chung
    ├── src/styles/           # Token màu/font, CSS nền và bố cục
    └── public/               # Hình ảnh và tài nguyên tĩnh
```

## Bắt đầu

### Thực hành Docker và Nginx

Đã có bộ lab local ở [compose.yaml](compose.yaml) và [hướng dẫn từng bước Docker → Nginx → CI/CD → AWS](docs/DOCKER_GUIDE.md). Khi Docker Desktop Linux engine đã chạy:

```powershell
node infra/scripts/init-docker-env.mjs
docker compose --env-file .env.docker up -d --build --wait --wait-timeout 180
docker compose --env-file .env.docker --profile tools run --rm seed
node infra/scripts/smoke-docker.mjs
```

Truy cập `http://localhost:8080`. DB/media dùng volume riêng, không trỏ vào DB host. Đây là lab HTTP local; API development, FE production standalone. Migration cho DB mới dùng baseline riêng, không sửa history DB hiện hữu; CI đã có file nhưng chưa đồng nghĩa đã chạy trên GitHub. AWS/CD và điều kiện phát hành public còn theo RELEASE_PLAN.

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

## Hiểu cách hệ thống hoạt động

Phần giải thích cập nhật ngày **12/11/2026**, dựa trên khảo sát mã backend và một sub-agent frontend. Đây là hướng dẫn đọc mã; không phải kết quả chạy lại ứng dụng hoặc kiểm thử. Trạng thái đã kiểm chứng và giới hạn xem [PROJECT_STATUS.md](docs/PROJECT_STATUS.md).

```text
Trình duyệt → Next.js → NestJS API → Prisma → PostgreSQL
                              ↘ Stripe Checkout sandbox
                                ← webhook xác nhận thanh toán
```

### Vì sao dùng từng thành phần?

Các lý do dưới đây giải thích vai trò và đánh đổi trong cách dùng hiện tại, không khẳng định mọi website bán hàng đều phải dùng cùng bộ công nghệ.

| Thành phần | Dùng để giải quyết việc gì | Đánh đổi cần hiểu |
| --- | --- | --- |
| React | Chia UI thành component; cập nhật theo state như menu, bộ lọc và giỏ | Cần quản lý state và render đúng |
| Next.js App Router | Tổ chức URL, layout, render server và ghép UI React | Cần phân biệt code server với code chạy trong browser |
| TypeScript | Kiểm tra kiểu dữ liệu giữa component, API và service | Không thay validation lúc nhận dữ liệu thật |
| Tailwind CSS | Viết bố cục, màu và responsive gần component | Class có thể dài; cần dùng token chung để giữ nhất quán |
| NestJS | Tổ chức API theo module, controller, service và guard | Nhiều cấu trúc hơn một server nhỏ; tách frontend/backend cần chạy hai ứng dụng |
| Prisma + adapter-pg | Truy vấn có kiểu dữ liệu và quản lý migration trên PostgreSQL | Vẫn cần hiểu SQL, transaction và khóa; một số truy vấn dùng SQL trực tiếp |
| PostgreSQL | Lưu quan hệ tài khoản, SKU, giá, tồn và lịch sử giao dịch; hỗ trợ transaction | Cần cấu hình kết nối, backup và vận hành |
| JWT, session và bcrypt | Xác thực request, thu hồi phiên và kiểm mật khẩu qua hash | Phải xử lý hết hạn, refresh, logout và kiểm quyền riêng |
| Stripe Checkout | Chuyển khách sang trang thanh toán của provider | Cần xác minh trạng thái phía server; redirect không chứng minh đã trả tiền |
| Ảnh sản phẩm + CSS transform | Nghiêng nhẹ ảnh chi tiết, ghép ảnh linh kiện đang chọn | Không mô phỏng lắp ráp; ảnh catalog cần xác minh đúng model. Đã gỡ dependency 3D |
| Vitest, Supertest và Playwright | Kiểm logic, HTTP API và hành trình trình duyệt | Có file test không đồng nghĩa test đã chạy qua; xem bằng chứng từng lượt |

### Tải trang và đăng nhập

- Next server đọc `GET /api/v1/storefront` lúc có request; backend lấy catalog, giá, tồn, banner và nội dung công khai từ PostgreSQL. `CatalogProvider` cung cấp snapshot cho component. Snapshot hiện có giới hạn số lượng; catalog lớn hơn sẽ cần phân trang/truy vấn chọn lọc.
- Browser gọi `/api/v1/...` cùng origin. [next.config.ts](front/next.config.ts) rewrite sang backend qua `API_INTERNAL_URL`, mặc định `http://127.0.0.1:3001`; Next server cũng dùng địa chỉ nội bộ này để gọi API. Đổi đích rewrite cần khởi động lại Next.
- `ShopProvider` khôi phục phiên qua `/auth/session`. Access token giữ trong bộ nhớ; refresh token nằm trong cookie HttpOnly. Request riêng tư gửi bearer token; backend kiểm cả chữ ký, hạn token, phiên và trạng thái tài khoản. Refresh rotation thực hiện qua `/auth/refresh`.
- Giỏ, wishlist, đơn và cấu hình PC đã lưu gọi API; so sánh sản phẩm là tuỳ chọn UI lưu local. Không dùng localStorage làm nguồn danh tính, quyền hay giá.
- Dữ liệu development có thể là dữ liệu giả trong database. Frontend không tự dựng kết quả nghiệp vụ thành công khi API lỗi. Không đưa DATABASE_URL, JWT hoặc Stripe secret vào `NEXT_PUBLIC_*`.

### Giỏ → báo giá → đặt đơn → thanh toán

1. Thêm giỏ yêu cầu đăng nhập; backend kiểm SKU, số lượng và tồn khả dụng. **Giỏ chưa giữ hàng trong kho.**
2. Checkout gọi `/me/checkout/quote`. Server tự tính giá, coupon và phí từ dữ liệu quản lý; báo giá có hạn **10 phút**.
3. Đặt đơn gửi `quoteId`, phương thức COD/STRIPE và `Idempotency-Key`. Backend kiểm ownership, hạn báo giá, phiên bản giỏ, giá và tồn một lần nữa. Có thay đổi thì yêu cầu lấy báo giá mới.
4. Transaction ghi đơn, payment, reservation, lịch sử và các bản ghi liên quan cùng nhau. Transaction là nhóm thay đổi cùng thành công hoặc cùng bị hủy; tránh tạo đơn nhưng không giữ được hàng. Khóa và điều kiện cập nhật tồn giúp xử lý nhiều khách cùng mua món cuối.
5. Reservation là lượng hàng giữ cho đơn: `khả dụng = onHand - reserved - unavailable`. COD tạo đơn CONFIRMED nhưng tiền vẫn UNPAID. Stripe tạo đơn PENDING_PAYMENT; backend xác minh webhook có chữ ký hoặc retrieve từ provider trước khi cập nhật đã thu tiền.
6. Idempotency key giúp gửi lại cùng thao tác trả cùng đơn; dùng lại key với nội dung khác bị từ chối. Hủy đơn giải phóng giữ tồn đúng một lần; với Stripe phải xác nhận Session hết hạn ở provider trước khi nhả hàng.

Các file chính: [commerce.controller.ts](api/src/modules/commerce/commerce.controller.ts) nhận HTTP, [commerce.service.ts](api/src/modules/commerce/commerce.service.ts) xử lý giỏ/cấu hình, [order.service.ts](api/src/modules/commerce/order.service.ts) xử lý báo giá/đơn, [stripe-payment.service.ts](api/src/modules/commerce/stripe-payment.service.ts) phối hợp thanh toán. Controller nhận request; DTO kiểm hình dạng dữ liệu; guard kiểm danh tính/quyền; service xử lý nghiệp vụ; Prisma truy cập database. [app.module.ts](api/src/app.module.ts) cho biết module nào thực sự được nạp; `api/legacy/` chỉ để đối chiếu.

### Vì sao dữ liệu được tách như vậy?

- **Product và variant/SKU:** Product là trang giới thiệu; SKU là đơn vị bán có lựa chọn, giá và tồn riêng. Giỏ, đơn và tồn tham chiếu variant.
- **Snapshot đơn:** lưu tên hàng, giá và địa chỉ tại thời điểm giao dịch. Đổi catalog hoặc hồ sơ sau này không làm lịch sử đơn thay đổi theo.
- **Tiền VND nguyên:** server dùng BigInt, JSON truyền chuỗi để giữ độ chính xác; không nhân VND với 100. Client không quyết định số tiền phải thu.
- **Trạng thái đơn và payment riêng:** đã trả tiền không có nghĩa đã giao hàng; hủy đơn không tự có nghĩa đã hoàn tiền.
- **Nhiều bảng không có nghĩa mọi nghiệp vụ đã hoàn tất:** COD hiện ở phạm vi tạo/hủy và giữ tồn; Stripe sandbox đã có nhưng refund, xuất kho, giao vận, email thực và quản trị đầy đủ còn giới hạn. Docker/Nginx/CI/CD/AWS là kế hoạch chưa được nghiệm thu deployment.

## Muốn tự đổi giao diện thì sửa ở đâu?

### Lần theo một trang

```text
front/src/app/(store)/page.tsx              # URL /, mở màn hình
  → front/src/features/landing/landing-page.tsx  # Ghép/thứ tự các section
    → components/forge-intro.tsx              # Hero thương hiệu và dịch vụ gọn
    → components/flash-sale-section.tsx       # Một dải sản phẩm từ API
    → components/forge-studio.tsx             # Điểm vào PC Studio
    → components/catalog-directory.tsx        # Tám lối tắt danh mục
    → components/forge-journal.tsx            # Ba bài viết từ API, bìa biên tập
    → components/partner-brands.tsx           # Khối đối tác/thương hiệu demo
```

`app/` là bản đồ URL; `features/` chứa màn hình và logic theo nghiệp vụ; `components/` chứa phần dùng lại. `(store)` là nhóm route dùng chung layout, không xuất hiện trong URL. `layout.tsx` bọc nhiều trang; `loading.tsx`/`error.tsx` xử lý chờ/lỗi. Server Component phù hợp fetch và ghép trang; component cần state, sự kiện hoặc browser API dùng ranh giới `"use client"`. Chi tiết và PC Builder chỉ dùng ảnh sản phẩm; hiệu ứng nghiêng dùng CSS, không tải renderer 3D.

### Bản đồ chỉnh sửa

| Muốn thay đổi | File/thư mục chính |
| --- | --- |
| Màu, font, bo góc, chiều rộng chuẩn | [tokens.css](front/src/styles/tokens.css) |
| CSS đầu vào, nền tảng và bố cục theo route | [globals.css](front/src/app/globals.css), [base.css](front/src/styles/base.css), [route-layout.css](front/src/styles/route-layout.css) |
| Metadata/tên tab trình duyệt, ngôn ngữ | [layout.tsx](front/src/app/layout.tsx) |
| Logo | [brand-logo.tsx](front/src/components/storefront/brand-logo.tsx), ảnh trong `front/public/images/` |
| Header/menu, tìm kiếm, footer | [store-header.tsx](front/src/components/layout/store-header.tsx), [store-search.tsx](front/src/components/layout/store-search.tsx), [store-footer.tsx](front/src/components/layout/store-footer.tsx) |
| Khung chung cửa hàng | [store-layout.tsx](front/src/components/layout/store-layout.tsx) |
| Thứ tự các khối trang chủ | [landing-page.tsx](front/src/features/landing/landing-page.tsx) |
| Hero thương hiệu và giới thiệu PC Studio | [forge-intro.tsx](front/src/features/landing/components/forge-intro.tsx), [forge-studio.tsx](front/src/features/landing/components/forge-studio.tsx) |
| Dải sản phẩm nổi bật | [product-rail.tsx](front/src/features/landing/components/product-rail.tsx), [flash-sale-section.tsx](front/src/features/landing/components/flash-sale-section.tsx) |
| Card và ảnh sản phẩm dùng chung | [product-card.tsx](front/src/components/storefront/product-card.tsx), [product-art.tsx](front/src/components/storefront/product-art.tsx) |
| Danh sách/lọc, chi tiết sản phẩm | [catalog-page.tsx](front/src/features/catalog/catalog-page.tsx), [product-detail.tsx](front/src/features/catalog/product-detail.tsx) |
| Giỏ và checkout | [cart-page.tsx](front/src/features/cart/cart-page.tsx), [checkout-page.tsx](front/src/features/checkout/checkout-page.tsx), [order-summary.tsx](front/src/features/checkout/components/order-summary.tsx) |
| Kết quả và nút thanh toán Stripe | [payment-result.tsx](front/src/features/checkout/payment-result.tsx), [stripe-payment-actions.tsx](front/src/features/checkout/stripe-payment-actions.tsx) |
| Đăng nhập/đăng ký nối API | [auth-live.tsx](front/src/features/auth/auth-live.tsx) |
| Tài khoản, chi tiết đơn | [account-live.tsx](front/src/features/account/account-live.tsx), [order-live.tsx](front/src/features/orders/order-live.tsx) |
| Bố cục PC Studio | [pc-builder-page.tsx](front/src/features/pc-builder/pc-builder-page.tsx) |
| PC ghép ảnh theo SKU/case | [assembled-layers.tsx](front/src/features/pc-builder/components/assembled-layers.tsx), [resolver](front/src/features/pc-builder/lib/assembly-visuals.ts), [bộ ảnh cần bổ sung](front/docs/ASSEMBLY_ASSET_PACK.md) |
| Ảnh sản phẩm và ghép linh kiện | [photo-assembly.tsx](front/src/features/pc-builder/components/photo-assembly.tsx), [hướng dẫn](front/docs/PHOTO_ASSEMBLY.md) |
| Quy tắc tương thích PC | [compatibility.ts](front/src/features/pc-builder/lib/compatibility.ts) |
| Phiên/state mua sắm và hook tải API | [shop-provider.tsx](front/src/providers/shop-provider.tsx), [use-api-resource.ts](front/src/hooks/use-api-resource.ts) |

### Đổi kiểu dáng, dữ liệu và responsive

Phần lớn kiểu dáng nằm trong `className` Tailwind ngay tại component. Ví dụ `grid grid-cols-4 gap-4 max-[768px]:grid-cols-2` tạo bốn cột, chuyển thành hai cột ở màn hình không quá 768 px. Muốn đổi số cột, vị trí hoặc khoảng cách, sửa component chứa bố cục đó.

Muốn đổi nhận diện chung, bắt đầu từ token như `--rf-green`, `--rf-bg`, `--rf-radius`, `--rf-home-width` trong `tokens.css`. Một số component có màu viết trực tiếp nên token chưa phủ mọi chi tiết. Thay card dùng chung sẽ ảnh hưởng nhiều trang; thay một section thường có phạm vi hẹp hơn.

**Đổi bố cục khác với đổi nội dung:** vị trí/kích thước banner sửa ở component; menu, banner, sản phẩm, giá và nội dung công khai hiện lấy từ API/database. Nguồn đọc nằm ở [storefront.service.ts](api/src/modules/storefront/storefront.service.ts). `front/src/catalog/presentation.ts` mô tả kiểu dữ liệu, không phải nơi điền nội dung quản trị. Seed development ở `api/prisma/seed-data/`; sửa seed không tự cập nhật database đang dùng.

Đường dẫn `/images/x.webp` trỏ tới `front/public/images/x.webp`, nhưng ảnh catalog/banner có thể đã được copy vào MEDIA_ROOT và liên kết qua database. Vì vậy, thay ảnh nguồn trong `public/` chưa chắc đổi ảnh API đang trả. Ảnh/model PC Studio vẫn minh họa theo nhóm, chưa bảo đảm ngoại hình hoặc kích thước thật của từng SKU.

Nên đổi từng lớp: token màu → logo/header → trang chủ → card → các trang tính năng. Khi chỉ sửa hình thức, giữ contract dữ liệu và hàm gọi API hiện có. Kiểm desktop/mobile, bàn phím, loading/error; trong `front/` chạy `npm.cmd run lint`, `npm.cmd run format:check`, `npm.cmd run build`. Nếu đổi đăng nhập/giỏ/checkout, kiểm thêm hành trình thật theo [hướng dẫn tích hợp](docs/STOREFRONT_INTEGRATION.md); build qua chưa chứng minh nghiệp vụ chạy đúng.

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

## Docker, CI/CD, Nginx và bộ triển khai AWS

Bắt đầu bằng [DOCKER_GUIDE](docs/DOCKER_GUIDE.md), sau đó đọc [INFRASTRUCTURE_GUIDE](docs/INFRASTRUCTURE_GUIDE.md) để hiểu cách làm, luồng dữ liệu và trách nhiệm từng thành phần. [AWS foundation](infra/aws/README.md) và [deploy helpers](infra/deploy/README.md) chuẩn bị cho staging/demo khi có account/domain. Production preview chỉ đọc, chưa nhận đơn; các kiểm chứng local và giới hạn cloud nằm trong [PROJECT_STATUS](docs/PROJECT_STATUS.md).
