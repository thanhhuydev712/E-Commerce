# AWS foundation có thể review trước khi có tài khoản/domain

Bộ file này chuẩn bị **staging hoặc demo**, chưa được provision trên AWS. Ngày kiểm nguồn và kiểm tĩnh: **18/11/2026**. Chủ dự án chưa có AWS account/domain; không cần thực hiện các lệnh AWS bên dưới để tiếp tục học và kiểm Docker local. Các lệnh ở phần provisioning dành cho một lượt triển khai được yêu cầu rõ sau khi chốt chi phí.

- [cloudformation.yaml](cloudformation.yaml): mạng, EC2, RDS, IAM/OIDC, ECR/S3, KMS, logs/alarms và Budget.
- [bootstrap.sh](bootstrap.sh): chuẩn bị host Amazon Linux 2023 x86_64; không seed, không tự phát hành app, không tự cấp certificate.
- [parameters.example.json](parameters.example.json): contract tham số có placeholder, không chứa mật khẩu và không phải cấu hình chạy được ngay.

Kế hoạch tổng thể: [DEPLOYMENT_PLAN](../../docs/DEPLOYMENT_PLAN.md). Compose local và production là các cấu hình riêng; không đưa `compose.yaml` có DB local hoặc `NODE_ENV=development` lên AWS.

## 1. Tài nguyên được thiết kế

| Thành phần | Cách tạo | Lý do và giới hạn |
| --- | --- | --- |
| VPC | Một public subnet cho EC2, hai private DB subnet ở hai AZ | DB subnet group có hai AZ dù RDS Single-AZ. Private route table không có Internet/NAT route |
| EC2 | AL2023 x86_64 AMI được pin, t3.medium mặc định, gp3 mã hóa | Ứng dụng build ở CI; host chỉ pull/run. Một host là điểm lỗi duy nhất, không có zero downtime |
| IP/network | Elastic IP, inbound 80/443; không 22/3000/3001/5432 | 80 cho ACME/redirect, 443 cho storefront; quản trị qua Session Manager. IPv4 public có phí |
| RDS | PostgreSQL 17 minor do operator chọn, private, gp3 mã hóa, 7 ngày backup | Single-AZ giảm chi phí, chưa có HA. `rds.force_ssl=1`; app vẫn phải xác minh CA/hostname |
| Master DB secret | RDS `ManageMasterUserPassword` | AWS sinh/giữ master password trong Secrets Manager; app/CI không được đọc master secret |
| ECR | Repo API và frontend riêng cho từng môi trường | Tags immutable, scan-on-push; tools target dùng digest khác trong repo API. Chỉ expire image untagged sau 30 ngày |
| S3 release | Private, versioning, AES256, HTTPS-only | Bundle không secret; lưu version ID/SHA256. Không tự expire version có thể dùng rollback; cần review storage định kỳ |
| Runtime secret | Hai SecureString `/rigforce/<env>/runtime-env` và `migration-env`, KMS riêng stack | Tạo ngoài CFN, không có secret trong template/Outputs/UserData/bundle |
| IAM | Role EC2, role GitHub release, role GitHub deploy | Không access key lâu dài; CI không được đọc env/master secret; deploy chỉ gọi một SSM document |
| CloudWatch | Host agent: bootstrap/deploy/SSM logs + RAM/disk; containers dùng awslogs override | Agent không wildcard đọc một file Docker ngẫu nhiên. Log groups có retention; metrics/logs có phí |
| Alarms/Budget | CPU, status checks, RAM/disk, DB free storage; email warning | Budget tính **toàn account**, không phải riêng stack hay hard cap; cần xác nhận SNS email subscription |

Không thêm NAT Gateway, ALB, ECS, Route 53 hoặc custom Lambda trong baseline. EC2 có outbound HTTPS qua Internet Gateway để dùng ECR/S3/SSM, kho package, ACME. Security group DB chỉ nhận PostgreSQL từ SG EC2; DB không public. [Yêu cầu RDS VPC/subnet](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_VPC.WorkingWithRDSInstanceinaVPC.html).

Template dành cho AWS commercial partition; ARN OIDC và cách bootstrap hiện chưa hỗ trợ GovCloud/China. Region do CLI chọn, không hardcode account/region/domain. Tham số VPC/subnet cần CIDR hợp lệ, không chồng lấn; hai AZ cần khác nhau và hỗ trợ DB class được chọn.

## 2. Secret và ranh giới quyền

CloudFormation không hỗ trợ tạo `AWS::SSM::Parameter` loại SecureString. Vì vậy template chỉ tạo KMS key và output **tên parameter**, để operator có quyền phù hợp tạo giá trị sau khi setup DB roles. Không thay bằng String chứa secret hoặc custom resource tự in secret. [Giới hạn CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-ssm-parameter.html).

Instance role chỉ có `ssm:GetParameter` cho đúng hai ARN; không có `GetParametersByPath`, không đọc toàn prefix và không có `secretsmanager:GetSecretValue`. Quyền KMS decrypt giới hạn đúng key, `ViaService=ssm.<region>.amazonaws.com` và encryption context của hai parameter. Cấu hình staging/demo tạo ở stack riêng: DB, KMS, ECR, S3 và secret không dùng chung.

Hai credential DB có nhiệm vụ khác nhau:

- `runtime.env`: `DATABASE_URL` của role app chỉ CONNECT/USAGE và SELECT cho bản public preview hiện tại; không DML/CREATE, không sở hữu schema/table, không phải master. Mở ghi dữ liệu là một mốc có chủ đích sau này, không cấp sẵn quyền chỉ để chuẩn bị.
- `migration.env`: `DATABASE_URL` của role migration có quyền DDL phù hợp schema ứng dụng; chỉ gắn vào migration one-shot. Không truyền file này cho Next/API runtime.

Operator dùng master secret qua Session Manager/tunnel và script setup DB roles của bộ deployment để tạo hai DB roles/quyền mặc định **trước migration đầu tiên**. Quyền SELECT runtime cần áp cả bảng hiện có và `ALTER DEFAULT PRIVILEGES` của đúng role tạo bảng, nếu không migration sau có thể tạo bảng mà app không đọc được. Không đưa password SQL vào command history/log. Template chưa tự tạo DB roles hay chạy SQL này; preview cũng cần guard HTTP chặn writes/private routes, không coi quyền DB là toàn bộ chính sách ứng dụng.

Root/SSM trên cùng host có thể đọc cả hai env; đây là ranh giới tin cậy của baseline một EC2, không phải cách ly host ở mức security domain. IMDSv2 bắt buộc và hop limit 1 giảm khả năng container bridge đọc instance credentials; cần kiểm thực tế trên EC2. Không gắn thêm host networking hoặc tăng hop limit tùy ý.

Các tham số env nên giữ dưới giới hạn 4 KiB của Standard SecureString; nếu vượt phải chủ động chọn Advanced và review phí. Không log `docker compose config`, `env`, connection string hoặc nội dung parameter. File runtime/migration trên host do helper tải atomic, owner root, mode 0600.

## 3. Chốt input trước khi provision

Chưa có giá trị thật cho: account/MFA và quyền operator, region, domain/DNS, GitHub `owner/repo`, OIDC provider ARN, GitHub Environments và protected branches/reviewers, AMI AL2023 x86_64, minor PostgreSQL 17 khả dụng, hai AZ, địa chỉ nhận cảnh báo và ngân sách tháng được duyệt.

AMI là ID cụ thể, không tự resolve `latest` lúc deploy. Có thể tra public SSM AMI parameter rồi review kiến trúc/OS/image ID ở đúng region; điền ID vào file tham số. Chọn DB minor bằng API `describe-db-engine-versions` và class bằng `describe-orderable-db-instance-options` ở region đó. Template không giả định mọi minor/class đều khả dụng.

EC2/IPv4/EBS/RDS, backup vượt allowance, Secrets Manager, KMS, ECR, S3 requests/storage, logs, metrics và alarms đều có thể phát sinh phí khi provision. `MonthlyBudgetUsd` không có default; cảnh báo actual 50/80/100% và forecast 100% có độ trễ. Hai stack sẽ tạo hai budget account-wide trùng phạm vi; dùng một stack staging trước nếu ngân sách chỉ đủ một môi trường. Tags Project/Environment/Owner nên truyền ở cấp stack và activate cost allocation tags trước khi cần báo cáo chi phí theo môi trường. [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html).

## 4. Bước foundation: đóng gói và upload bootstrap trước stack

Phần này chỉ chạy **sau khi có yêu cầu provision**. Dùng Linux/WSL với AWS CLI đã xác thực bằng SSO/role ngắn hạn, không copy access key vào repo. Foundation bucket tồn tại trước stack để tránh vòng phụ thuộc: EC2 phải tải được bootstrap trước khi stack hoàn tất, còn release bucket được stack tạo sau đó.

Bundle gzip tar gồm đúng ba file regular, top-level, LF:

```text
bootstrap.sh       <- infra/aws/bootstrap.sh
apply-release.sh   <- infra/deploy/apply-release.sh
fetch-env.sh       <- infra/deploy/fetch-env.sh
```

Tạo artifact ngoài repo, không có `.env`, certificate key hoặc credential:

```bash
task_stage=$(mktemp -d)
install -m 0750 infra/aws/bootstrap.sh "$task_stage/bootstrap.sh"
install -m 0750 infra/deploy/apply-release.sh "$task_stage/apply-release.sh"
install -m 0750 infra/deploy/fetch-env.sh "$task_stage/fetch-env.sh"
tar -C "$task_stage" -czf "$task_stage/bootstrap.tar.gz" bootstrap.sh apply-release.sh fetch-env.sh
sha256sum "$task_stage/bootstrap.tar.gz"
```

Operator đặt `AWS_REGION`, tên foundation bucket unique và key `foundation/<commit>/bootstrap.tar.gz`; chúng là identifier, không phải secret. Tạo **một** foundation bucket riêng dùng chung bootstrap source được, nhưng quyền host chỉ đọc đúng object/version được pin. Với region khác `us-east-1`, `create-bucket` cần LocationConstraint:

```bash
if [ "$AWS_REGION" = us-east-1 ]; then
  aws s3api create-bucket --bucket "$FOUNDATION_BUCKET" --region "$AWS_REGION"
else
  aws s3api create-bucket --bucket "$FOUNDATION_BUCKET" --region "$AWS_REGION" \
    --create-bucket-configuration "LocationConstraint=$AWS_REGION"
fi
aws s3api put-public-access-block --bucket "$FOUNDATION_BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-ownership-controls --bucket "$FOUNDATION_BUCKET" \
  --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'
aws s3api put-bucket-versioning --bucket "$FOUNDATION_BUCKET" --versioning-configuration Status=Enabled
# Dừng ở đây khi vừa bật versioning lần đầu: xem lưu ý propagation bên dưới.
aws s3api put-bucket-encryption --bucket "$FOUNDATION_BUCKET" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
jq -n --arg bucket "$FOUNDATION_BUCKET" \
  '{Version:"2012-10-17",Statement:[{Effect:"Deny",Principal:"*",Action:"s3:*",Resource:[("arn:aws:s3:::"+$bucket),("arn:aws:s3:::"+$bucket+"/*")],Condition:{Bool:{"aws:SecureTransport":"false"}}}]}' \
  > "$task_stage/foundation-policy.json"
aws s3api put-bucket-policy --bucket "$FOUNDATION_BUCKET" --policy "file://$task_stage/foundation-policy.json"
aws s3api put-object --bucket "$FOUNDATION_BUCKET" --key "$BOOTSTRAP_KEY" \
  --body "$task_stage/bootstrap.tar.gz" --server-side-encryption AES256 --query VersionId --output text
```

Khi bật versioning lần đầu, AWS khuyến nghị chờ **15 phút trước PUT/DELETE** để cấu hình propagate; tách bước chuẩn bị bucket và bước upload thay vì chạy nguyên khối ngay. Xác nhận kết quả upload có VersionId thật, không `null`. VersionId là chuỗi opaque và có thể chứa `+`/`/`; truyền nguyên giá trị bằng quoted argument, không dùng nó làm tên thư mục. [S3 versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/versioning-workflows.html).

Ghi **VersionId và SHA256** vào bản copy tham số ngoài repo. Foundation bucket dùng SSE-S3; nếu thay bằng SSE-KMS, phải bổ sung quyền decrypt/key policy cho instance theo object này, không gỡ kiểm tra checksum. Không dùng `null` version ID hoặc URL `main/latest`. Giữ version đã pin để host replacement có thể bootstrap lại.

UserData tải đúng object/version qua instance role, xác minh SHA256, chỉ extract ba tên fixed bằng `tar -xOf`, chạy `bash -n`, rồi gọi bootstrap. Không extract toàn tar trực tiếp vào `/`. Thiếu object/hash/helper khiến bootstrap fail; CFN signal chỉ SUCCESS khi bootstrap hoàn tất. EC2 có `CreationPolicy` 20 phút, nhưng **stack CREATE_COMPLETE chỉ xác nhận host**, không xác nhận app đã triển khai.

## 5. Bước stack: review change set rồi mới thực thi

Copy `parameters.example.json` tới thư mục cấu hình ngoài repo, thay mọi `REPLACE_*`/domain ví dụ và review các default tài nguyên. Tạo GitHub OIDC provider trước nếu account chưa có; nếu đã có thì dùng ARN đó. Template không tự tạo provider trùng.

Kiểm local không gọi AWS:

```bash
cfn-lint infra/aws/cloudformation.yaml
bash -n infra/aws/bootstrap.sh
shellcheck infra/aws/bootstrap.sh
```

Sau khi được yêu cầu triển khai, operator có thể gọi `aws cloudformation validate-template` rồi tạo change set. Những lệnh này được ghi để thực hiện sau, chưa chạy trong lượt chuẩn bị repository:

```bash
aws cloudformation validate-template --template-body file://infra/aws/cloudformation.yaml
aws cloudformation create-change-set --stack-name rigforce-staging \
  --change-set-name foundation-review-001 --change-set-type CREATE \
  --template-body file://infra/aws/cloudformation.yaml --parameters file:///private/rigforce-staging-parameters.json \
  --capabilities CAPABILITY_IAM --region "$AWS_REGION" \
  --tags Key=Project,Value=rigforce Key=Environment,Value=staging Key=Owner,Value=REPLACE_OWNER
aws cloudformation describe-change-set --stack-name rigforce-staging --change-set-name foundation-review-001
# Chỉ execute change set sau khi xem resources/replacement/chi phí và được cho phép.
```

Truyền stack tags để lan tới các loại resource hỗ trợ; một số resource đã có tags explicit trong template. Không đổi CIDR/AZ/DBName/AMI tùy ý trên stack có dữ liệu; xem `Replacement` và backup trước. Resource DB có deletion protection cùng Snapshot deletion/update policy; thay đổi destructive cần operator review, không gỡ bảo vệ tự động để stack xanh.

## 6. Việc operator làm sau khi host có thật

1. Xem Outputs: EIP, InstanceId, DB endpoint, repo URIs, release bucket/prefix, parameter names/KMS key, OIDC role ARNs và SSM document name. Xác nhận instance Online trong SSM, bootstrap complete và log/metric vào CloudWatch.
2. Thiết lập GitHub Environments/variables theo Outputs, protected branches/reviewers phù hợp gói GitHub. Role release chỉ tin `repo:<owner/repo>:environment:<release-environment>` và audience sts.amazonaws.com; role deploy có trust riêng theo deploy environment. Ví dụ cả hai là `staging` để khớp workflow; có thể tách `release-staging` khi đổi workflow tương ứng. Nếu dùng cùng environment thì job được duyệt ở đó có thể assume cả hai role: tách policy không tự tạo thêm approval boundary. Environment-based `sub` không tự ràng buộc branch; phải đặt environment deployment branch policy. [GitHub OIDC AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).
3. Chạy **Release build/push trước, chưa Deploy** khi được yêu cầu. Artifact S3 `releases/<environment>/<full-40-char-commit>/release.tar.gz` có `manifest.json`, compose deployment và Nginx/deploy scripts, không env/secret. S3 VersionId và SHA256 đi cùng release. API/runtime và tools là hai digest riêng trong repo API; FE là repo frontend. Bước build/push không cần runtime env trên EC2. Tools image của release đầu tiên cần tồn tại trước khi operator dùng nó để setup DB roles; login/pull ECR bằng instance role theo hướng dẫn deployment, không lấy tools từ tag floating.
4. Dùng quyền operator đọc master secret và tools image đã phát hành để tạo DB roles riêng/quyền mặc định. Kiểm truy cập TLS `verify-full`; HTTP/plain DB hoặc CA sai phải thất bại. Endpoint DB giữ nguyên hostname RDS, không thay bằng IP. Chỉ thao tác operator này được dùng master secret, không gắn master vào app/migration env.
5. Chuẩn bị hai file env private mode 0600, theo contract production của deployment guide: NODE_ENV=production, HTTPS origin, PREVIEW_READ_ONLY=true, secret JWT riêng; Stripe giữ tắt và email provider còn là giới hạn phát hành. `DATABASE_URL` của adapter-pg/preflight dùng role đúng mục đích, `sslmode=verify-full&sslrootcert=/run/certs/rds-global-bundle.pem`. Migration env có thêm `PRISMA_MIGRATION_DATABASE_URL` cùng host/credential nhưng dùng dialect Prisma `sslmode=require&sslaccept=strict&sslcert=/run/certs/rds-global-bundle.pem`; đối chiếu hướng dẫn/kiểm TLS của bộ deployment trước khi điền, không suy rằng dialect hai client giống nhau. Không dùng master credential hoặc `rejectUnauthorized=false`.
6. Upload SecureString bằng file, không in nội dung; điền tên/key từ Outputs. Ví dụ Linux bên dưới **không chạy bởi bootstrap**:

```bash
chmod 0600 /private/runtime.env /private/migration.env
aws ssm put-parameter --name "$RUNTIME_PARAMETER_NAME" --type SecureString \
  --key-id "$RUNTIME_KMS_KEY_ARN" --value file:///private/runtime.env --overwrite --query Version --output text
aws ssm put-parameter --name "$MIGRATION_PARAMETER_NAME" --type SecureString \
  --key-id "$RUNTIME_KMS_KEY_ARN" --value file:///private/migration.env --overwrite --query Version --output text
```

7. Operator dùng Session Manager chạy `apply-release.sh --prepare <key> <version> <sha>` để stage bundle/env, chưa launch. Trỏ DNS tới Elastic IP, kiểm quyền sở hữu domain rồi chạy quy trình certificate của release để khởi tạo ACME-only Nginx/HTTPS. Chưa có cert thì không giả phát hành full app trên HTTP và không đổi NODE_ENV để né validation. Bootstrap không tự cấp cert.
8. Nếu cần catalog minh họa cho DB preview mới, operator chạy seed rõ ràng theo [hướng dẫn hạ tầng](../../docs/INFRASTRUCTURE_GUIDE.md), dùng image tools/frontend đã publish. Không tự seed ở UserData hoặc CD; không chạy seed vào DB hiện hữu chỉ để làm smoke xanh.
9. Deploy qua SSM document nhận đúng `ReleaseKey`, `ReleaseVersion`, `ReleaseSha256`; lần đầu chọn migration policy backward-compatible, không none. Document dùng `interpolationType: ENV_VAR`, pattern giới hạn input và gọi `/opt/rigforce/bin/apply-release.sh` với ba quoted arguments; không cho tham số shell command. Cần SSM Agent mới hỗ trợ ENV_VAR; AL2023 standard AMI phải kiểm version và nâng theo review nếu cũ. [SSM schemas/ENV_VAR](https://docs.aws.amazon.com/systems-manager/latest/userguide/documents-schemas-features.html).
10. Poll Run Command tới trạng thái cuối; kiểm readiness/HTTPS, cookie/Origin, frontend server fetch, ảnh và preview read-only. Không coi SendCommand được nhận hoặc app health endpoint tồn tại là deploy thành công. Thử rollback/reboot/restore/cảnh báo trước nghiệm thu AWS.

## 7. Contract trên host

```text
/opt/rigforce/bin/bootstrap.sh
/opt/rigforce/bin/apply-release.sh
/opt/rigforce/bin/fetch-env.sh
/opt/rigforce/releases/<commit>/...
/opt/rigforce/shared/host.env                    # nonsecret, root:root 0600
/opt/rigforce/shared/runtime.env                 # secret, helper tải từ SSM, 0600
/opt/rigforce/shared/migration.env               # secret, helper tải từ SSM, 0600
/opt/rigforce/shared/certs/rds-global-bundle.pem  # public CA, mounted /run/certs/...
/opt/rigforce/shared/letsencrypt/                # private key/cert persistent trên host
/opt/rigforce/shared/acme/                       # HTTP-01 challenge webroot
/var/log/rigforce/deploy.log                     # chỉ log đã che secret
```

`host.env` chỉ có AWS_REGION, PROJECT_NAME, ENVIRONMENT, DOMAIN_NAME, RELEASE_BUCKET, RUNTIME_PARAMETER_NAME, MIGRATION_PARAMETER_NAME, LOG_GROUP_PREFIX. Helper source file này bằng Bash; không đưa vào browser hoặc API env nguyên file. Compose env của từng release chứa digest/domain/path không secret và do helper tạo riêng. Runtime/migration env dùng Compose `format: raw`; Compose pin v5.8.0 hỗ trợ contract >=2.30 này.

Host bootstrap cài Docker từ repository snapshot của **AMI AL2023 được pin**, AWS CLI v2, SSM/CloudWatch agent, Python3 stdlib, jq, tar và flock; không cài pip, không build image trên host. Docker engine package không có pin NEVRA riêng: phải ghi `rpm -q docker` thực tế và review khi đổi AMI/snapshot. Compose v5.8.0 x86_64 và hash lấy từ release/checksums chính thức; manual plugin không auto-update. [Docker Compose Linux](https://docs.docker.com/compose/install/linux/), [release v5.8.0](https://github.com/docker/compose/releases/tag/v5.8.0).

CA bundle lấy từ AWS global truststore qua HTTPS, pin SHA256 đọc ngày 18/11/2026. AWS có thể rotate bundle: nếu hash đổi thì bootstrap phải fail để review nguồn/hash, không tự bỏ checksum. `rds.force_ssl=1` không thay thế xác minh CA/hostname phía client. [RDS PostgreSQL TLS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.SSL.html).

CloudWatch agent thu host logs tại đường dẫn cố định; Compose override awslogs gửi stdout/stderr container tới Output `ContainerLogGroupName`. Không gửi auth body/cookie/token hoặc shell `set -x`. RAM/disk metrics agent có chi phí và alarm thresholds chỉ là điểm khởi đầu cần đo lại. Còn thiếu probe ngoài host/HTTP 5xx/latency/TLS expiry alerts hoàn chỉnh trước vận hành công khai dài hạn.

## 8. Update, rollback và dữ liệu cần giữ

App rollback chỉ đổi release/config/image tương thích; **không rollback schema**. Migration đã áp hoặc SQL nguồn có checksum không được sửa để khớp image cũ. History mới dành riêng DB mới, không dùng cho DB legacy hiện hữu.

Cloud-init UserData chạy lần đầu; sửa parameter bootstrap/AMI/Compose không bảo đảm rerun script trên instance cũ. Muốn đổi host tooling phải có lượt operator update đã review hoặc thay host; pin bundle/version/hash mới và cập nhật quyền read version tương ứng. Không cho role deploy thường ngày update IAM/UserData/bootstrap hoặc chạy shell tùy ý.

EBS root mã hóa nhưng `DeleteOnTermination=true`; named volume media/cert trên root **không sống qua thay EC2**. Cần backup/snapshot/restore media và cert, hoặc chuyển sang volume/storage có lifecycle riêng trước replacement. RDS backup không chứa media. Reboot cùng host có restart Docker/SSM/CloudWatch và container restart policy; phải thử trên AWS thật.

DB deletion protection chặn xóa/replacement cho tới khi operator cố ý tắt sau backup/review. RDS Snapshot policy giữ snapshot khi được xóa đúng quy trình; bucket/ECR/KMS/log groups có Retain và vẫn có thể tính phí sau xóa stack. Foundation bucket ở ngoài stack cũng không tự xóa. Lập danh sách snapshot/version/image/log/key/EIP trước cleanup, không dùng delete/prune toàn account.

## 9. Bằng chứng và phần chưa kiểm

Template và bootstrap được kiểm local theo kết quả bàn giao/PROJECT_STATUS, không gọi AWS. `cfn-lint`/Bash/ShellCheck chỉ xác minh cấu trúc và một số lỗi mã; không chứng minh IAM thực tế, engine version/class/AMI tồn tại, boot package repo, OIDC subject, SSM Agent, DNS/ACME, TLS DB, database roles, deploy/rollback/reboot/restore hay hóa đơn.

Vì chưa có account/domain/ngân sách, chưa chạy `validate-template` trên AWS, chưa tạo change set/bucket/provider/instance/DB, chưa push ECR hoặc deploy app. Phần tiếp theo có thể tiếp tục hoàn thiện và kiểm local/CI; chỉ provision sau khi người dùng yêu cầu rõ và input đã chốt.
