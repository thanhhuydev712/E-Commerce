# Bối cảnh và định hướng sản phẩm

## Mục tiêu

Xây dựng hệ thống bán hàng gồm storefront, API nghiệp vụ, dữ liệu và công cụ quản trị. Chủ dự án cần hiểu cách thiết kế và vận hành từng phần để có thể tự phát triển, giải thích quyết định kỹ thuật và trình bày sản phẩm trong phỏng vấn.

Thành công được đánh giá bằng luồng mua hàng hoạt động đúng, bảo vệ tài khoản và tiền, có bằng chứng kiểm thử, cài đặt được trên máy mới và có tài liệu đủ để bàn giao. Số lượng thư viện không phải thước đo chất lượng.

## Người dùng mục tiêu

| Vai trò | Nhu cầu |
| --- | --- |
| Khách chưa đăng nhập | Xem danh mục, tìm và xem sản phẩm; đăng ký/đăng nhập |
| Khách hàng USER | Quản lý hồ sơ, giỏ hàng, đặt hàng, thanh toán, xem đơn của mình |
| Quản trị viên ADMIN | Quản lý danh mục, sản phẩm, tồn kho, người dùng và đơn hàng |
| Người phát triển/vận hành | Chạy môi trường, kiểm thử, triển khai, theo dõi và phục hồi dữ liệu |

Từ **06/11/2026**, runtime Auth/Accounts/Access dùng Role/Permission/UserRole v2; CUSTOMER/ADMIN và bốn permission giai đoạn đầu đã seed, không tự nâng quyền tài khoản. Enum USER/ADMIN v1 chỉ còn trong mã legacy. [Contract danh tính](API_IDENTITY_V2.md) mô tả roleCodes/permissions, session và ownership. Khách chưa đăng nhập là tác nhân công khai, không phải role lưu trong DB.

## Phạm vi hướng tới

- MVP: auth và phân quyền; danh mục/sản phẩm; giỏ hàng; đơn hàng; thanh toán Stripe ở test mode với webhook tin cậy; storefront kết nối API; quản trị cơ bản.
- Nền tảng chất lượng: validation, ownership, xử lý lỗi, tài liệu API, test nghiệp vụ quan trọng, CI và hướng dẫn local.
- Hạ tầng sau FE–BE, theo yêu cầu ngày **06/11/2026**: Docker, CI/CD, Nginx và AWS Deployment. [Kế hoạch chi tiết](DEPLOYMENT_PLAN.md) đề xuất GitHub Actions/ECR/EC2 Compose/RDS, tách local–test–staging–demo, có HTTPS, migration/rollback và backup/restore. Đây là phạm vi đã được yêu cầu, chưa phải hạ tầng đã triển khai.
- Sau MVP: địa chỉ có cấu trúc, phí vận chuyển, mã giảm giá, hoàn tiền đầy đủ, upload ảnh, monitoring, backup/restore và tối ưu theo dữ liệu thực tế.
- Chưa đưa vào phạm vi mặc định: marketplace nhiều người bán, microservices, loyalty, recommendation AI, Redis/queue khi chưa có nhu cầu cụ thể.

Đây là phạm vi đề xuất để tổ chức dự án từ bản bàn giao. Trạng thái thực thi được ghi riêng trong [PROJECT_STATUS.md](PROJECT_STATUS.md); không coi danh sách này là chức năng đã có hoặc yêu cầu triển khai ngay.

## Các quyết định còn mở

1. Thương hiệu, ngành hàng và bộ dữ liệu demo cuối cùng; Rigforge hiện là dấu hiệu giao diện.
2. Currency đã chốt **VND, minor_unit=0** theo yêu cầu ngày 05/11/2026; giá giữ trị số hiện có, không quy đổi FX. Database và API v2 hiện dùng VND nguyên, trả JSON dạng chuỗi; từ 08/11 có [Stripe Checkout sandbox v2](STRIPE_V2.md), không nhân 100. Dữ liệu v1 trong schema lưu trữ giữ nguyên currency gốc.
3. Chính sách giao hàng, hủy đơn, giữ/trừ/hoàn tồn kho và hoàn tiền.
4. Nơi lưu token trên frontend, thời hạn phiên và chính sách nhiều thiết bị.
5. AWS là nền tảng triển khai đã được yêu cầu. Baseline đề xuất EC2 + Compose/Nginx, ECR, RDS private, SSM/OIDC và CloudWatch; ngân sách, domain/region, kích cỡ tài nguyên, lưu ảnh và provider email còn cần chốt khi cài đặt. Không tự thêm ECS/Kubernetes hoặc dịch vụ mới chỉ để tăng stack.

Chỉ cần chốt từng quyết định khi công việc liên quan đến nó. Tài liệu bàn giao có nhắc ý tưởng kinh doanh ngách nhưng không lưu tên sản phẩm; chưa có cơ sở gộp ý tưởng đó vào sản phẩm này.
