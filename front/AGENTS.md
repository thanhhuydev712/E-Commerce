<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Bối cảnh triển khai của dự án — 06/11/2026

- Đọc [hướng dẫn chung](../AGENTS.md), [hiện trạng](../docs/PROJECT_STATUS.md) và [kế hoạch Docker/CI/CD/Nginx/AWS](../docs/DEPLOYMENT_PLAN.md) trước khi sửa phần build, env hoặc kết nối API.
- Định hướng sau khi hoàn thiện FE–BE: Next.js chạy bằng Docker production sau Nginx trên AWS EC2; GitHub Actions phát hành image qua ECR. Đây là kế hoạch, chưa xác nhận Dockerfile/pipeline/deployment tồn tại.
- Dự kiến dùng Next standalone; phải đọc `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md`, `02-guides/environment-variables.md` và `03-api-reference/05-config/01-next-config-js/output.md` (hai đường dẫn sau cùng gốc `01-app/`) trước khi cài đặt. Giữ đủ `public`, `.next/static`, output tracing và cache/streaming theo bản Next đang cài.
- Browser dự kiến gọi `/api/v1` cùng origin; server-side dùng URL nội bộ ở runtime. Không đưa địa chỉ container hoặc secret vào JS browser; `NEXT_PUBLIC_*` cố định tại build nên cần cân nhắc khi promote cùng image qua staging/demo.
- `npm run test:e2e` chạy runner Next/Nest/PostgreSQL thật trong schema/cổng/cache riêng; không reuse dev server. Đã có luồng COD, nhưng Stripe/giao vận chưa hoàn chỉnh. Khi làm CI/deploy vẫn phải bổ sung mode production/Nginx; đọc PROJECT_STATUS để phân biệt kết quả UI và nghiệp vụ.
- Chỉ triển khai các thay đổi hạ tầng khi nhiệm vụ yêu cầu; yêu cầu lập kế hoạch không tự cấp quyền deploy hoặc sửa toàn bộ frontend.
