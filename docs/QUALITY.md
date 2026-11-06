# Chất lượng, cộng tác và vận hành

Các quy tắc dưới đây là baseline đề xuất cho dự án. Pipeline và quy trình chưa được xác nhận đang tự động thực thi.

## Quy trình thay đổi

1. Đọc yêu cầu, tài liệu liên quan và code; kiểm tra branch, `git status`, diff hiện tại.
2. Xác định thay đổi nhỏ có thể review, contract bị ảnh hưởng và cách kiểm chứng.
3. Thực hiện thay đổi trong phạm vi yêu cầu, giữ nguyên công việc ngoài phạm vi.
4. Kiểm tra phù hợp; xem diff cuối, cập nhật tài liệu/trạng thái nếu cần.
5. Khi được yêu cầu commit, stage đúng file và kiểm tra staged diff; dùng Conventional Commits như `docs: add project context for Codex` hoặc `fix(auth): align refresh token verification`.
6. PR mô tả vấn đề, hành vi sau thay đổi, validation và giới hạn còn lại. Push/deploy theo yêu cầu cụ thể của chủ dự án.

## Chiến lược kiểm thử

| Tầng | Trọng tâm |
| --- | --- |
| Unit | Quy tắc giá, trạng thái, validation và nhánh lỗi; mock dependency ngoài phạm vi |
| Integration | Query/constraint/transaction với PostgreSQL test; ownership, uniqueness, concurrency |
| API E2E | Auth → cart → order → payment; status code, contract và trường hợp bị từ chối |
| Frontend/E2E | Đã có Playwright qua Next/Nest/PostgreSQL thật trong schema riêng; bổ sung production images qua Nginx khi deploy; kiểm lỗi API, accessibility và responsive |
| Payment | Fake signature, event lặp/sai thứ tự, timeout/retry, đối soát; Stripe test mode |

Ưu tiên test có khả năng bắt lỗi nghiệp vụ. Không xem `should be defined` là bằng chứng module đúng. Unit không gọi Stripe thật; test tích hợp dùng database riêng và có cách dọn dữ liệu rõ ràng.

## Definition of Done cho một tính năng

- Acceptance criteria và các trường hợp lỗi quan trọng đã được kiểm tra.
- Quyền truy cập và ownership nằm ở backend; request không được tự quyết giá/trạng thái đáng tin cậy.
- DTO, service, schema/migration, Swagger và frontend types nhất quán khi có thay đổi contract.
- Lint/build và test phù hợp đã chạy; ghi rõ lệnh, kết quả và kiểm tra chưa thực hiện.
- UI có loading/error/empty, form validation và khả năng dùng bàn phím khi liên quan.
- Không có secret, dữ liệu thật hoặc generated artifact ngoài ý muốn trong diff.
- Tài liệu thiết lập/trạng thái được cập nhật nếu hành vi thay đổi.

## Trước khi phát hành production

- Chuẩn hóa env validation, Node version, `.env.example`, migration và secret management.
- Test auth/session, CORS, rate limiting, ownership; tắt chi tiết lỗi nội bộ và rà dữ liệu nhạy cảm trong log.
- Đóng các điểm P0 của [PROJECT_STATUS.md](PROJECT_STATUS.md), đặc biệt giá, stock, payment và refresh token.
- Xác minh pipeline, health check, deploy/rollback; thử backup và restore bằng dữ liệu không nhạy cảm.
- Thiết lập logs có request ID, theo dõi lỗi, đối soát payment và hướng xử lý sự cố.

## Ghi nhận quyết định và bàn giao

### Tiêu chí hạ tầng được bổ sung — 06/11/2026

Áp dụng [kế hoạch Docker/CI/CD/Nginx/AWS](DEPLOYMENT_PLAN.md) khi thực hiện phần hạ tầng:

- CI chạy từ lockfile sạch, generate Prisma v2, lint/build và test đúng phạm vi; database test tách biệt, không secret cloud trong PR/fork. Playwright mock pass không xác nhận FE–BE thật hoạt động.
- Phát hành đúng Git SHA/image digest/phiên bản cấu hình; môi trường có concurrency và khóa deploy; xác nhận SSM command hoàn tất và smoke qua HTTPS, không chỉ API AWS nhận lệnh.
- Nginx giữ prefix API, cookie/Origin/trust proxy đúng, không cache dữ liệu riêng; app/DB ports không public. Image không chứa secret; RDS private và TLS có xác minh chứng chỉ.
- Migration one-shot với quyền riêng; triển khai lỗi phải có quy trình rollback tương thích schema, không tự reset/restore đè dữ liệu. Có thử reboot và backup/restore sang DB mới.
- Chốt estimate/ngân sách trước provision, có log retention/alarms và RPO/RTO được đo. Ghi bằng chứng thật trong PROJECT_STATUS và runbooks; không tự commit/push/provision/deploy vì nhiệm vụ chỉ yêu cầu kế hoạch.

Khi cần ADR, tạo `docs/decisions/NNNN-ten-quyet-dinh.md`: ngày, trạng thái, bối cảnh, phương án, quyết định, trade-off, hệ quả và kế hoạch kiểm chứng. Không đánh dấu quyết định là đã chấp nhận nếu vẫn đang đề xuất.

Sau mỗi mốc, ghi phần đã có, bằng chứng chạy, vấn đề còn mở và việc tiếp theo vào tài liệu liên quan. Không đưa credential hoặc dữ liệu cá nhân vào báo cáo. Mô tả portfolio/CV phải phản ánh phần đã triển khai và kiểm chứng thực tế.
