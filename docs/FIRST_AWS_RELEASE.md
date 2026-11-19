# Phát hành ứng dụng đầu tiên lên AWS staging

## Điểm xuất phát đã kiểm tra — 19/11/2026

- Foundation42 tài nguyên đang `UPDATE_COMPLETE`; không chạy lại CREATE.
- DNS A của `rigforce.duckdns.org` đã trỏ Elastic IP của EC2. DNS đúng chưa chứng minh website/HTTPS chạy.
- Hai repository ECR staging chưa có image; SNS email vẫn chờ xác nhận tại lúc kiểm.
- Commit GitHub `3896a8130f4a9df3eb683672de0ef3eb7caa0b34` có [CI thành công](https://github.com/thanhhuydev712/E-Commerce/actions/runs/44479335531). Đây là kiểm cho commit đó, không chứng nhận các thay đổi local chưa commit.

## 1. Chọn mã nguồn phát hành

**Lựa chọn đã chốt tiếp nối 19/11/2026:** dùng bản local hiện tại; rà soát/kiểm tra trước commit/push. Xem [hồ sơ rà soát](LOCAL_RELEASE_REVIEW.md). Không tự dùng commit3896a813 để phát hành bản đầu thay cho lựa chọn này; CI của commit đó chỉ là bằng chứng lịch sử.

GitHub Actions checkout commit trên GitHub. Nó không đọc working tree trên máy Windows. Có thể dùng commit đã CI xanh để kiểm luồng triển khai đầu tiên, hoặc rà soát/kiểm thử rồi commit/push các thay đổi local theo phạm vi chủ dự án chọn. Không tự gom mọi file bằng `git add .` khi chưa review dữ liệu và phạm vi.

Giữ `PREVIEW_READ_ONLY=true`, tắt Stripe và không thu tài khoản/đơn thật. Không dùng master DB credential cho ứng dụng hoặc CI.

## 2. Điền GitHub Environment variables

Mở repository → **Settings → Environments → staging**. Nếu chưa có environment, tạo `staging`; giới hạn deployment branch `develop` theo default branch đã chọn. Trust OIDC có environment trong subject nên branch policy phải đặt ở GitHub.

Thêm các mục dưới đây tại **Environment variables**, không phải Environment secrets:

| Tên variable | Thành phần sử dụng | Chức năng |
| --- | --- | --- |
| `AWS_REGION` | Release/Deploy | Region chứa tài nguyên staging |
| `AWS_RELEASE_ROLE_ARN` | Release | Role tạm thời cho build/publish image và bundle |
| `AWS_DEPLOY_ROLE_ARN` | Deploy | Role tạm thời yêu cầu triển khai qua SSM |
| `API_REPOSITORY_URI` | Release | ECR repository API và tools image |
| `FRONT_REPOSITORY_URI` | Release | ECR repository Next.js |
| `RELEASE_BUCKET` | Release | Bucket private lưu bundle có version/checksum |
| `INSTANCE_ID` | Deploy | EC2 đích của SSM Run Command |
| `RELEASE_DOCUMENT` | Deploy | SSM document giới hạn thao tác triển khai |

Giá trị thật lấy từ `infra/.local/github-staging.variables.json`; bảng copy thuận tiện nằm ở `infra/.local/github-staging-setup.md`. Cả hai được Git ignore. Không cần tạo hoặc dán AWS access key. Không dùng tên `AWS_INSTANCE_ID`/`AWS_RELEASE_DOCUMENT`: workflow đọc chính xác `INSTANCE_ID`/`RELEASE_DOCUMENT`.

Plugin GitHub của phiên hiện tại không hỗ trợ environment variables hoặc workflow dispatch; chưa xác nhận các biến đã được lưu trên GitHub. Operator thực hiện trên giao diện GitHub, hoặc qua CLI đã xác thực riêng khi được yêu cầu.

## 3. Chạy Release để xuất bản image

Mở **Actions → Release AWS → Run workflow** sau khi đã chọn commit:

- Branch: `develop` (workflow yêu cầu default branch).
- `environment`: `staging`.
- `migration_policy`: **`backward-compatible`** cho DB mới lần đầu.
- `deploy`: **bỏ chọn / false**.

Workflow chạy CI trước, sau đó dùng OIDC/STS nhận quyền AWS tạm thời, build/push image vào ECR và upload bundle vào S3. Chưa chạy app ở bước này. Nếu lỗi, đọc job/step thất bại; không bỏ CI hoặc đổi quyền sang Administrator để làm xanh.

Lưu từ job summary: release key, S3 VersionId, SHA256 và digest của API/frontend/tools. Không dùng tag `latest` thay cho digest. Bản phát hành phải gắn với commit đã kiểm tra, không tự build working tree bẩn để thay thế workflow.

## 4. Chuẩn bị DB, runtime env và HTTPS

Operator tiếp tục theo [hướng dẫn hạ tầng](INFRASTRUCTURE_GUIDE.md) và [AWS README](../infra/aws/README.md):

1. Dùng tools image digest vừa publish để tạo migration/runtime roles trên **DB mới trống** bằng `scripts/setup-db-roles.cjs --new-database`. Runtime chỉ SELECT; master credential chỉ dùng trong thao tác operator riêng và không gửi vào chat/CI/SSM command parameters/log.
2. Lưu runtime và migration env thành hai SecureString riêng; hai DB client đều xác minh CA/hostname. Không copy placeholder hoặc tắt TLS verification.
3. Chạy `apply-release.sh --prepare KEY VERSION SHA` để kiểm/tải bundle và chuẩn bị cấu hình; chưa chạy full app.
4. Kiểm DNS A khớp EIP, kiểm thêm AAAA nếu có; dùng `certificate.sh test-issuance`, sau đó `issue` để cấp certificate thật. Không coi certificate staging của ACME là HTTPS public hợp lệ.
5. Nạp catalog mẫu chỉ khi được yêu cầu, bằng `seed-preview.sh --new-sample-catalog` trên DB mới. Không thay thế dữ liệu thật hoặc tự mở nhận đơn.

## 5. Deploy và nghiệm thu

Chạy **Deploy AWS** với đúng environment/key/version/SHA từ Release. Theo dõi SSM tới trạng thái cuối, rồi kiểm HTTPS, frontend/API/media, cùng origin `/api/v1` và chốt read-only phía server. EC2 pull/run image đã build, không git pull hoặc build source trên host.

Chỉ xác nhận website public sau kiểm thực tế. App rollback không rollback schema; AWS restore và ứng dụng qua reboot còn phải diễn tập riêng. Xác nhận email SNS của stack hiện tại để nhận alarm. Budget20 USD là ngưỡng cảnh báo, không tự dừng tài nguyên và không phải hard cap.
