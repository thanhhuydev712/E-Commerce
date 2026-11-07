# Thiết lập và test thủ công — 07/11/2026

Hướng dẫn này dành cho workspace hiện tại trên Windows/PowerShell. Đã kiểm chỉ trạng thái cấu hình, không in secret: backend readiness và proxy frontend trả 200, catalog có 186 sản phẩm. Database đã migration/seed; không cần import lại để test COD.

## 1. Còn thiếu gì?

| Phần | Hiện tại | Việc cần làm |
| --- | --- | --- |
| PostgreSQL, JWT, origin frontend | Đã cấu hình, JWT secrets hợp lệ và khác nhau | Giữ nguyên để test COD |
| DATABASE_SCHEMA | Không khai báo riêng; mặc định public | Có thể ghi rõ `DATABASE_SCHEMA=public`, không bắt buộc |
| MEDIA_ROOT | Mặc định `.local-media`, đã có ảnh seed | Có thể ghi rõ `MEDIA_ROOT=.local-media`, không bắt buộc |
| FE API URL | Mặc định `http://127.0.0.1:3001`; proxy đang hoạt động | Chỉ cần `.env.local` nếu muốn đổi đích |
| Stripe | Có test secret key; thiếu signing secret và processor/webhook v2 | Cần triển khai phần xử lý v2, không chỉ điền thêm env |
| Email reset/verify | Adapter local, chưa gửi email thật | Cần tích hợp dịch vụ email để test nhận thư |
| Admin | Đăng ký tạo CUSTOMER | Dùng tài khoản đã được cấp quyền; seed không tự nâng quyền |

## 2. Nạp cấu hình và dữ liệu

`api/.env` được backend nạp. Giữ DATABASE_URL/JWT_SECRET/JWT_REFRESH_SECRET đang có. Các giá trị local có thể ghi rõ:

```dotenv
NODE_ENV=development
PORT=3001
DATABASE_SCHEMA=public
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
MEDIA_ROOT=.local-media
```

FE hiện không cần `.env.local`. Nếu muốn khai báo rõ, tạo `front/.env.local`:

```dotenv
API_INTERNAL_URL=http://127.0.0.1:3001
```

URL trên chỉ có host/cổng, không thêm `/api/v1`. Khởi động lại ứng dụng tương ứng sau khi sửa env. DATABASE_URL/JWT/Stripe secret thuộc backend, không đưa vào NEXT_PUBLIC_*.

Luồng dữ liệu: JSON seed → Prisma/PostgreSQL → API → CatalogProvider/ShopProvider → giao diện. Không import JSON seed hoặc Prisma Client vào FE.

**Chỉ chạy đoạn sau khi cần nạp seed/cập nhật database development; database hiện tại đã làm xong bước này.** Dùng đúng database development đã chọn trong DATABASE_URL. Migration cũ có xử lý dữ liệu legacy, không chạy trên database kinh doanh khác.

```powershell
Set-Location D:\Cursor\E-Commerce\api
# npm.cmd ci   # Chỉ cần khi chưa cài dependencies hoặc lockfile thay đổi
npm.cmd run prisma:generate
npm.cmd run prisma:validate
npx.cmd prisma migrate deploy
npm.cmd run build
npm.cmd run seed:access
npm.cmd run seed:storefront -- --plan
npm.cmd run seed:storefront -- --apply
node prisma/audit-storefront.cjs --write-report
```

`migrate deploy` áp dụng SQL chưa chạy; `seed:access` nạp roles/permissions; `seed:storefront` nạp sản phẩm/giá/kho/nội dung và copy ảnh local. Seed giữ bản ghi cũ và không nhân đôi tồn khi chạy lại. Không cần nhập từng file SQL hay JSON bằng tay. Bảng orders/payments/shipment/refund có thể trống trước khi nghiệp vụ phát sinh.

## 3. Khởi động và kiểm tra kết nối

Nếu hai URL ở cuối phần này đã mở được, dùng server đang có. Nếu chưa chạy, mở hai terminal riêng:

```powershell
# Terminal 1 — backend
Set-Location D:\Cursor\E-Commerce\api
npm.cmd run start:dev
```

```powershell
# Terminal 2 — frontend
Set-Location D:\Cursor\E-Commerce\front
# npm.cmd ci   # Nếu chưa có dependencies
npm.cmd run dev
```

Kiểm tra:

- Backend: http://localhost:3001/api/v1/health/ready → 200.
- FE proxy: http://localhost:3000/api/v1/storefront → JSON có `data.products`.
- Giao diện: http://localhost:3000 → có sản phẩm/giá/ảnh.
- Swagger: http://localhost:3001/api/docs.

Nếu báo EADDRINUSE, cổng đã có server: dùng tiến trình hiện tại hoặc dừng đúng terminal cũ rồi chạy lại; không mở thêm bản trên cổng khác khi env chưa đổi. Dùng `localhost:3000` để origin khớp cấu hình auth.

## 4. Test trên trình duyệt theo thứ tự

1. **Catalog:** mở trang chủ, tìm Ryzen, vào sản phẩm, đổi biến thể RAM. Giá/tồn thay theo SKU; biến thể hết hàng được báo rõ. Trang sản phẩm không tồn tại hiện trang 404.
2. **Đăng ký:** vào `/register`, dùng tên/email giả và mật khẩu mới ít nhất 12 ký tự, tối đa 72 byte UTF-8. Ví dụ email `tester01@example.test`, mật khẩu dùng riêng cho test. Bấm Tạo tài khoản. Kỳ vọng vào tài khoản CUSTOMER; F5 vẫn nhận diện đúng người dùng.
3. **Giỏ hàng:** chọn một sản phẩm còn tồn, thêm 1 sản phẩm, mở `/cart`, tăng/giảm số lượng rồi F5. Kỳ vọng số lượng vẫn lưu. Giỏ chưa giữ tồn; chưa phát sinh đơn chỉ từ việc thêm giỏ.
4. **Hồ sơ/địa chỉ:** vào `/account/profile`, sửa tên/số điện thoại; vào `/account/addresses`, tạo người nhận `Khách Test`, điện thoại `0900000000`, địa chỉ `123 Đường Kiểm Thử`. Lưu rồi F5. Kỳ vọng dữ liệu vẫn còn.
5. **PC Studio:** vào `/pc-builder`, dùng cấu hình đề xuất, bấm Lưu cấu hình, đặt tên `PC Test lần 1`. Mở `/pc-builder/saved`, F5 và mở lại bản lưu. Kỳ vọng cấu hình nằm trong tài khoản. Kiểm tương thích chỉ dựa vào thông số đã có, chưa xác minh phần cứng/BIOS thực tế.
6. **Checkout:** vào `/checkout`, nhập đủ thông tin giao hàng giả. Chọn tiêu chuẩn hoặc nhanh, nhập mã RIGFORGE5 rồi Áp dụng. Kỳ vọng server kiểm mã; mã sai báo lỗi. Tiêu chuẩn 30.000₫, miễn phí khi tạm tính đạt 5.000.000₫; nhanh cộng thêm 20.000₫. Coupon có giới hạn sử dụng, không phải mọi request đều được giảm.
7. **Đặt COD:** bấm Tạo đơn hàng COD, chờ chuyển sang kết quả. Kỳ vọng có mã đơn; status backend CONFIRMED, thanh toán vẫn chưa thu tiền. F5 rồi vào `/account/orders`: đơn còn nguyên. Không có thông báo đã thanh toán thành công bằng thẻ.
8. **Huỷ đơn:** mở chi tiết đơn vừa tạo, bấm Hủy đơn hàng. Kỳ vọng CANCELLED, vẫn giữ lịch sử; lượng tồn khả dụng đã giữ được trả lại. Đơn COD chưa thu tiền không có hoàn tiền giả. Mã coupon demo được trả lại lượt khi huỷ theo quy tắc hiện có.
9. **Tài khoản khác:** đăng xuất và đăng ký tài khoản B. Kỳ vọng giỏ/địa chỉ/đơn/cấu hình/yêu thích của A không xuất hiện ở B. CUSTOMER vào `/admin` bị từ chối quyền; đây là hành vi đúng.
10. **Hỗ trợ/ưu đãi/bảo hành:** gửi ticket tại `/account/support`, đổi checkbox ở `/account/notifications`, F5 để kiểm đã lưu. Serial chưa thuộc đơn của mình trả không tìm thấy. Form bảo hành/đổi trả hiện tạo yêu cầu hỗ trợ, chưa có phê duyệt hay hoàn tiền tự động.

Trong DevTools → Network, lọc `/api/v1`: thao tác có request thật. POST tạo thường 201, GET/PUT/PATCH thành công thường 200; 401 khi chưa đăng nhập, 403 khi thiếu quyền, 409 khi giá/tồn/coupon đã thay đổi. Nếu có lỗi, ghi URL, method, status và message response; không cần gửi token/cookie.

## 5. Test API và xem dữ liệu

Swagger có thể thử API tại `/api/docs`. Nếu dùng Postman, import OpenAPI JSON từ:

```text
http://localhost:3001/api/docs-json
```

Auth POST cần header `Origin: http://localhost:3001` hoặc origin được phép. Login trả `data.accessToken`; dùng nó làm Bearer cho `/me/...`. Refresh cookie nằm trong cookie jar, không dùng access token làm refresh token. Đặt đơn API cần quoteId từ `/me/checkout/quote` và Idempotency-Key; không tự gửi giá/tổng tiền từ client.

Để xem database, từ `api/` chạy `npx.cmd prisma studio`. Đối chiếu `orders`, `order_items`, `payments` (COD UNPAID), `stock_reservations`, `inventory_balances`, `inventory_movements`, `saved_pc_builds` và `saved_pc_build_components`. Dùng để xem dữ liệu; tạo đơn/đổi tồn qua API để ledger và totals nhất quán.

## 6. Test tự động

Backend (từ `api/`):

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e:isolated
npm.cmd run test:fullstack
```

Frontend (từ `front/`, backend đã build):

```powershell
npm.cmd run lint
npm.cmd run format:check
npm.cmd run build
npm.cmd run test:e2e
```

Nếu Playwright báo thiếu browser, chạy `npx.cmd playwright install chromium` trong `front/`. Chạy tuần tự; fullstack runner có khoá độc quyền, dùng cổng 3002/3401 và schema test ngẫu nhiên. TEST_DATABASE_URL nếu có được ưu tiên; tài khoản test cần quyền tạo schema. Runner không truncate hoặc seed public/legacy. PostgreSQL từ xa có thể làm suite mất nhiều phút.

## 7. Stripe và email chưa test đầy đủ ở đợt này

Stripe SDK đã có trong backend, test key đã có trong `api/.env`. Còn thiếu `STRIPE_WEBHOOK_SECRET` và code processor/webhook v2: tạo thanh toán, xác minh chữ ký/raw payload, xử lý event lặp, đối chiếu tiền/currency và cập nhật trạng thái. Hiện request STRIPE trả 503 STRIPE_TEST_NOT_READY; chỉ điền signing secret không bật được checkout Stripe.

API key và webhook signing secret là hai loại khác nhau; signing secret gắn với endpoint/listener nhận sự kiện. Khi processor hoàn thiện, secret backend đặt trong `api/.env` và restart backend. [Stripe API keys](https://docs.stripe.com/keys), [Stripe webhooks](https://docs.stripe.com/webhooks).

Reset/verify email chưa có provider gửi thư và chưa có dev inbox, nên chưa test được nhận email bằng hộp thư thật. Giao vận/thu hộ, refund/invoice issuance và duyệt hậu mãi cũng chưa hoàn chỉnh; không coi thông báo tạo ticket là đã phê duyệt.
