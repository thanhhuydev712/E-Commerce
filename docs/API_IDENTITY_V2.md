# Backend v2 — nền tảng và danh tính

Ngày **06/11/2026**. Tài liệu mô tả giai đoạn 0–1 trong [thiết kế backend](BACKEND_DESIGN.md). Runtime dùng một Prisma Client v2; bên cạnh Auth/Accounts/Access và Platform đã bổ sung [catalog/giá/ảnh/kho cơ bản](API_CATALOG_V2.md) ở giai đoạn 2. Không cần Stripe key để boot.

## 1. Phạm vi và mã v1

`api/legacy/` giữ nguyên mã v1 để đối chiếu, không thuộc build/runtime/test v2. Không đăng ký controller v1 hoặc trỏ API cũ sang `legacy_v1` để ghi. Catalog đã có endpoint v2 riêng; cart/order COD đã chuyển ở phạm vi [Commerce](API_STOREFRONT_COMMERCE_V2.md); Stripe processor v2 chưa có.

PrismaService import client từ `api/generated/prisma-v2`, cấu hình schema rõ ràng qua `DATABASE_SCHEMA`, mặc định public. Không còn helper cleanDatabase trong runtime. Không sửa generated code bằng tay. Build loại `src/generated` cũ; không cần generate client legacy để chạy API v2.

## 2. Khởi chạy

Trong `api/`, điền cấu hình ở `.env` theo `.env.example` và database v2 đã migrate:

```powershell
npm.cmd run prisma:generate
npm.cmd run build
npm.cmd run seed:access
npm.cmd run start:prod
```

`JWT_SECRET` và `JWT_REFRESH_SECRET` bắt buộc khác nhau, mỗi secret ít nhất 32 ký tự; không có fallback bí mật mặc định. Access TTL mặc định 900 giây, refresh session có hạn tuyệt đối 604800 giây (7 ngày), không gia hạn vô tận khi rotate. Cookie Secure khi NODE_ENV=production; origin production yêu cầu HTTPS. Không lưu secret trong store_settings.

`seed:access` là lệnh rõ ràng, không chạy trong mỗi request hoặc tự seed lúc boot. Seed idempotent CUSTOMER/ADMIN, bốn permission danh tính `accounts.read`, `accounts.manage`, `access.read`, `access.manage` và sáu permission giai đoạn 2 (tổng 10, xem [catalog](API_CATALOG_V2.md)); gắn permission cho role ADMIN nhưng **không gán ADMIN cho người dùng nào**. System role grants không sửa qua API; custom role có thể được cấp các permission đã seed. Một tài khoản đã có quyền quản trị mới được quản lý role/status qua API; bootstrap admin cho tài khoản cụ thể là tác vụ cần yêu cầu riêng, không tự nâng quyền tài khoản đã migrate.

Swagger: `/api/docs`, JSON: `/api/docs-json`; API prefix `/api/v1`. Liveness `/api/v1/health`; readiness `/api/v1/health/ready` kiểm kết nối database. Khi đóng gói production phải có cả `dist/` và generated client cùng runtime dependencies. Tài liệu hạ tầng/deployment được xử lý riêng, không có deploy trong giai đoạn này.

## 3. Contract HTTP

Thành công: `{ data, meta: { requestId } }`. Lỗi: `{ error: { code, message, details? }, meta: { requestId } }`. Header `X-Request-Id` khớp body; không ghi token, password, cookie hoặc Prisma parameter vào error response/log. Lỗi DB bất ngờ trả message tổng quát. Money BigInt được mapper chuyển thành chuỗi số nguyên; không đổi JSON.stringify toàn ứng dụng.

Profile gồm `id`, `email`, `firstName`, `lastName`, `phone`, `status`, `emailVerifiedAt`, `createdAt`, `updatedAt`, `roleCodes`, `permissions`. Không còn field enum `role` đơn. Không có passwordHash, refresh token/hash, family ID trong profile/session list. Các identifier chấp nhận UUID native PostgreSQL, bao gồm ID xác định từ migration không mang RFC version cụ thể.

## 4. Auth và cookie

Các auth POST yêu cầu header **Origin khớp chính xác** ALLOWED_ORIGINS, kể cả khi gọi bằng CLI hoặc Swagger. Điều này bảo vệ các endpoint dùng refresh cookie và tránh login CSRF. CORS có credentials và Content-Type/Authorization; frontend gửi cookie với credentials. Refresh cookie `refresh_token` là HttpOnly, SameSite=Lax, path `/api/v1/auth`; access token chỉ trả trong body và dự kiến giữ trong bộ nhớ frontend.

Nếu dùng Try it out trên Swagger ở origin API (ví dụ localhost:3001), thêm chính origin đó vào ALLOWED_ORIGINS; browser không cho giả header Origin thành origin frontend. CLI có thể gửi Origin đã cho phép một cách rõ ràng. Không dùng wildcard hoặc tắt Origin guard để tiện thử API.

| Method và route dưới `/api/v1` | Request | Response data / hành vi |
| --- | --- | --- |
| POST `/auth/register` | email, password, firstName?/lastName? | 201: accessToken, expiresIn, user; Set-Cookie refresh. Chỉ tạo CUSTOMER, field role/quyền từ client bị từ chối |
| POST `/auth/login` | email, password, deviceLabel? | 200: accessToken, expiresIn, user; tạo session riêng; hash bcrypt cũ đã migrate vẫn dùng được |
| POST `/auth/session` | Cookie refresh + Origin | 200: requiresRefresh và accessToken/expiresIn nếu cửa sổ access ban đầu còn hiệu lực. Chỉ đọc session, không rotate/Set-Cookie và không kéo dài hạn access |
| POST `/auth/refresh` | Cookie refresh, không nhận token qua body | 200: token mới và cookie xoay; không nhận access token làm refresh |
| POST `/auth/logout` | Bearer access + Origin | 200: message; thu hồi session hiện tại và xóa cookie |
| GET `/auth/me` | Bearer access | Principal: id, sessionId, email, roleCodes, permissions |
| POST `/auth/forgot-password` | email | 202: message chung cho tài khoản có/không tồn tại; không trả token |
| POST `/auth/reset-password` | token, newPassword | 200: message; token một lần, thu hồi mọi phiên và reset challenge chưa dùng |
| POST `/auth/verification/request` | email | 202: message chung, gửi challenge khi tài khoản phù hợp |
| POST `/auth/verification/confirm` | token | 200: xác minh email; token sai purpose/hết hạn/đã dùng bị từ chối |

Access/refresh JWT có secret, audience và type riêng; verify chỉ cho HS256. Session lưu SHA-256 của token ngẫu nhiên/đã ký, không lưu token thô. Mỗi request xác thực đọc lại session, user ACTIVE và role/permission từ database. Logout, reset/đổi password, khóa/archive tài khoản và thay đổi quyền có hiệu lực với các access token đã cấp theo trạng thái server.

Bổ sung 07/11/2026: frontend dùng `/auth/session` để khôi phục sau reload. Token được khôi phục có iat/exp neo vào lần cấp refresh gần nhất, không tạo cửa sổ mới; khi hết cửa sổ, server trả requiresRefresh và client mới gọi rotate. Bootstrap với token hiện hành chỉ đọc; request bị huỷ do chuyển trang không tiêu thụ cookie. Token cũ có chữ ký hợp lệ cũng đi qua chính sách revoke family khi reuse; session revoked/khóa tài khoản bị từ chối. Bootstrap không ghi Set-Cookie; access token vẫn chỉ ở bộ nhớ.

Refresh được serialize dưới khóa user. Token đã rotate nhưng được dùng lại sẽ revoke family; revocation phải commit trước khi trả 401. **Hai refresh đồng thời có thể khiến family bị thu hồi theo chính sách nghiêm ngặt**: frontend phải dùng một refresh đang chạy chung (single-flight), không retry song song cookie cũ. Chưa có grace window; không coi reuse là refresh thành công.

Password mới tối thiểu 12 ký tự và tối đa 72 byte UTF-8, tránh bcrypt cắt ngầm mật khẩu dài. Login/đổi password vẫn chấp nhận mật khẩu cũ ngắn hơn để người dùng đã migrate đăng nhập và nâng cấp. Username/email được normalize ở server; lỗi đăng nhập không phân biệt sai password với tài khoản khóa/không tồn tại.

## 5. Email challenge hiện là adapter local

`ChallengeDelivery` lưu tối đa 100 thông điệp trong bộ nhớ để kiểm thử local, không gửi email thật, không log token và không có HTTP endpoint đọc token. E2E lấy token trực tiếp từ provider trong tiến trình test để kiểm tra round trip reset/verify.

Ở production, request challenge trả 503 `CHALLENGE_DELIVERY_UNAVAILABLE` cho tới khi có adapter email thực. Không đổi NODE_ENV thành development để bỏ qua. Không mô tả chức năng này như email giao dịch đã tích hợp. Giới hạn hiện tại: thông điệp local mất khi restart; chưa có gửi lại đáng tin cậy qua provider/outbox và chưa có UI dev inbox. Đây là điểm tích hợp cần làm trước khi mở reset/verify cho khách thật.

## 6. Hồ sơ, phiên và địa chỉ

Mọi route bên dưới cần Bearer access, lấy owner từ danh tính server, không lấy userId trong body.

| Method và route | Hành vi |
| --- | --- |
| GET/PATCH `/me` | Đọc/sửa firstName, lastName, phone; không cho đổi role/status/email qua profile |
| PATCH `/me/password` | currentPassword + newPassword, xác minh password cũ; thu hồi mọi session sau thay đổi |
| POST `/me/archive` | currentPassword; archive tài khoản có audit, không hard-delete dữ liệu hoặc lịch sử |
| GET `/me/sessions` | Danh sách phiên còn hiệu lực, có id/label/thời gian; không có hash/token |
| DELETE `/me/sessions/:id` | Thu hồi một phiên của chính mình; session người khác trả 404 |
| GET/POST `/me/addresses` | Liệt kê địa chỉ đang dùng/tạo mới; countryCode chuyển uppercase |
| PATCH/DELETE `/me/addresses/:id` | Sửa/archived địa chỉ của chính mình; ID khác owner trả 404 |

Địa chỉ create cần recipientName, phone, countryCode 2 ký tự, line1; hỗ trợ label/line2/region/locality/postal và hai default flag. Patch không cho null ở các trường bắt buộc; nullable fields có thể clear. Các mutation địa chỉ khóa user, đổi default cũ/mới cùng transaction để không vi phạm partial unique khi request đồng thời. Archive địa chỉ bỏ default flag; không sửa snapshot đơn cũ.

## 7. Quản trị và phân quyền

| Route | Permission |
| --- | --- |
| GET `/admin/accounts?page=1&limit=20` | accounts.read; limit tối đa 100; data gồm items/total/page/limit |
| GET `/admin/accounts/:id` | accounts.read |
| PATCH `/admin/accounts/:id/status` | accounts.manage; status ACTIVE/LOCKED/ARCHIVED; không tự đổi status của mình qua route admin |
| GET `/admin/access/roles`, `/admin/access/permissions` | access.read |
| POST `/admin/access/roles` | access.manage; tạo role custom code/name, không tạo system role |
| PUT `/admin/access/roles/:id/permissions` | access.manage; thay grant của custom role bằng danh sách code hợp lệ |
| PUT `/admin/access/users/:id/roles` | access.manage; thay role cho user ACTIVE, không sửa role của chính người thao tác |

Các thay đổi quyền/status có audit trong cùng transaction; nhóm thao tác này serialize bằng advisory lock để không vô hiệu hóa admin ACTIVE cuối cùng do hai request chạy đồng thời. Prefix admin không thay guard; role ADMIN không có bypass ngầm ngoài permission đã gắn. Guard đọc quyền mới trên request kế tiếp, không đợi JWT hết hạn.

## 8. Kiểm tra và giới hạn

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e:isolated
```

Runner E2E ưu tiên TEST_DATABASE_URL, nếu không có thì dùng kết nối development DATABASE_URL. Nó tạo schema ngẫu nhiên `codex_auth_test_*`, tạo DDL và fixture giả trong schema đó, cấu hình app Prisma vào đúng schema, sau test chỉ drop schema do nó vừa tạo. Không truncate/reset public hoặc legacy_v1. Runner từ chối NODE_ENV=production; không dùng kết nối production để chạy test. Sau sự cố tiến trình bị kill, kiểm tra schema test mồ côi trước khi dọn; không xóa schema chỉ dựa vào prefix nếu chưa chứng minh là artifact test.

E2E kiểm response/cookie, role injection, ownership, refresh lặp/đồng thời, permission bị thu hồi sau phát token, default address đồng thời, khóa/last admin, reset/verify một lần, password/archive và rate limit. Unit kiểm env, secret tách riêng và serialization BigInt vượt Number.MAX_SAFE_INTEGER. Mốc kết quả thật tại [PROJECT_STATUS.md](PROJECT_STATUS.md).

Catalog/kho cơ bản và upload local đã có ở giai đoạn 2. Chưa triển khai: checkout/đơn/payment/refund/Stripe v2, kết nối frontend thật, email production, object storage/import ảnh cũ, bootstrap admin theo tài khoản, chống brute-force phân tán qua nhiều instance và deployment. Các phần này không được xem là hoạt động chỉ vì đã có bảng hoặc mã v1 trong archive.
