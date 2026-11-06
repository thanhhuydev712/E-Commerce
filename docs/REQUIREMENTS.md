# Yêu cầu nghiệp vụ và tiêu chí nghiệm thu

Đây là baseline đề xuất từ tài liệu bàn giao để phát triển như một sản phẩm thực tế. Các tiêu chí chưa được nghiệm thu; xem [hiện trạng](PROJECT_STATUS.md) để phân biệt mã đang có và phần cần làm.

## Thành phần sản phẩm

| Mã | Thành phần | User story | Tiêu chí nghiệm thu chính |
| --- | --- | --- | --- |
| AUTH | Đăng ký và phiên đăng nhập | Khách tạo tài khoản, đăng nhập, refresh và logout | Email unique; password hash; lỗi đăng nhập hợp lý; refresh hợp lệ được xoay/thu hồi; token cũ sau logout bị từ chối |
| USER | Tài khoản và phân quyền | USER sửa hồ sơ của mình; ADMIN quản lý đúng quyền | Không lộ password/token; chặn truy cập tài nguyên người khác; kiểm tra mật khẩu cũ khi đổi mật khẩu |
| CAT | Danh mục | ADMIN quản lý; khách xem danh mục bán hàng | Slug unique; validation; chính sách danh mục inactive/xóa có sản phẩm rõ ràng |
| PROD | Sản phẩm và tồn kho | Khách tìm/xem; ADMIN cập nhật sản phẩm | SKU unique; giá/tồn hợp lệ; query có pagination/filter/sort; sản phẩm inactive không được mua |
| CART | Giỏ hàng | USER thêm/sửa/xóa và xem tổng giỏ | Giá từ server; số lượng nguyên dương; kiểm tra cộng dồn không vượt tồn; item thuộc đúng chủ giỏ |
| ORDER | Đặt và theo dõi đơn | USER đặt hàng và xem đơn của mình | Server tính tổng; lưu snapshot giá; thao tác nguyên tử; kiểm thử mua đồng thời; không lộ đơn người khác |
| PAY | Thanh toán | USER thanh toán đơn qua Stripe test mode | Amount/currency từ Order; webhook signature hợp lệ; chống lặp; trạng thái nhất quán; retry không thu tiền hai lần |
| CANCEL | Hủy đơn | USER hủy khi đủ điều kiện | Điều kiện trạng thái rõ; hoàn tồn đúng một lần; phối hợp payment/refund theo chính sách |
| UI | Storefront | Khách đi từ sản phẩm tới thanh toán và lịch sử đơn | Responsive; loading/error/empty; form validation; phản hồi lỗi API; hỗ trợ bàn phím; không xác nhận trả tiền chỉ từ trang redirect |
| ADMIN | Quản trị | ADMIN quản lý catalog, tồn kho và đơn | Guard phía API; UI phù hợp role; thao tác nguy hiểm rõ ràng; lịch sử thay đổi quan trọng có thể truy vết |

## Luồng mua hàng mục tiêu

1. Khách xem/tìm sản phẩm và đăng nhập.
2. Backend xác thực user, kiểm tra sản phẩm và cập nhật giỏ.
3. Khi checkout, backend đọc lại giá/stock, áp quy tắc giá, lưu snapshot và đơn trong transaction phù hợp.
4. Backend tạo hoặc tái sử dụng lần thanh toán theo chính sách idempotency; amount lấy từ đơn.
5. Stripe gửi sự kiện; backend xác minh chữ ký, loại sự kiện lặp, kiểm tra liên kết order/payment và cập nhật trạng thái.
6. Frontend đọc trạng thái từ backend; khách xem đơn. Trường hợp thất bại/hủy được xử lý theo chính sách tồn kho và tiền.

Không mặc định việc thêm vào giỏ đã giữ hàng. Thời điểm giữ/trừ tồn, thời hạn chờ thanh toán và cơ chế giải phóng tồn là quyết định cần chốt trước khi hoàn thiện bước 3–6.

## Baseline UI tham khảo — 06/11/2026

Theo yêu cầu người dùng, cấu trúc và bố cục storefront lấy Tin Học Ngôi Sao làm tham khảo; giữ nhận diện Rigforge. [Báo cáo khảo sát](REFERENCE_SITE_AUDIT.md) và [ma trận 103 mục](REFERENCE_SITE_TEST_MATRIX.csv) phân biệt phần đã quan sát, đã kiểm thử và chưa làm. Header/search/mega menu, danh mục, chi tiết, checkout một trang, campaign/tin/showroom/bảo hành đã được chỉnh ở frontend demo; kiểm thử fixture không xác nhận API hoặc thanh toán thật. Chưa nghiệm thu giống toàn bộ template/pixel; các khác biệt và phụ thuộc dữ liệu/backend được ghi trong báo cáo.

## Quy tắc xuyên suốt

- Backend là nguồn quyết định về giá, số tiền, quyền sở hữu và trạng thái; dữ liệu browser phải được kiểm tra lại.
- Tổng tiền phải có quy tắc làm tròn và currency thống nhất; không mặc định mọi tiền tệ đều nhân 100.
- Chuyển trạng thái theo tập chuyển hợp lệ; không cho client cập nhật tùy ý trạng thái đơn/thanh toán.
- Transaction database không bao gồm nguyên tử với Stripe; cần retry, idempotency và cách đối soát khi chỉ một phía thành công.
- Xóa tài khoản/sản phẩm không được vô tình làm mất lịch sử cần giữ; rà cascade và chính sách lưu dữ liệu.
- Phản hồi lỗi không chứa stack trace, secret hoặc dữ liệu cá nhân không cần thiết.

## Phần mở rộng sau MVP

Địa chỉ có cấu trúc, phí vận chuyển, coupon, upload/storage ảnh, refund, email và thống kê chỉ được tách thành user stories khi triển khai. Mỗi story cần quy tắc áp dụng, lỗi/edge cases, API contract, test và tiêu chí hoàn thành riêng.
