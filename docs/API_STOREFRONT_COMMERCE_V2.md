# Storefront và đặt hàng v2 — 06/11/2026

Các route dưới đây nằm trong AppModule hiện tại, prefix `/api/v1`. JSON thành công dùng `{ data, meta }`; tiền trả về chuỗi số nguyên VND. Dữ liệu development nằm ở PostgreSQL, không lấy từ fixture frontend.

Cập nhật 08/11/2026: đã bổ sung [Stripe Checkout v2 sandbox](STRIPE_V2.md), gồm Session từ giá đơn, webhook chữ ký và phục hồi/expiry. Giới hạn refund và giao vận vẫn áp dụng.

## Luồng dữ liệu

Next.js server đọc `GET /storefront` bằng `API_INTERNAL_URL` lúc có request. Browser gọi `/api/v1` cùng origin qua rewrite của Next ở local. CatalogProvider chứa snapshot public; ShopProvider khôi phục phiên bằng `/auth/session` với HttpOnly cookie và giữ access token trong bộ nhớ. Bootstrap chỉ đọc, giữ nguyên hạn access ban đầu; chỉ rotate qua `/auth/refresh` khi cửa sổ access hết hạn. Sau đó các thao tác tài khoản/giỏ/đơn gọi API có bearer token. So sánh sản phẩm là tuỳ chọn giao diện lưu local, không dùng làm danh tính hay nguồn giá.

`GET /storefront` chỉ xuất sản phẩm published/ACTIVE, thương hiệu/danh mục hợp lệ, SKU ACTIVE có giá VND; giá và tồn khả dụng lấy từ bảng giá/balance. Nội dung, bài viết, banner, bộ sưu tập và bố cục đọc từ database. Reviews chỉ xuất bản ghi PUBLISHED, không đưa thông tin tài khoản người viết ra snapshot. Snapshot giới hạn 1.000 sản phẩm, 100 bài và 100 trang; cần chuyển sang API phân trang khi catalog lớn hơn. Đây là trade-off để nối giao diện hiện tại, chưa phải thiết kế tối ưu cho catalog lớn.

## API cần đăng nhập

| Route tương đối | Hành vi |
| --- | --- |
| `GET /me/cart` | Giỏ ACTIVE của chính người dùng |
| `PUT /me/cart` | Đặt số lượng các dòng gửi lên; số lượng 0 xoá dòng |
| `POST /me/cart/items`, `/me/cart/build` | Cộng SKU/cấu hình vào giỏ; kiểm trạng thái, giá và tồn |
| `POST /me/checkout/quote` | Báo giá từ server, địa chỉ/điện thoại, phí và coupon; hiệu lực 10 phút |
| `POST /me/orders` | `{ quoteId, method: "COD" hoặc "STRIPE" }`, bắt buộc `Idempotency-Key` |
| `POST /me/orders/:id/stripe-checkout` | Tạo/tái sử dụng Stripe Checkout Session của chủ đơn; trả URL hoặc null khi phiên đã đóng |
| `GET /me/orders`, `/me/orders/:id` | Đơn thuộc tài khoản, snapshot tiền/địa chỉ và lịch sử thực |
| `POST /me/orders/:id/cancel` | Huỷ khi còn đủ điều kiện, giải phóng reservation đúng một lần |
| `GET /me/wishlist`, `POST /me/wishlist/:productId` | Danh sách yêu thích và bật/tắt sản phẩm |
| `GET/POST /me/builds`, `DELETE /me/builds/:id` | Cấu hình PC có FK người sở hữu và sản phẩm, tối đa 8 slot |
| `GET/POST /me/support` | Ticket và thông điệp gửi hỗ trợ, orderId nếu có phải thuộc người dùng |
| `GET /me/notifications`, `POST /me/notifications/read` | Thông báo riêng tư và đánh dấu tất cả đã đọc |
| `GET/PUT /me/preferences` | Tuỳ chọn email marketing |
| `GET/POST /me/reviews` | Chỉ đánh giá dòng hàng đã COMPLETED; tạo ở PENDING để duyệt |
| `POST /me/warranty/lookup` | Tra serial thuộc đơn của tài khoản; không tra công khai bằng số điện thoại |

Profile, địa chỉ, mật khẩu và phiên dùng [API danh tính](API_IDENTITY_V2.md). `GET /admin/store/overview` yêu cầu cả `accounts.read` và `catalog.read`; tổng quan chỉ đọc số liệu thực. Đây chưa phải hệ thống quản trị đầy đủ.

## Giá, tồn và chống lặp

Giỏ chưa giữ tồn. Đặt đơn khoá tài khoản, cấu trúc catalog, promotion nếu dùng và các sản phẩm theo thứ tự ổn định. Backend đọc lại báo giá, kiểm hash/cart version, cập nhật balance theo version/điều kiện đủ tồn, tạo reservation COMMITTED và ledger RESERVE trong cùng transaction với đơn, payment UNPAID, lịch sử, notification, audit và idempotency key. Huỷ đơn tạo RELEASE một lần; on-hand không giảm vì chưa xuất kho.

Giá/số lượng/chiết khấu từ browser không được dùng làm nguồn tiền. VND dùng BigInt ở server, chuỗi integer trên JSON. Discount phân bổ xuống từng dòng bằng phép chia nguyên và dồn phần dư vào dòng cuối. Standard 30.000₫, miễn phí từ 5.000.000₫ tạm tính; express cộng 20.000₫ vào mức standard sau miễn phí. Các tham số phí nằm ở `storefront.presentation`, không lấy phí do client gửi.

Hai request cùng idempotency key/nội dung trả cùng đơn; dùng lại key với nội dung khác trả 409. Quote hết hạn, giá/giỏ thay đổi hoặc hết tồn trả 409 để lấy lại quote. Backend không tự chấp nhận số tiền cũ.

## Giới hạn hiện tại

- COD hoạt động ở mức tạo/huỷ đơn và giữ tồn. Chưa có xuất kho, đơn vị vận chuyển hoặc đối soát thu hộ; không gọi đây là vận hành bán hàng hoàn chỉnh.
- Stripe Checkout v2 chỉ bật khi đủ test key/webhook secret; thiếu cấu hình trả 503 `STRIPE_TEST_NOT_READY`. Xác nhận tiền qua webhook hoặc retrieve từ provider, không ghi paid từ URL. [Thiết lập, kiểm thử và giới hạn](STRIPE_V2.md).
- Giỏ yêu cầu tài khoản; khách bấm thêm được chuyển đến đăng nhập. Chưa merge giỏ khách.
- Yêu cầu đổi trả/bảo hành trên UI được lưu thành support ticket, chưa phải phê duyệt return/refund/warranty. Chứng từ/tracking chỉ xuất dữ liệu đã có, không tạo lịch sử giả.
- Recovery có API nhưng chưa cấu hình gửi email thực. Media local cần volume/storage bền vững và cơ chế dọn file mồ côi trước triển khai.
- Kiểm thử hiện chạy local/dev với PostgreSQL thật trong schema riêng; chưa nghiệm thu Nginx, Docker, CI/CD hay AWS.

Xem [hướng dẫn tích hợp và test](STOREFRONT_INTEGRATION.md) và [hiện trạng có bằng chứng](PROJECT_STATUS.md).
