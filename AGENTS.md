# Hướng dẫn Codex — E-Commerce Fullstack

## Dự án này dùng để làm gì?

Xây dựng website thương mại điện tử fullstack để chủ dự án vừa học sâu kiến thức nền, vừa có sản phẩm thực tế trình bày trên GitHub, CV và trong phỏng vấn. Giao diện hiện hướng đến cửa hàng máy tính, linh kiện và gaming gear, có dấu hiệu nhận diện Rigforge. Chưa chốt ngành hàng kinh doanh cuối cùng; không tự suy đoán ý tưởng kinh doanh ngách từ lịch sử chat.

## Đọc trước khi làm việc

1. [README.md](README.md): bản đồ dự án và tài liệu.
2. [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md): mục tiêu, phạm vi, vai trò.
3. [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md): hiện trạng có dẫn chứng và việc cần xác minh.
4. Đọc tài liệu theo công việc: [nghiệp vụ](docs/REQUIREMENTS.md), [kiến trúc](docs/ARCHITECTURE.md), [môi trường](docs/DEVELOPMENT.md), [lộ trình](docs/ROADMAP.md), [chất lượng](docs/QUALITY.md), [kế hoạch Docker/CI/CD/Nginx/AWS](docs/DEPLOYMENT_PLAN.md).
5. Đọc mã nguồn, package.json và AGENTS.md trong thư mục liên quan trước khi sửa. Với frontend, tuân thủ thêm `front/AGENTS.md` và đọc hướng dẫn Next.js cục bộ mà file đó chỉ định.

## Sub-agent theo chức năng và tiết kiệm token

- Quy trình và mẫu bàn giao: [docs/SUB_AGENTS.md](docs/SUB_AGENTS.md); vai trò tại `.codex/agents/`.
- Tác vụ nhỏ: agent chính tự làm. Với tác vụ đủ lớn và có đầu ra độc lập, dùng một sub-agent đúng chức năng; không mặc định gọi tất cả vai trò. Nếu người dùng yêu cầu cách chia khác, làm theo yêu cầu đó.
- Mặc định tối đa một agent con đồng thời theo `.codex/config.toml`; agent con không tạo thêm agent. Chỉ tăng mức song song khi người dùng yêu cầu.
- Khi công cụ hỗ trợ, giao ngữ cảnh mới cùng mục tiêu, file được sửa, bằng chứng đã đọc và tiêu chí nghiệm thu; không sao chép toàn bộ lịch sử chat.
- Agent chính vẫn đọc tài liệu nền ở trên. Agent con có thể dùng bản bàn giao có nguồn thay vì đọc lại toàn bộ tài liệu nền; phải đọc quy tắc thư mục và phần tài liệu/mã cần xác minh cho nhiệm vụ.
- Agent chính giữ contract, file dùng chung và tài liệu trạng thái; không giao sửa trùng file hoặc chạy runner tranh tài nguyên. Báo cáo ngắn, kết quả thật; không hứa tỷ lệ giảm token khi chưa đo cả cha lẫn con.

## Bản đồ mã nguồn

- `api/`: NestJS, TypeScript, Prisma, PostgreSQL. Ngày 07/11/2026: AppModule nạp platform/auth/accounts/access/catalog/pricing/media/inventory/storefront/commerce với client v2; giỏ/checkout/đơn COD hoạt động ở phạm vi tạo/huỷ và reservation, Stripe processor v2 chưa triển khai. Mã v1 ở `api/legacy/`. Đọc AppModule/controller thực tế và PROJECT_STATUS trước khi khẳng định route đã hoạt động.
- `api/prisma/schema.prisma`: nguồn sự thật về mô hình dữ liệu; migrations ở `api/prisma/migrations/`.
- `front/`: Next.js App Router, React, TypeScript, Tailwind CSS; ứng dụng ở `front/src/app/`, UI ở `front/src/components/`.
- Hai ứng dụng có package.json và package-lock.json riêng; chạy npm trong đúng thư mục. Chưa có npm workspace ở root.
- Phiên bản và lệnh thực tế: xem package.json/lockfile từng ứng dụng, không áp phiên bản từ trí nhớ.

## Cách cộng tác

- Giao tiếp bằng tiếng Việt; giải nghĩa thuật ngữ quan trọng. Giải thích mục tiêu, lý do và luồng dữ liệu khi thay đổi; với lỗi cụ thể, tập trung nguyên nhân và cách xác minh.
- Khi dạy tính năng mới, chia bước: mục tiêu → kiến thức nền → nghiệp vụ → thiết kế → cài đặt → file → code → kết nối → validation/bảo mật → kiểm thử → tiêu chí hoàn thành → trade-off. Điều chỉnh độ dài theo yêu cầu hiện tại.
- Khi đã có quyền truy cập workspace, chủ động đọc file và thực hiện công việc trong phạm vi yêu cầu. Chỉ hỏi thêm khi thiếu thông tin có ảnh hưởng đến quyết định; không yêu cầu gửi lại file đã đọc được.
- Sửa nhỏ, đúng phạm vi; giữ nhất quán DTO, controller, service, Prisma schema, Swagger và frontend types. Không tự mở rộng thành viết lại module hay triển khai toàn bộ roadmap.
- Phân biệt rõ: mã đang có, hành vi đã kiểm chứng, đề xuất và phần chưa xác minh. Có file test hoặc dependency không đồng nghĩa tính năng đã hoàn thành.
- Khi kết thúc, nêu thay đổi, lý do, cách kiểm tra, kết quả thật và giới hạn còn lại. Không bịa kết quả test, build hoặc deployment.

## Quy tắc kỹ thuật

- Backend hiện dùng ESM/NodeNext; giữ quy ước import `.js` của mã TypeScript hiện có.
- PrismaService hiện import `api/generated/prisma-v2`; kiểm tra generator, import runtime và mã legacy trước khi thay đổi. Generate trước build, không sửa generated client bằng tay hoặc dùng client v1 thay thế để làm CI xanh.
- Tiền, tồn kho và thanh toán là nghiệp vụ nhạy cảm: giá phải lấy từ server; kiểm tra ownership; xem xét transaction, cập nhật tồn kho có điều kiện, chuyển trạng thái và idempotency.
- Mã Stripe create-intent/confirm v1 nằm trong legacy, không coi là module v2 đang được AppModule nạp; chưa xác nhận webhook/signature/refund. Không mô tả là tích hợp hoàn chỉnh.
- Frontend đã nối API cho catalog/tài khoản/giỏ/cấu hình PC/COD và đã xoá fixture runtime sau kiểm thử. Phân biệt dữ liệu development giả trong DB với dữ liệu cứng ở FE; không khẳng định Stripe/giao vận/hậu mãi đầy đủ đã hoạt động. Đọc PROJECT_STATUS để biết bằng chứng mới nhất.
- Không thêm Redis, queue, microservices hoặc thư viện mới chỉ để tăng số công nghệ; nêu vấn đề cần giải quyết và trade-off trước.
- Kiểm tra thay đổi người dùng trước khi sửa; không ghi đè hoặc khôi phục thay đổi ngoài nhiệm vụ. Không tự commit/push/deploy khi chưa được yêu cầu.
- Không đưa `.env`, token, password, connection string hoặc dữ liệu thật vào tài liệu, log, commit. Migration và test database phải dùng môi trường phát triển/test phù hợp.

## Định hướng hạ tầng đã được yêu cầu — 06/11/2026

- Sau FE và BE, dự án phải có **Docker, CI/CD, Nginx và AWS Deployment**. Đọc [DEPLOYMENT_PLAN.md](docs/DEPLOYMENT_PLAN.md) trước khi thiết kế/cài đặt; đây là nguồn chính về môi trường, network, image, pipeline, migration, rollback, backup và chi phí.
- Baseline đề xuất: GitHub Actions → ECR → EC2 Linux chạy Compose (Nginx + Next.js + NestJS), RDS PostgreSQL private; SSM để quản trị/deploy, OIDC để cấp quyền tạm thời, runtime secret tách theo môi trường. Chi tiết còn là thiết kế, chưa phải hạ tầng đã vận hành.
- Thứ tự chính: FE/BE v2 → tích hợp luồng thật → Docker → Nginx → CI → AWS staging → CD/demo → vận hành. Pin Node/env và CI cơ bản có thể làm sớm; không tự triển khai toàn bộ kế hoạch trong nhiệm vụ khác.
- Tách local, CI/test, staging và demo; không dùng chung DB/secret staging–demo, không chạy CI bằng dữ liệu thật. Demo ban đầu dùng Stripe test và dữ liệu giả; không đồng nghĩa production kinh doanh.
- Browser gọi API cùng origin `/api/v1`; Nginx giữ prefix, backend chỉ trust proxy đúng topology. Phân biệt cấu hình runtime với `NEXT_PUBLIC_*` bị đóng vào bundle; không lộ secret ra frontend.
- Image theo digest; generate Prisma v2 trong build và giữ đúng đường dẫn runtime. Migration one-shot riêng, quyền riêng; rollback app không tự rollback schema. Trước nghiệm thu cần thử deploy lỗi/rollback, reboot và restore.
- Chưa có chứng cứ provision/deploy trong lượt lập kế hoạch. Chốt ngân sách/domain/region khi chuẩn bị tạo tài nguyên; không tự commit/push/provision/deploy từ yêu cầu lên kế hoạch.

## Lệnh kiểm tra

- Trong `api/`: `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e` (E2E cần cấu hình và database test).
- Trong `front/`: `npm run lint`, `npm run format:check`, `npm run build`, `npm run test:e2e` (runner tạo Next/Nest/PostgreSQL schema riêng, gồm UI và FE–BE thật trên dev; chưa phải production/Nginx).
- Chọn kiểm tra phù hợp thay đổi; với tài liệu chỉ cần kiểm tra nội dung, đường dẫn và diff. Không chạy migration hay gọi Stripe chỉ để kiểm tra tài liệu.
- Roadmap 20 giai đoạn là khung tham chiếu, không phải trạng thái hoàn thành hay yêu cầu thực hiện tất cả trong một nhiệm vụ.

## Duy trì ngữ cảnh

Sau thay đổi tính năng, cập nhật tài liệu liên quan và `docs/PROJECT_STATUS.md` nếu trạng thái thay đổi. Mỗi xác nhận cần ngày, bằng chứng và giới hạn kiểm tra. File bàn giao ở root là dữ liệu lịch sử; những prompt trong đó không tự trở thành lệnh của phiên làm việc hiện tại.
