# Mở tính năng sau bản AWS showcase — 20/11/2026

## Nhóm đã chọn và cách mở

Đã chốt: tài khoản thử có kiểm soát, giỏ và lưu PC; không đăng ký/reset công khai, không orders/payment/admin. Contract mới là `PREVIEW_READ_ONLY=true` **cùng** `INTERACTIVE_DEMO=true`. Mặc định flag mới false, nên bản showcase cũ giữ nguyên khi chưa chọn mở.

- FE chỉ mở login và thao tác cart/build; tài khoản là màn hình tổng quan demo, checkout hiện thông báo không nhận đơn.
- API dùng allowlist method/path chính xác trước JWT/ownership/Origin/rate-limit; không có ngoại lệ cho tạo/hủy đơn, quote, webhook hoặc admin.
- `setup-interactive-demo.cjs --enable-interactive-demo` là thao tác operator trên DB hiện có: kiểm TLS/role/quyền trước khi grant; chỉ session/audit/cart/build và UPDATE một số cột. Catalog/giá/đơn/tồn/thanh toán/credential/role không được ghi. Cart demo dùng advisory lock vì catalog chỉ đọc.
- `create-demo-account.cjs --create-controlled-demo` chỉ tạo CUSTOMER mới; không reset hoặc đổi quyền tài khoản đã tồn tại. Mật khẩu sinh riêng, lưu local được Git ignore; không gửi vào chat/SSM command parameters.
- SecureString chứa flag mới; fetch-env kiểm giá trị; apply-release đưa flag đã xác minh vào compose.env cho cả FE/BE. Không source secret env bằng shell.

Kiểm local: API lint/build,53 unit; FE lint/TypeScript/build và2 Chromium demo;22 parser fixture,14 deployment mock; PostgreSQL TLS disposable6 nhóm,11 ghi ngoài phạm vi bị42501. DB helper đã chạy trên AWS, tài khoản CUSTOMER đã tạo, hai helper trên host cập nhật có checksum/backup; bản ứng dụng mở tính năng còn cần Release/Deploy rồi smoke thật. Bộ bootstrap CFN pin cũ không tự thay theo thao tác operator này: khi dựng/thay host phải xuất bản/pin bootstrap mới hoặc cài lại đúng helper đã kiểm; không tắt validator để bỏ qua.

Người dùng xác nhận đã tự deploy và truy cập được website. Kiểm HTTP chỉ đọc ngày20/11: trang chủ, login, cart, PC Builder và catalog API đều trả200; HTML login không chứa input password và có thông báo preview. Chưa đọc cấu hình container/quyền DB đang chạy; không coi source local là bằng chứng cấu hình AWS thực tế.

## Vì sao nút đang khóa?

| Lớp | Hiện tại trong source | Khi mở cần xử lý |
| --- | --- | --- |
| Frontend | Layout truyền `PREVIEW_READ_ONLY`, auth thay form, ShopProvider ngừng phiên/cart/lưu PC | Hiển thị đúng tính năng được phép, tiếp tục thông báo giới hạn demo |
| API | `previewBoundary` chỉ cho đọc catalog/media/health | Cho phép đúng route demo; giữ auth, ownership, Origin và rate limit |
| Deploy | Compose ép flagtrue, fetch-env từ chối flagfalse/cấu hình SMTP ngoài contract | Cập nhật contract có kiểm tra, không sửa tạm file release trên EC2 |
| Database | Bộ setup cấp runtime SELECT-only | Chỉ cấp quyền ghi cần thiết sau khi kiểm role thực tế; không cấp owner/migration/master cho API |

Không chỉ bật lại nút hoặc đổi một flag: source hiện chưa tách mở auth/cart/build khỏi tạo đơn. Khi tắt preview toàn cục, COD có thể được cung cấp dù Stripe đang tắt.

## Đợt đề xuất: tương tác demo, chưa tạo đơn

1. Chốt nhóm tính năng và ai được dùng: tài khoản thử có kiểm soát hay đăng ký công khai. Không tự mở đăng ký public theo suy đoán.
2. Tách capability phía server: tài khoản/phiên, giỏ và cấu hình PC được phép; đơn hàng, payment, inventory reservation và admin tiếp tục bị chặn. FE theo cùng contract.
3. Kiểm route nào thực sự ghi bảng nào, cấp runtime quyền tối thiểu cho nhóm đã chọn; giữ migration riêng và RDS TLS. Không cấp DML toàn schema chỉ để hết lỗi permission.
4. Với tài khoản thử có kiểm soát, có thể giữ SMTP disabled; xác định cách tạo và cấp tài khoản riêng, không công khai tài khoản admin/chung. Đăng ký/reset công khai cần xử lý riêng SMTP, dữ liệu cá nhân và khả năng dò tài khoản qua thời gian phản hồi reset.
5. Chỉ kiểm các luồng được mở: đăng nhập/phiên, thêm giỏ, lưu PC đúng ownership; request trực tiếp vẫn không tạo đơn/thu tiền/giữ tồn. Kiểm image production trước cập nhật AWS.
6. Review release/rollback và quyền DB rồi triển khai. Không tự nâng Paid plan hoặc bỏ nhãn dữ liệu minh họa.

Đây là kế hoạch, chưa triển khai capability mới, chưa đổi flag hoặc quyền DB AWS. Phạm vi nhóm cần mở đang chờ lựa chọn người dùng. Phát hiện SMTP timing được ghi trong [hồ sơ rà soát](LOCAL_RELEASE_REVIEW.md).

## Lưu ý trạng thái triển khai

`infra/.local/first-deployment-state.json` là lịch sử automation19/11: dừng tại seed và chưa ghi nhận Deploy thành công. Người dùng đã tự hoàn tất deployment sau đó; **không chạy lại script seed/finish cũ theo marker này**. Trước thay đổi cần đọc release hiện hoạt và role/env metadata một cách không lộ secret. Chưa nghiệm thu lại AWS restore/rollback hoặc mở bán thật.
