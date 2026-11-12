# Rà soát và hoàn thiện backend — 08/11/2026

Phạm vi đang thực hiện: backend luồng mua hàng và các nghiệp vụ quản trị liên quan. Đây không phải xác nhận hoàn thành toàn bộ roadmap hoặc tất cả bảng dữ liệu. Không thay đổi phần header/mobile/auth UI đang được sửa ngoài nhiệm vụ; không tự commit/push hoặc tạo tài nguyên AWS.

## Kiểm tra trước thay đổi nghiệp vụ

- Đã đối chiếu AppModule, controllers, permissions, Prisma schema, thiết kế transaction và các bằng chứng trước. Runtime dùng Prisma v2; legacy không được nạp.
- Prisma validate/generate qua; lint và 12 unit qua. Build ban đầu lỗi EPERM do ACL trên `api/dist` thuộc tài khoản sandbox cũ. Biên dịch riêng qua; đã sửa scripts build/start/seed/test/smoke dùng `dist-local-<hash-tài-khoản>` trên Windows và giữ `dist` trên Linux. Build lại hai lần liên tiếp qua; không đổi ACL hoặc xóa artifact cũ.
- Đối soát DB chỉ đọc: đủ 104/104 bảng; ledger/reservation/order total/payment mismatch và unvalidated constraint đều 0; VND minor_unit=0; 33 bảng có dữ liệu, 71 bảng chưa phát sinh nghiệp vụ. Không ghi báo cáo đè vào DATABASE_AUDIT lịch sử, không thêm giao dịch giả.
- Đang chạy toàn bộ API E2E tuần tự trên schema test riêng, thời hạn test 180 giây cho database ở xa. Không tính test chưa xong là đạt.
- Kiểm tra cấu hình theo cờ có/không, không in giá trị: có Stripe test key và webhook secret; chưa có SMTP/email hoặc AWS/S3 credentials.
- Npm audit runtime: backend có 3 mục High theo chuỗi @nestjs/platform-express → multer/body-parser, frontend 0. Npm registry xác nhận adapter 12.3.0 sử dụng multer 2.5.0 và Express 5.3.0; sẽ nâng bản tương thích và kiểm lại, không dùng audit fix --force hoặc bỏ qua peer dependency.
- Smoke SDK sandbox trực tiếp: PaymentIntent bằng token test `pm_card_visa`, 1.000.000 VND, capture SUCCEEDED; refund toàn phần SUCCEEDED, cùng key trả cùng refund và retrieve khớp tiền/currency. Không dùng database, thẻ thật hoặc customer/receipt email. Lần thử đầu phát hiện tham số SDK v23 đã đổi thành allowed_payment_method_types; đã đối chiếu types cục bộ và sửa trước khi kết luận. Chưa tính đây là nghiệm thu refund trong ứng dụng hoặc Checkout browser end-to-end.

## Khoảng trống được xác nhận từ mã

| Nhóm | Đang có | Cần hoàn thiện |
| --- | --- | --- |
| Auth/tài khoản/quyền | API v2, session/cookie/ownership, reset/verify qua challenge | Adapter gửi email thật, gửi bền vững/retry; cần thông tin dịch vụ |
| Catalog/giá/media/kho | CRUD backend, VND, ảnh local, balance/ledger và adjustment | Storage bền vững khi deploy; nghiệp vụ kho nâng cao sau MVP |
| Cart/checkout/đơn | COD/Stripe, server quote, reserve, hủy và expiry | Quản trị đơn, xuất kho/giao hàng, đối soát thu hộ COD |
| Stripe | Checkout, chữ ký, chống lặp, phục hồi mất webhook | Refund API/ledger/webhook/retry, luồng duyệt và đối soát ngoại lệ |
| Admin | Catalog/accounts/access/inventory APIs; tổng quan cửa hàng | Quyền quản trị đơn/thanh toán/hỗ trợ và UI thao tác tương ứng |
| Hậu mãi/chứng từ | Support ticket, lookup serial theo ownership | Return/warranty workflow và chứng từ đầy đủ; cần chốt phạm vi/chính sách |
| Hạ tầng | Tài liệu thiết kế | Docker/CI/Nginx/AWS theo DEPLOYMENT_PLAN; không suy ra đã deploy |

Kết quả sau cài đặt, lệnh kiểm tra và giới hạn còn lại sẽ cập nhật tại PROJECT_STATUS và báo cáo xác minh. Những phần phụ thuộc credential hoặc chính sách chưa chốt sẽ được ghi riêng, không mô tả như tích hợp thực tế đã hoạt động.
