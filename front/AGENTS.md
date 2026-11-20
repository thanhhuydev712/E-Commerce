<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## AWS demo hiện tại — 20/11/2026

- Runtime staging dùng `PREVIEW_READ_ONLY=true` cùng `INTERACTIVE_DEMO=true` và `PASSWORD_RECOVERY_ENABLED=true`. Trang login, giỏ, lưu PC, forgot/reset cho email thử đã mở; signup, orders, quote, payment và admin vẫn khóa ở API. Đừng coi đoạn preview chỉ đọc phía dưới là trạng thái hiện tại.
- Flag recovery được truyền từ server runtime vào ShopProvider; không dùng `NEXT_PUBLIC_*` cho secret hoặc allowlist. Link email có token trong fragment, RecoveryForm đọc rồi xóa fragment khỏi URL. Bản dùng link đổi mật khẩu thật còn chờ người dùng xác nhận; xem `../docs/PASSWORD_RECOVERY_AWS.md` và audit live.

## Bối cảnh triển khai của dự án — 06/11/2026

- Đọc [hướng dẫn chung](../AGENTS.md), [hiện trạng](../docs/PROJECT_STATUS.md) và [kế hoạch Docker/CI/CD/Nginx/AWS](../docs/DEPLOYMENT_PLAN.md) trước khi sửa phần build, env hoặc kết nối API.
- Định hướng: Next.js chạy bằng Docker production sau Nginx trên AWS EC2; GitHub Actions phát hành image qua ECR. Ngày 17/11 đã thêm Dockerfile/Compose/Nginx cho lab local và định nghĩa CI, xem [DOCKER_GUIDE](../docs/DOCKER_GUIDE.md) và PROJECT_STATUS để biết mức kiểm chứng; AWS/ECR/CD chưa triển khai.
- Dự kiến dùng Next standalone; phải đọc `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md`, `02-guides/environment-variables.md` và `03-api-reference/05-config/01-next-config-js/output.md` (hai đường dẫn sau cùng gốc `01-app/`) trước khi cài đặt. Giữ đủ `public`, `.next/static`, output tracing và cache/streaming theo bản Next đang cài.
- Browser dự kiến gọi `/api/v1` cùng origin; server-side dùng URL nội bộ ở runtime. Không đưa địa chỉ container hoặc secret vào JS browser; `NEXT_PUBLIC_*` cố định tại build nên cần cân nhắc khi promote cùng image qua staging/demo.
- `npm run test:e2e` chạy runner Next/Nest/PostgreSQL thật trong schema/cổng/cache riêng; không reuse dev server. Đã có luồng COD, nhưng Stripe/giao vận chưa hoàn chỉnh. Khi làm CI/deploy vẫn phải bổ sung mode production/Nginx; đọc PROJECT_STATUS để phân biệt kết quả UI và nghiệp vụ.
- Chỉ triển khai các thay đổi hạ tầng khi nhiệm vụ yêu cầu; yêu cầu lập kế hoạch không tự cấp quyền deploy hoặc sửa toàn bộ frontend.

## Mốc công khai đầu tiên — 17/11/2026

- Theo [RELEASE_PLAN.md](../docs/RELEASE_PLAN.md), người dùng chọn website giới thiệu/trải nghiệm công khai, chưa nhận đơn thật. Giữ thiết kế hiện tại, nhãn demo và giới hạn khả năng; không tự mở checkout kinh doanh/payment live hoặc điền thông tin cửa hàng giả.
- Ưu tiên vá dependency, nội dung/SEO và nghiệm thu production trước hạ tầng. `API_INTERNAL_URL` hiện là origin không kèm `/api/v1`; build dùng `distDir` tùy biến, phải đối chiếu khi đóng gói. Stripe sandbox đã có; đọc tài liệu mới thay vì coi mô tả lịch sử là hiện trạng.

- Docker bật `NEXT_OUTPUT=standalone`, `NEXT_DIST_DIR=.next-docker`, giữ public/static và chạy server.js non-root. PostCSS đã có cấu hình trong front để build độc lập; không bật standalone mặc định cho Windows/dev hoặc copy node_modules từ host vào image.

## Production preview — 18/11/2026

- Đọc [INFRASTRUCTURE_GUIDE](../docs/INFRASTRUCTURE_GUIDE.md) trước sửa env/build/deploy. `PREVIEW_READ_ONLY` là server runtime flag, không phải NEXT_PUBLIC build flag. ConnectedStore truyền xuống ShopProvider; banner và trang login chỉ giới thiệu khi bật, không bootstrap account/cart session. API còn có boundary chặn writes/private routes; không thay bằng FE-only guard.
- `compose.deploy.yaml` bật preview cho FE/BE, dùng HTTPS Nginx; production local test độc lập tại `infra/scripts/check-production.mjs` đã bổ sung browser/DB TLS/restore. Không đồng nhất smoke HTTP8080, dev E2E và nghiệm thu AWS. Next generated agent block phía trên phải được giữ nguyên.
