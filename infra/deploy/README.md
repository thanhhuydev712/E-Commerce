# Helper triển khai trên EC2

Hai helper này chạy bằng root trên host đã bootstrap; không phải lệnh chạy từ Windows hoặc máy dev. [AWS foundation](../aws/README.md) cài chúng từ bundle ba file có version/checksum vào `/opt/rigforce/bin`. Việc có script trong repo không đồng nghĩa AWS đã được provision hay app đã deploy.

## Contract đầu vào

```bash
/opt/rigforce/bin/apply-release.sh --prepare KEY VERSION_ID SHA256
/opt/rigforce/bin/apply-release.sh KEY VERSION_ID SHA256
/opt/rigforce/bin/fetch-env.sh
```

`KEY` phải là `releases/<staging|demo>/<40-char-commit>/release.tar.gz`, đúng môi trường trong host.env. `VERSION_ID` là S3 version thật, không `null`, giữ nguyên ký tự `+`/`/`/`=` bằng quoted argument. SHA256 gồm 64 ký tự hex thường. SSM document chỉ cung cấp ba tham số này, không cho truyền shell command hay `--prepare` từ workflow deploy thường ngày.

`/opt/rigforce/shared/host.env` phải là regular file root-owned mode 0600, chứa identifier không secret: AWS_REGION, PROJECT_NAME, ENVIRONMENT, DOMAIN_NAME, RELEASE_BUCKET, RUNTIME_PARAMETER_NAME, MIGRATION_PARAMETER_NAME, LOG_GROUP_PREFIX. Helper source **chỉ file bootstrap đáng tin này**. Không source payload từ SSM hoặc manifest.

Manifest `schemaVersion: 1` cần các trường:

```json
{
  "schemaVersion": 1,
  "commit": "<40 lowercase hex>",
  "images": {"api": "<ECR@sha256>", "front": "<ECR@sha256>", "tools": "<ECR@sha256>"},
  "migrationPolicy": "none | backward-compatible | maintenance-required",
  "schemaFingerprint": "<64 lowercase hex>",
  "sourceDirty": false
}
```

API/tools phải thuộc repo `<project>/<environment>/api`, frontend thuộc `<project>/<environment>/front`, cùng ECR account và region của host. Sau pull, cả ba image phải là linux/amd64, có labels `org.opencontainers.image.revision` khớp commit và `dev.rigforce.schema-fingerprint` khớp manifest. `sourceDirty=true` được stage để review nhưng không được deploy.

Tar chỉ chứa `manifest.json`, `compose.deploy.yaml`, `compose.aws.yaml`, `infra/nginx/*.{conf,template}`, `infra/deploy/*.{sh,service,timer}` và directory entry tương ứng. Không có env/example/docs/key/media. Helper chấp nhận leading `./`, từ chối links/special files/traversal/duplicate path, JSON duplicate keys và file ngoài allowlist. Giới hạn 16 MiB compressed, 64 MiB expanded, 128 entries, 2 MiB mỗi file. Không dùng `tar extract` trực tiếp lên root filesystem.

## Luồng prepare và deploy

`--prepare` tải đúng S3 object version, kiểm SHA256/tar/manifest, đặt file trong `/opt/rigforce/releases/<commit>/<bundle-sha256>`, lấy hai SecureString và viết `compose.env` không secret. Nó kiểm `compose config --quiet`; **không** pull image, chạy migration, up container, cấp cert hoặc đổi current/previous. Đường dẫn release được in để operator chạy certificate/DB setup trước lần deploy đầu.

Deploy đầy đủ thực hiện:

1. Lấy host `flock` chung với certificate/secret refresh. Từ chối nếu có marker deployment/schema chưa được xử lý.
2. Kiểm migration policy bằng trạng thái schema host đã biết; refresh env và tạo Compose env từ identifier/image digest đã validate.
3. Kiểm certificate trước migration: hostname, ít nhất 24 giờ hiệu lực còn lại, public trust chain và private key khớp. Certificate tự ký/CA sai không được bỏ qua bằng `-k`.
4. Login ECR bằng instance role vào `DOCKER_CONFIG` tạm mode 0700, pull image và kiểm labels/platform. Token không đi vào log và được xóa khi kết thúc, kể cả giữ snapshot phục hồi sau rollback lỗi.
5. Chạy `compose run --rm --no-deps migrate` một lần với migration env riêng. Không có schema rollback.
6. Ghi schema-state rồi `compose up --detach --wait` cho api/front/nginx; HTTPS smoke `/` và `/api/v1/storefront` qua Nginx local bằng `curl --resolve` vẫn xác minh certificate thật.
7. Chỉ sau smoke thành công mới đổi `previous` rồi `current` bằng rename symlink atomic. Retry cùng release giữ previous khác current thay vì tự ghi đè history bằng chính release đó.

Smoke xác nhận HTML và catalog JSON có mảng products, cho phép catalog rỗng vì không tự seed public DB. Readiness DB do health checks của Compose. Probe `--resolve` kiểm host này, chưa chứng minh DNS/public firewall từ Internet, browser flows hay email/thanh toán.

## Secret payload và quyền

`fetch-env.sh` gọi `GetParameter --with-decryption` cho **đúng hai tên** `/project/environment/runtime-env` và `/project/environment/migration-env`. Response được giữ trong thư mục root-only tạm, kiểm `Type=SecureString` và tên trước khi dùng. Nội dung không được in hoặc eval/source; parser giữ giá trị raw để Compose `format: raw` không chạy shell hay nội suy `$` trong secret.

Runtime cần DATABASE_URL, DATABASE_SCHEMA=public, JWT_SECRET/JWT_REFRESH_SECRET khác nhau dài ít nhất 32 ký tự, ALLOWED_ORIGINS và STOREFRONT_URL đúng `https://<DOMAIN_NAME>`. Chỉ cho thêm JWT_EXPIRES_IN/REFRESH_TTL_SECONDS và các flag production có giá trị cố định. Không nhận Stripe/provider key trong bản preview này.

Migration chỉ có DATABASE_URL, PRISMA_MIGRATION_DATABASE_URL và DATABASE_SCHEMA=public. Hai URL migration phải dùng cùng host/DB/user/password, khác dialect TLS:

- adapter-pg: `sslmode=verify-full&sslrootcert=/run/certs/rds-global-bundle.pem`;
- Prisma CLI: `sslmode=require&sslaccept=strict&sslcert=/run/certs/rds-global-bundle.pem`.

Runtime/migration phải cùng RDS target nhưng username khác nhau. Helper kiểm URL/TLS/role identity, **không chứng minh quyền SQL thực tế**; operator/DB setup phải cấp runtime SELECT-only và migration DDL theo phạm vi preview. Các file được validate đủ trước khi đổi file; mỗi file được rename atomic, root:root mode 0600. Host lock tuần tự hóa refresh với deploy/container creation. Không coi hai lần rename là transaction filesystem chống SIGKILL/mất điện.

Không dùng `docker compose config` hoặc `docker inspect` để in secret ra console; helper chỉ dùng quiet config và inspect riêng labels/platform. Raw command output tạm bị ẩn khỏi SSM/CI log; xem log service bằng quyền operator khi điều tra và giữ nguyên yêu cầu che secret.

## Migration policy, lỗi và rollback

`none` chỉ được dùng khi `shared/schema-state.json` đã có **cùng fingerprint**. Lần đầu cần `backward-compatible`; `maintenance-required` bị từ chối trong auto deploy và cần quy trình bảo trì riêng. Policy là cam kết được review trong release; helper không tự chứng minh một SQL migration tương thích ngược.

`schema-state.json` theo DB, không theo symlink app. Sau migration thành công và app lỗi, rollback app giữ fingerprint DB mới; lượt sau không được lấy fingerprint cũ của current manifest để che schema thay đổi. Nếu migration thất bại hoặc bị interrupt, `schema-uncertain` và `deploy-in-progress.json` giữ lại; app cũ chưa bị up/recreate và script không cố hạ schema. Operator cần đọc migration history, xác định phần đã áp, sửa/resume đúng quy trình rồi mới quyết định bỏ marker. Không sửa checksum SQL đã áp để làm xanh.

Deploy một bundle cũ qua SSM vẫn là **một lượt migration + deploy**, không phải app-only rollback. Migration guard trong tools image phải từ chối DB có migration tương lai không nằm trong image hoặc checksum SQL khác; helper chỉ cập nhật schema-state sau khi job đó thành công. Muốn quay app về bản cũ trên schema mới phải theo compatibility đã duyệt/runbook app-only, không gửi bundle cũ để mong Prisma hạ schema.

Nếu migration đã thành công nhưng up/HTTPS smoke lỗi, helper chỉ thử rollback app khi policy là backward-compatible hoặc fingerprint không đổi. Nó khôi phục env snapshot trước lượt deploy, up cấu hình/image current cũ và kiểm HTTPS lại; không chạy migration cũ. Nếu credential đã rotate và credential cũ mất hiệu lực, rollback có thể thất bại: đó là phần cần operator recovery, không có bảo đảm app rollback giải quyết rotation.

Không có current tương thích thì dừng candidate services, giữ DB/volume để điều tra. Rollback lỗi giữ marker và snapshot env private trong `shared/.failed-release-*`; không đưa thư mục này vào bundle/Git/log. Token ECR tạm vẫn bị xóa. Script trả exit code lỗi ngay cả khi rollback app thành công để workflow không báo bản phát hành mới thành công.

Đổi current/previous chỉ diễn ra sau health/smoke. Reboot/SIGKILL giữa các bước cần đối chiếu marker, container đang chạy, schema-state và symlink trước khi triển khai lại; không tự xóa marker khi startup. Không gọi `down -v`, xóa volume hoặc tự restore DB trong helper.

## Kiểm tra đã thực hiện — 18/11/2026

- Bash syntax và ShellCheck 0.11.0: hai helper qua.
- 19 fixture offline cho tar/manifest/env: valid bundle, traversal/link/duplicate/secret-file, repo environment/tag/type/commit/policy sai, TLS/role/origin/unknown key sai; raw shell-like secret được giữ literal.
- 14 lượt integration trong container cách ly với AWS CLI/Docker/curl/OpenSSL **giả lập**: prepare không launch; deploy thành công; app lỗi → rollback/current không đổi; schema mới giữ sau rollback; policy none với schema cũ bị chặn; label sai/dirty/traversal/maintenance bị chặn; retry giữ previous; migration lỗi giữ marker và chặn deploy tiếp; prepare vẫn dùng để kiểm candidate; rollback lỗi giữ snapshot private và xóa token ECR.

Các fixtures không gọi AWS hay Docker daemon từ bên trong harness. OpenSSL/curl được mock ở integration, vì vậy không dùng kết quả này để khẳng định TLS/network/AWS đã hoạt động. Kiểm production HTTPS/TLS/DB thật trên Docker nằm trong bằng chứng của bộ production check riêng; deployment AWS, OIDC/SSM/ECR/S3 IAM, public DNS/ACME, interruption/reboot/restore vẫn cần môi trường thật khi được yêu cầu.
