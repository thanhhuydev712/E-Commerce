# Khôi phục mật khẩu cho tài khoản demo trên AWS

## Phạm vi

Chỉ các email tài khoản thử do operator cho phép mới được nhận liên kết. Website vẫn chạy `PREVIEW_READ_ONLY=true` và `INTERACTIVE_DEMO=true`; đăng ký, xác minh email công khai, đơn hàng và thanh toán vẫn đóng. Cờ `PASSWORD_RECOVERY_ENABLED` mặc định `false` ở cả frontend, backend và cấu hình deploy.

## Luồng xử lý

1. Người dùng chọn **Quên mật khẩu?** ở `/login`, nhập email và nhận một thông báo chung, không xác nhận email có tồn tại hay không.
2. API ghi yêu cầu vào hàng đợi bền trong PostgreSQL. Worker xử lý ngoài thời gian phản hồi HTTP, kiểm tra email trong danh sách tài khoản thử, trạng thái tài khoản và khoảng cách giữa các lần gửi.
3. Worker tạo challenge ngẫu nhiên có hạn 30 phút, chỉ lưu hash của token và gửi liên kết qua Amazon SES SMTP. Token nằm trong fragment `#token=…`, không đi vào request GET của web server; frontend xóa fragment khỏi lịch sử sau khi đọc.
4. Người dùng chọn mật khẩu mới. API xác minh token một lần, cập nhật hash mật khẩu và thu hồi các phiên cũ trong transaction. Người dùng đăng nhập lại.

Hàng đợi mã hóa payload trước khi lưu, dùng lease/retry để một lỗi SMTP tạm thời không làm mất yêu cầu đã chấp nhận. Không ghi email, token, nội dung thư hay lỗi SMTP thô ra log. Giới hạn tốc độ theo IP và theo tài khoản vẫn áp dụng. Cơ chế này không đảm bảo email luôn đến inbox: SES có thể chấp nhận thư nhưng phía nhận lọc spam hoặc từ chối sau đó.

## Môi trường AWS hiện tại

- Region `ap-southeast-2`; SES đang ở sandbox. Chỉ sender và recipient đã xác minh mới nhận thư, nên bản này phục vụ tài khoản thử. Không yêu cầu đưa SES ra production khi chưa mở đăng ký công khai.
- SES SMTP dùng STARTTLS port 587. Security group EC2 chỉ thêm egress TCP/587; không mở inbound. SMTP user IAM riêng chỉ có `ses:SendRawEmail` cho identity đã xác minh và đúng sender/recipient. Credential đặt trong runtime SecureString, không đưa vào Git, shell history, frontend hoặc bản audit công khai.
- API container không lấy role EC2 qua IMDS: host đang đặt hop limit 1; giữ cách ly role host. Runtime password recovery dùng SMTP user có phạm vi gửi thư hẹp.

## Thứ tự bật trên staging

1. Tạo và xác minh email identity SES trong đúng region. Kiểm tra `VerificationStatus=SUCCESS`; sandbox cần xác minh cả địa chỉ nhận.
2. Tạo IAM SMTP user/policy giới hạn identity, sender và recipient. Tạo một access key rồi chuyển secret thành SES SMTP password theo thuật toán của AWS; ghi trực tiếp vào SSM SecureString, không in hoặc lưu plaintext. Lưu mã key để có thể thu hồi, không lưu secret key.
3. Đánh giá và áp dụng CloudFormation change set chỉ thêm egress TCP/587. Kiểm tra không có thay thế EC2/RDS hay thay đổi tài nguyên ngoài phạm vi.
4. Commit và chạy CI của mã mới. Phát hành release với migration policy `backward-compatible`. Chạy migration trước khi bật flag; kiểm tra schema, cấp quyền DB tối thiểu bằng helper operator. Helper cài trigger giới hạn cập nhật mật khẩu đúng email thử, kể cả khi có truy vấn SQL trực tiếp từ runtime role. Kiểm tra role vẫn không thể đổi mật khẩu tài khoản khác hoặc ghi catalog, tồn kho, đơn và thanh toán.
5. Cập nhật đúng runtime SecureString với `PASSWORD_RECOVERY_ENABLED=true`, allowlist email thử, `CHALLENGE_DELIVERY=smtp` và SMTP host/port/credential/from. Bộ `fetch-env.sh` xác thực các trường trước khi tạo container. Cài bản helper đã review lên host trước khi đưa khóa mới vào SecureString; bundle bootstrap S3 cũng cần được đồng bộ trước khi thay EC2.
6. Deploy đúng digest release qua workflow. Kiểm HTTPS: login vẫn hoạt động, form quên mật khẩu hiện, request email không tiết lộ tài khoản, thư được nhận, token dùng một lần, phiên cũ bị thu hồi; `/auth/register`, orders, quote và webhook vẫn bị chặn.

## Tắt và khôi phục

Đặt `PASSWORD_RECOVERY_ENABLED=false`, bỏ các trường SMTP khỏi runtime SecureString, rồi deploy/refresh lại. Thu hồi IAM access key nếu nghi lộ hoặc không còn dùng. Rollback ứng dụng không tự rollback schema hoặc quyền DB; chỉ thu hồi quyền sau khi xác nhận bản app cũ không cần. Nếu SES identity chưa xác minh, SMTP không gửi được và cờ phải giữ `false`.

## Tài liệu nguồn AWS

- [SES sandbox và xác minh identity](https://docs.aws.amazon.com/ses/latest/dg/verify-addresses-and-domains.html)
- [SES SMTP/STARTTLS và port](https://docs.aws.amazon.com/ses/latest/dg/smtp-connect.html)
- [SMTP credentials và thuật toán chuyển đổi](https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html)
- [IAM điều kiện From/Recipients cho SES](https://docs.aws.amazon.com/ses/latest/dg/control-user-access.html)
