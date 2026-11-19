# Rà soát bản local để phát hành staging — 19/11/2026

Chủ dự án chọn bản local hiện tại thay vì phát hành ngay commit GitHub `3896a813`. Đây là bản chuẩn bị website showcase chỉ đọc, chưa nhận tài khoản/đơn/thanh toán thật. Các kiểm tra dưới đây không thay thế CI trên commit sắp push hoặc kiểm website AWS sau Deploy.

## Phạm vi dự kiến đưa vào commit

| Nhóm | Thay đổi hiện có | Phạm vi kiểm tra |
| --- | --- | --- |
| Auth | SMTP transport, cấu hình/TLS, cooldown challenge, link fragment và form reset; thêm Nodemailer/lockfile và unit/UI tests | Lint/build/unit; transport mock không gửi email; UI reset payload; preview chặn auth/SMTP |
| PC Builder | Ảnh lắp riêng theo SKU/case, resolver/manifest, lớp ảnh và thao tác focus/tách; khóa linh kiện không tương thích | TypeScript/build, resolver/path/asset tests, UI/mobile và hồi quy FE–BE |
| Asset minh họa | 18 cutout runtime, 1 concept tham khảo, manifest và provenance; tổng thư mục khoảng46,62 MiB | Đường dẫn tồn tại, PNG alpha/binding riêng, nhãn minh họa; chưa chứng nhận hình học/tỷ lệ lắp thật |
| AWS và tài liệu AI | OIDC immutable subject, bootstrap RPM đúng AL2023, backup parameter, audit foundation và hướng dẫn Release | cfn-lint, Bash syntax, manifest/parser/state-machine fixtures; audit public đã lược thông tin account |

API runtime tiếp tục dùng ESM/NodeNext và Prisma v2. Không sửa history DB hiện hữu, không đổi Stripe live, không gỡ `PREVIEW_READ_ONLY`. Các thay đổi source trong bảng là mã local có trước lượt rà soát; lượt này tập trung kiểm tra và bổ sung hồ sơ phát hành.

## Kết quả kiểm tra

Kết quả cuối và đường dẫn report được ghi tại [PROJECT_STATUS](PROJECT_STATUS.md) và `docs/verification/2026-11-19-local-release-review.json` sau khi runner hoàn tất. Không lấy CI xanh của commit3896a813 làm bằng chứng cho working tree này.

Đã kiểm backend lint/build và45 unit tests; frontend lint/Prettier/build production; build ba Docker image; production preview local15 nhóm kiểm tra gồm Chromium, TLS CA, DB SELECT-only, restore và persistence; release manifest3 tests; deployment parser19 fixture và state-machine14 mock run. Suite UI/FE–BE đầy đủ đang chạy khi tạo hồ sơ này; chỉ kết luận theo report cuối.

DB kiểm thử là PostgreSQL Docker riêng dùng một lần; không kết nối RDS hoặc seed/truncate DB development. SMTP/Stripe thật không được gọi. Production restore/recreate ở đây là local Docker, chưa phải AWS restore hoặc reboot của ứng dụng đã deploy.

## Giới hạn cần giữ khi phát hành

- **SMTP/auth production:** `AuthService` chờ gửi SMTP cho email đủ điều kiện trong khi email không tồn tại trả sớm. Dù response giống nhau, độ trễ có thể tiết lộ tài khoản. Đã xác minh bằng transport mock giữ pending, không gọi provider. Cần xử lý trước khi bật auth/SMTP production; public showcase hiện chặn route và tắt SMTP nên không mở luồng này. Không sửa bằng delay tùy ý hoặc fire-and-forget làm mất độ tin cậy gửi mail.
- Chưa kiểm nhận thư inbox thật. Các PNG là ảnh dựng minh họa, không phải chứng nhận SKU lắp vừa thực tế; ảnh catalog mẫu còn giới hạn theo audit ảnh riêng.
- GitHub Environment variables chưa được xác nhận đã lưu; email SNS còn chờ xác nhận ở lần đọc gần nhất. Foundation và DNS đã sẵn sàng nhưng chưa có app release/DB schema/secrets/ACME public.

## Bản commit có thể review

Danh sách file và SHA256 trước commit được lưu trong `infra/.local/local-release-candidate.json`, được Git ignore. Không đưa `infra/.local/`, `.env`, credential, raw AWS outputs, build cache hoặc browser reports vào Git. Rà soát hiện không phát hiện secret trong candidate; đây là kiểm có phạm vi, không phải cam kết mọi dữ liệu lịch sử của repository đã được audit.

Có thể tách thành ba commit để dễ review: auth/reset, PC Builder/assets, rồi AWS/tài liệu. Chốt phạm vi commit/push sau kết quả kiểm cuối; không dùng `git add .` để gom cả file private hoặc report sinh ra.

Sau khi commit được duyệt và CI trên commit đó xanh, tiếp tục [Release đầu tiên](FIRST_AWS_RELEASE.md): publish `staging`, `backward-compatible`, `deploy=false`; chuẩn bị DB roles/env/TLS trước Deploy.

User follow-up authorizes commit/push and first deployment; focused checks take priority over further review. See final audit JSON for actual outcomes and deferred work.
