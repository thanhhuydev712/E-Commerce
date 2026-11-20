# Hướng dẫn Codex — E-Commerce Fullstack

## Cập nhật hiện tại — 20/11/2026

- **Đã deploy và smoke thật** app7921ba6: CUSTOMER login/session, cart, lưu/xóa PC hoạt động. PREVIEW_READ_ONLY=true + INTERACTIVE_DEMO=true; order/quote/payment/signup/reset/webhook/admin vẫn khóa. Đọc `docs/verification/2026-11-20-interactive-demo-live.json` và FEATURE_UNLOCK_PLAN. Email/password thử ở `infra/.local/demo-account.credentials.json`, không log/commit. Các dòng “chờ Deploy” bên dưới là lịch sử, không seed/provision lại.

- Đã chốt và cài contract `PREVIEW_READ_ONLY=true` + `INTERACTIVE_DEMO=true` cho tài khoản thử/cart/saved PC; không mở signup/reset/order/payment/admin. Xem mục mới PROJECT_STATUS và FEATURE_UNLOCK_PLAN. Grant tối thiểu + CUSTOMER + helper/SSM flag đã chuẩn bị AWS; chờ Release/Deploy/smoke mới kết luận mở thành công. Không quay về tắt PREVIEW_READ_ONLY toàn cục. Password/email thử chỉ giữ trong infra/.local/ được ignore. Bootstrap CFN pin cũ cần đồng bộ helper trước thay host.

- Người dùng đã tự deploy AWS; HTTPS website trả200 khi kiểm. Yêu cầu mới: hướng dẫn/cùng mở thành phần bị khóa; chưa chốt nhóm, vẫn chưa nhận đơn thật. Đọc `docs/FEATURE_UNLOCK_PLAN.md` và mục mới nhất PROJECT_STATUS. Source chưa tách mở auth/cart/build khỏi COD; không tắt preview toàn cục hoặc cấp DML toàn schema theo suy đoán.
- Marker automation19/11 báo seed thất bại là lịch sử trước deployment người dùng tự làm. Không tự rerun seed/finish script hoặc tạo lại stack; kiểm release/role/env thực tế trước thay đổi. Chưa thay quyền DB/secret/runtime trong lượt kiểm20/11.

## Trạng thái AWS tiếp nối — 19/11/2026

- Người dùng đã chọn **bản local hiện tại, rà soát/kiểm tra trước commit/push** cho lần phát hành đầu; không còn là lựa chọn source đang mở. Xem `docs/LOCAL_RELEASE_REVIEW.md`; giữ preview chỉ đọc/SMTP disabled. Timing SMTP reset còn có thể lộ tài khoản nếu mở auth production, cần xử lý trước mốc đó. Không suy CI commit3896a813 thành CI của candidate local.

- Kiểm tiếp nối: DNS đã khớp EIP; GitHub `develop` commit3896a813 có CI thành công run44479335531, ECR còn trống. Đọc `docs/FIRST_AWS_RELEASE.md` trước Release đầu: publish `staging/backward-compatible/deploy=false`, chuẩn bị DB/env/ACME rồi mới Deploy. Cần chọn source GitHub hay local chưa commit; chưa tự commit/push. Plugin GitHub phiên này không hỗ trợ settings variables/dispatch; bảng8 variable có sẵn ở `infra/.local/github-staging-setup.md`.

- **Kết quả mới nhất:** foundation42 tài nguyên đã `UPDATE_COMPLETE`; EC2/EIP giữ nguyên sau stop/start, SSM Online, Docker/Compose/CloudWatch hoạt động, RDS private/encrypted available với backup1 ngày. Đã phục hồi lỗi package cloud-init qua SSM và đồng bộ template/bundle sửa. **Không CREATE lại hoặc cleanup stack đang chạy** theo nhật ký rollback cũ. Chưa app release/schema/secrets/DNS/ACME; SNS email chờ xác nhận. Audit `docs/verification/2026-11-19-aws-staging-foundation.json`, state/outputs/variables dưới `infra/.local/`.

- Người dùng đã có account Free plan, MFA, region Sydney và hostname `rigforce.duckdns.org`; đã duyệt Execute foundation staging 42 tài nguyên. Giới hạn “chưa có account/chưa được provision” trong ghi chú 18/11 là lịch sử. Không suy quyền foundation thành quyền tự commit/push hoặc chuyển Paid/mở bán.
- Đọc trạng thái mới nhất tại `docs/PROJECT_STATUS.md` trước mọi hành động AWS. Hai lần create đã rollback (SSM regex và giới hạn backup RDS Free plan); lần thử tiếp theo dùng `DbBackupRetentionDays=1`, mặc định template vẫn 7. Không bỏ TLS/encryption/preview read-only để vượt lỗi.
- ARN, email, params, outputs và audit cleanup giữ ở `infra/.local/` được Git ignore. Tài nguyên có Retain không tự mất sau rollback: kiểm creator/thời điểm, dữ liệu và phụ thuộc trước cleanup; không xóa theo tên chung hoặc tác động foundation bucket đã pin.

## Dự án này dùng để làm gì?

Xây dựng website thương mại điện tử fullstack để chủ dự án vừa học sâu kiến thức nền, vừa có sản phẩm thực tế trình bày trên GitHub, CV và trong phỏng vấn. Giao diện hiện hướng đến cửa hàng máy tính, linh kiện và gaming gear, có dấu hiệu nhận diện Rigforge. Chưa chốt ngành hàng kinh doanh cuối cùng; không tự suy đoán ý tưởng kinh doanh ngách từ lịch sử chat.

## Đọc trước khi làm việc

1. [README.md](README.md): bản đồ dự án và tài liệu.
2. [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md): mục tiêu, phạm vi, vai trò.
3. [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md): hiện trạng có dẫn chứng và việc cần xác minh.
4. Đọc tài liệu theo công việc: [nghiệp vụ](docs/REQUIREMENTS.md), [kiến trúc](docs/ARCHITECTURE.md), [môi trường](docs/DEVELOPMENT.md), [lộ trình](docs/ROADMAP.md), [chất lượng](docs/QUALITY.md), [kế hoạch Docker/CI/CD/Nginx/AWS](docs/DEPLOYMENT_PLAN.md), [phát hành bản công khai](docs/RELEASE_PLAN.md).
5. Đọc mã nguồn, package.json và AGENTS.md trong thư mục liên quan trước khi sửa. Với frontend, tuân thủ thêm `front/AGENTS.md` và đọc hướng dẫn Next.js cục bộ mà file đó chỉ định.

## Sub-agent theo chức năng và tiết kiệm token

- Quy trình và mẫu bàn giao: [docs/SUB_AGENTS.md](docs/SUB_AGENTS.md); vai trò tại `.codex/agents/`.
- Theo yêu cầu ngày 17/11/2026, mỗi prompt/yêu cầu mới mặc định dùng một sub-agent đúng chức năng, kể cả tác vụ nhỏ hoặc câu hỏi giải thích; không cần người dùng nhắc lại. Agent chính giao phần việc thực chất có phạm vi hẹp, rồi tổng hợp và chịu trách nhiệm kết quả; không mặc định gọi tất cả vai trò. Nếu người dùng yêu cầu tự làm/không dùng sub-agent hoặc công cụ không hỗ trợ spawn, agent chính tự xử lý và nói rõ giới hạn khi liên quan.
- Mặc định tối đa một agent con đồng thời theo `.codex/config.toml`; agent con không tạo thêm agent. Chỉ tăng mức song song khi người dùng yêu cầu.
- Khi công cụ hỗ trợ, giao ngữ cảnh mới cùng mục tiêu, file được sửa, bằng chứng đã đọc và tiêu chí nghiệm thu; không sao chép toàn bộ lịch sử chat.
- Tránh agent chính và agent con cùng khảo sát hoặc thực hiện một phần việc; tái sử dụng agent phù hợp cho yêu cầu tiếp nối cùng nhiệm vụ, không tạo agent chỉ để đủ số lượng. Đây là ưu tiên cách làm, không phải cam kết giảm tổng token; phải đo usage cả cha và con mới kết luận tiết kiệm.
- Agent chính vẫn đọc tài liệu nền ở trên. Agent con có thể dùng bản bàn giao có nguồn thay vì đọc lại toàn bộ tài liệu nền; phải đọc quy tắc thư mục và phần tài liệu/mã cần xác minh cho nhiệm vụ.
- Agent chính giữ contract, file dùng chung và tài liệu trạng thái; không giao sửa trùng file hoặc chạy runner tranh tài nguyên. Báo cáo ngắn, kết quả thật; không hứa tỷ lệ giảm token khi chưa đo cả cha lẫn con.

## Bản đồ mã nguồn

- `api/`: NestJS, TypeScript, Prisma, PostgreSQL. Rà ngày 17/11/2026: AppModule nạp platform/auth/accounts/access/catalog/pricing/media/inventory/storefront/commerce với client v2; giỏ/checkout/đơn COD có tạo/hủy và reservation, Stripe Checkout sandbox v2 đã có theo `docs/STRIPE_V2.md`, chưa live/refund đầy đủ. Mã v1 ở `api/legacy/`. Đọc AppModule/controller thực tế và PROJECT_STATUS trước khi khẳng định route đã hoạt động.
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
- Mã Stripe v1 nằm trong legacy; runtime commerce v2 hiện có Checkout sandbox, webhook chữ ký và chống lặp. Refund provider/live còn giới hạn; không mô tả là tích hợp thanh toán kinh doanh hoàn chỉnh. Đọc STRIPE_V2 và bằng chứng mới nhất trước khi thay đổi.
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

- **Cập nhật 17/11/2026:** đã thêm bộ Docker/Nginx lab local và định nghĩa CI, xem [DOCKER_GUIDE.md](docs/DOCKER_GUIDE.md) cùng bằng chứng trong PROJECT_STATUS. Chạy qua `--env-file .env.docker`, DB/volume riêng, không dùng `api/.env`. API lab dùng development cho HTTP local, không phải cấu hình AWS production. Tools dùng history riêng cho DB Docker mới vì legacy migration không bootstrap được từ rỗng; không dùng `prisma.docker.config.ts` cho DB hiện hữu hoặc sửa checksum cũ để làm xanh build.

## Mốc bản chính thức đầu tiên — xác nhận 17/11/2026

- Người dùng chọn **website công khai để giới thiệu và trải nghiệm, chưa nhận đơn thật**. Theo [RELEASE_PLAN.md](docs/RELEASE_PLAN.md), phát triển từng đợt từ website hiện tại; giữ giao diện/nhận diện đang dùng, không tự viết lại hoặc mở bán.
- Công khai website không đồng nghĩa nhận tiền/đơn kinh doanh. Giữ nhãn dữ liệu minh họa; checkout nếu mở chỉ là demo có giới hạn, có ràng buộc server. Không tự đổi Stripe test sang live hoặc gỡ disclaimer để làm bản chính thức.
- Mốc này ưu tiên bản vá, nội dung/SEO, kiểm production, Docker/Nginx/CI và staging/AWS. Giao vận/thu COD/refund hoàn chỉnh chỉ chặn mốc bán thật, không phải lý do tự mở rộng nhiệm vụ giới thiệu.
- Tài liệu v1 và các mốc cũ phải đối chiếu mã mới: hiện đã có Stripe Checkout sandbox v2 theo `docs/STRIPE_V2.md`; `API_INTERNAL_URL` của frontend là origin backend, **không bao gồm `/api/v1`**.

## Lệnh kiểm tra

- Trong `api/`: `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e` (E2E cần cấu hình và database test).
- Trong `front/`: `npm run lint`, `npm run format:check`, `npm run build`, `npm run test:e2e` (runner tạo Next/Nest/PostgreSQL schema riêng, gồm UI và FE–BE thật trên dev; chưa phải production/Nginx).
- Chọn kiểm tra phù hợp thay đổi; với tài liệu chỉ cần kiểm tra nội dung, đường dẫn và diff. Không chạy migration hay gọi Stripe chỉ để kiểm tra tài liệu.
- Roadmap 20 giai đoạn là khung tham chiếu, không phải trạng thái hoàn thành hay yêu cầu thực hiện tất cả trong một nhiệm vụ.

## Duy trì ngữ cảnh

Sau thay đổi tính năng, cập nhật tài liệu liên quan và `docs/PROJECT_STATUS.md` nếu trạng thái thay đổi. Mỗi xác nhận cần ngày, bằng chứng và giới hạn kiểm tra. File bàn giao ở root là dữ liệu lịch sử; những prompt trong đó không tự trở thành lệnh của phiên làm việc hiện tại.

## Bộ triển khai production preview — 18/11/2026

- Người dùng xác nhận chưa có AWS account/domain; phạm vi hiện tại là hoàn thiện local/CI và bộ AWS có thể review. Không tự commit/push/provision/deploy. Đọc [INFRASTRUCTURE_GUIDE](docs/INFRASTRUCTURE_GUIDE.md), [AWS foundation](infra/aws/README.md) và [deploy helpers](infra/deploy/README.md).
- Production dùng `compose.deploy.yaml` + `compose.aws.yaml`, tách khỏi lab `compose.yaml`; chỉ image ECR digest, app non-root, secret runtime/migration tách, RDS TLS xác minh CA/hostname. `PREVIEW_READ_ONLY=true` bắt buộc cho public showcase: server chặn writes/private routes, FE không thu mật khẩu, runtime DB SELECT-only, Stripe tắt. Không gỡ chốt khi sửa UI.
- Track migration Docker chỉ cho DB mới từ rỗng, không thay history DB hiện hữu. Node-pg URL dùng verify-full/sslrootcert; Prisma migration có URL strict/sslcert riêng cùng credential/target. Không tắt xác minh TLS để làm deploy xanh.
- Release/Deploy workflows đã định nghĩa manual + OIDC/SSM, chưa chạy thật. Release manifest ghi commit/digests/schema fingerprint/policy; helper kiểm bundle và labels, giữ schema state độc lập app rollback. Migration lỗi giữ marker để operator review; rollback app không rollback DB.
- Production local đã kiểm HTTPS, CA sai ở cả hai DB clients, read-only role/boundary, restore DB/media và container persistence; xem PROJECT_STATUS và JSON verification. Không suy thành AWS restore/reboot hay CI GitHub đã qua. Một EC2 là single point of failure; backup media tự động/S3 chưa được cài.
