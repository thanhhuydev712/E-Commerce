# Lộ trình 20 giai đoạn

Giữ khung 20 giai đoạn của tài liệu bàn giao. Đây là khung tham chiếu; dự án đã có nhiều phần mã nguồn nên quay lại đánh giá và bổ sung theo khoảng thiếu, không khởi tạo lại từ đầu. Chưa đánh dấu hoàn tất giai đoạn nào chỉ dựa trên việc có file.

| Giai đoạn | Nội dung | Đầu ra / điều kiện qua giai đoạn |
| --- | --- | --- |
| 01 | Khảo sát hiện trạng | Bản đồ repository, trạng thái có bằng chứng, danh sách rủi ro; đã có rà soát tĩnh ban đầu, còn chạy kiểm tra |
| 02 | Yêu cầu, nghiệp vụ, MVP | Vai trò, user stories, business rules, acceptance criteria được chốt |
| 03 | Kiến trúc và công nghệ | Ranh giới module, luồng dữ liệu, quy ước, ADR cho quyết định lớn |
| 04 | ERD và chiến lược dữ liệu | Schema/constraint/index/delete rules, migration, seed và hướng backup |
| 05 | API contract | Method/path/auth/request/response/error/pagination được thống nhất |
| 06 | Repository và Git | Cấu trúc thư mục rõ; quy ước branch, commit, PR phù hợp quy mô |
| 07 | Môi trường, standards, CI cơ bản | Node được pin, cấu hình mẫu không chứa secret, lint/build/test gates |
| 08 | Nền tảng backend | Config, Prisma, validation, errors, logging, Swagger và health check |
| 09 | Authentication/authorization | Token lifecycle, password hash, role/ownership; test các trường hợp từ chối |
| 10 | Catalog và tồn kho | Category/product CRUD, query, ảnh và quy tắc tồn kho nhất quán |
| 11 | Tài khoản và địa chỉ | Hồ sơ, password, shipping address và dữ liệu thuộc đúng user |
| 12 | Cart và checkout | Server tính giá, snapshot, transaction và chống vượt tồn khi đồng thời |
| 13 | Shipping, discount, pricing | Chốt phạm vi MVP hay sau MVP; quy tắc phí/mã giảm rõ nếu triển khai |
| 14 | Payment và webhook | Stripe test flow, signature, idempotency, cancellation/refund và đối soát |
| 15 | Storefront theo luồng | Catalog → cart → checkout → account/orders nối API; loading/error/empty |
| 16 | Admin dashboard | Quản trị user/catalog/stock/order/payment với quyền phía server |
| 17 | Kiểm thử tổng thể | Integration/E2E, security, concurrency, accessibility và performance |
| 18 | Docker, Nginx, CI/CD và AWS | Compose/image production, proxy/HTTPS, GitHub Actions → ECR → EC2/RDS private; migration và rollback đã thử |
| 19 | Vận hành | Logs, request ID, lỗi/metrics, cảnh báo, diễn tập backup/restore |
| 20 | Bàn giao và portfolio | README máy mới, ERD/API/demo, quyết định kỹ thuật, mô tả CV đúng bằng chứng |

Testing thực hiện từ từng tính năng; giai đoạn 17 là kiểm tra tổng thể. Tài liệu cập nhật xuyên suốt; giai đoạn 20 là hoàn thiện bàn giao.

## Phần hạ tầng sau frontend/backend — yêu cầu 06/11/2026

Kế hoạch thực hiện chính nằm ở [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md); không tạo thêm roadmap cạnh tranh với nguồn này. Người dùng đã yêu cầu Docker, CI/CD, Nginx và AWS. Thứ tự D0–D7: ứng dụng/tích hợp thật → chuẩn hóa Node/env → Docker → Nginx → CI → AWS staging → CD/demo → vận hành/portfolio. CI cơ bản ở giai đoạn 07 có thể làm sớm; triển khai cloud phụ thuộc chất lượng ứng dụng và ngân sách.

Điều kiện kết thúc gồm image production từ checkout sạch, tách test/staging/demo, HTTPS, DB private, secret/OIDC đúng quyền, deploy theo digest, migration riêng và thử lỗi/rollback/reboot/restore. Chưa hoàn tất chỉ vì có Dockerfile hoặc workflow YAML. Không mặc định triển khai toàn bộ 102 bảng, thêm Kubernetes/ECS/Redis hoặc chuyển sang Stripe live để đạt mốc này.

## Thứ tự ưu tiên cho phiên tiếp theo

1. Thiết lập môi trường local/test, xác minh generate/build/lint; ghi lại lỗi thực tế, tránh dùng database có dữ liệu cần giữ.
2. Làm đúng luồng login/refresh/logout và ownership trước khi kết nối tài khoản frontend.
3. Sửa nguồn giá, tồn kho và trạng thái checkout; bổ sung test sửa giá và đặt/hủy đồng thời.
4. Hoàn thiện Stripe webhook/idempotency và test mode; chốt currency, retry và hủy/hoàn tiền.
5. Nối storefront với API theo từng luồng, sau đó admin, CI/deploy và vận hành.

Mỗi mục là một hoặc nhiều thay đổi nhỏ có thể review; chỉ thực hiện trong phạm vi công việc chủ dự án yêu cầu. Xem các bằng chứng cụ thể tại [PROJECT_STATUS.md](PROJECT_STATUS.md).
