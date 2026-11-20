# Bối cảnh và định hướng sản phẩm

**Kết quả mới nhất20/11/2026:** app7921ba6 đã mở demo tương tác trên AWS và smoke HTTPS thật qua. Chỉ tài khoản thử CUSTOMER, giỏ và lưu/xóa PC; không đơn/payment/signup/reset/SMTP/admin. Hai flag cùngtrue, không tắt PREVIEW_READ_ONLY. Xem FEATURE_UNLOCK_PLAN và audit `verification/2026-11-20-interactive-demo-live.json`; các trạng thái chờ/khảo sát bên dưới là lịch sử. Không công khai credential local hoặc chạy lại seed/stack cũ.

**Cập nhật20/11/2026:** người dùng đã tự deploy, HTTPS website truy cập được (HTTP200 đã kiểm); hiện các trang vẫn có chốt preview. Yêu cầu tiếp theo là hướng dẫn/cùng mở các thành phần bị khóa, chưa xác định nhóm và chưa yêu cầu nhận đơn thật. Xem `FEATURE_UNLOCK_PLAN.md` và trạng thái mới nhất. Không chạy lại automation seed đang ghi lỗi19/11; bản người dùng đã deploy có thể khác marker local. Không chỉ tắt flag preview vì hiện chưa tách auth/cart/build khỏi COD; cần chốt phạm vi trước thay quyền DB/runtime.

## Cập nhật quyền triển khai — 19/11/2026

Tiếp nối: DNS đã trỏ đúng EC2; GitHub commit `3896a813` có CI thật thành công (run44479335531), ECR vẫn trống và SNS email chưa xác nhận. Chuẩn bị [Release đầu](FIRST_AWS_RELEASE.md); cần chọn mã đã CI xanh trên GitHub hoặc rà soát bản local trước commit/push. Tám variable đã đối chiếu tên, bảng giá trị nằm trong `infra/.local/github-staging-setup.md`; chưa xác nhận lưu trên GitHub hoặc dispatch workflow. Plugin hiện không hỗ trợ hai thao tác cấu hình/dispatch này. Không suy CI của commit GitHub thành CI cho working tree local.

**Kết quả thực tế mới nhất:** foundation42 tài nguyên đã create và reconcile bản sửa bootstrap tới `UPDATE_COMPLETE`; cùng EC2/EIP sau stop/start, SSM Online, Docker/Compose/CloudWatch hoạt động, RDS private mã hóa available với backup1 ngày. Cloud-init đầu lỗi package, đã phục hồi bằng operator SSM; không che lịch sử này. Free plan vẫn FREE/ACTIVE; SNS email còn chờ xác nhận. Chưa có app release, schema/roles/secrets ứng dụng, DNS cutover hay HTTPS public. Xem [audit](verification/2026-11-19-aws-staging-foundation.json) và trạng thái mới nhất; không chạy CREATE lại hoặc cleanup tài nguyên của stack đang vận hành chỉ vì đọc mốc rollback cũ.

Người dùng đã duyệt Execute foundation staging sau review 42 tài nguyên và chi phí. Giữ AWS Free plan, Sydney, hostname `rigforce.duckdns.org`, public showcase chỉ đọc; chưa cấp quyền tự commit/push mã ứng dụng hoặc chuyển Paid. Hai lần create rollback do SSM regex không tương thích và RDS Free plan từ chối backup 7 ngày. Đã sửa SSM pattern, bổ sung retention parameter và thử candidate **backup 1 ngày**, giữ nguyên footprint còn lại. Trạng thái thực tế, cleanup và giới hạn nghiệm thu xem [PROJECT_STATUS](PROJECT_STATUS.md); các ghi chú chuẩn bị/chưa có tài khoản bên dưới là lịch sử.

## Mục tiêu

**17/11/2026 — định hướng mới do chủ dự án xác nhận:** chuyển tới sản phẩm kinh doanh production với tên **RIGFORCE STORE**, ngành đồ công nghệ/gear cho người dùng laptop/PC. Phương thức thanh toán, giao vận, chính sách, pháp nhân/liên hệ, domain, ngân sách AWS và phạm vi địa lý chưa chốt. Đây là mục tiêu mới, không phải trạng thái đã production. [Rà soát và tiêu chí mở bán](PRODUCTION_READINESS.md).

Xây dựng hệ thống bán hàng gồm storefront, API nghiệp vụ, dữ liệu và công cụ quản trị. Chủ dự án cần hiểu cách thiết kế và vận hành từng phần để có thể tự phát triển, giải thích quyết định kỹ thuật và trình bày sản phẩm trong phỏng vấn.

Thành công được đánh giá bằng luồng mua hàng hoạt động đúng, bảo vệ tài khoản và tiền, có bằng chứng kiểm thử, cài đặt được trên máy mới và có tài liệu đủ để bàn giao. Số lượng thư viện không phải thước đo chất lượng.

## Người dùng mục tiêu

| Vai trò | Nhu cầu |
| --- | --- |
| Khách chưa đăng nhập | Xem danh mục, tìm và xem sản phẩm; đăng ký/đăng nhập |
| Khách hàng USER | Quản lý hồ sơ, giỏ hàng, đặt hàng, thanh toán, xem đơn của mình |
| Quản trị viên ADMIN | Quản lý danh mục, sản phẩm, tồn kho, người dùng và đơn hàng |
| Người phát triển/vận hành | Chạy môi trường, kiểm thử, triển khai, theo dõi và phục hồi dữ liệu |

Từ **06/11/2026**, runtime Auth/Accounts/Access dùng Role/Permission/UserRole v2; CUSTOMER/ADMIN và bốn permission giai đoạn đầu đã seed, không tự nâng quyền tài khoản. Enum USER/ADMIN v1 chỉ còn trong mã legacy. [Contract danh tính](API_IDENTITY_V2.md) mô tả roleCodes/permissions, session và ownership. Khách chưa đăng nhập là tác nhân công khai, không phải role lưu trong DB.

## Phạm vi hướng tới

**Mốc phát hành được người dùng chọn ngày 17/11/2026:** website công khai để giới thiệu và trải nghiệm, **chưa nhận đơn thật**. [RELEASE_PLAN.md](RELEASE_PLAN.md) xác định từng đợt từ bản hiện tại: ổn định/bản vá → phạm vi public/demo → nội dung/SEO → nghiệm thu production → Docker/Nginx/CI → staging/AWS. Giữ nhãn dữ liệu minh họa; payment/COD nếu mở chỉ là trải nghiệm có giới hạn, không tự chuyển sang kinh doanh. Các mục MVP dài hạn bên dưới không phải yêu cầu hoàn thiện hết trước mốc giới thiệu.

- MVP: auth và phân quyền; danh mục/sản phẩm; giỏ hàng; đơn hàng; thanh toán Stripe ở test mode với webhook tin cậy; storefront kết nối API; quản trị cơ bản.
- Nền tảng chất lượng: validation, ownership, xử lý lỗi, tài liệu API, test nghiệp vụ quan trọng, CI và hướng dẫn local.
- Hạ tầng sau FE–BE, theo yêu cầu ngày **06/11/2026**: Docker, CI/CD, Nginx và AWS Deployment. [Kế hoạch chi tiết](DEPLOYMENT_PLAN.md) đề xuất GitHub Actions/ECR/EC2 Compose/RDS, tách local–test–staging–demo, có HTTPS, migration/rollback và backup/restore. Đây là phạm vi đã được yêu cầu, chưa phải hạ tầng đã triển khai.
- Sau MVP: địa chỉ có cấu trúc, phí vận chuyển, mã giảm giá, hoàn tiền đầy đủ, upload ảnh, monitoring, backup/restore và tối ưu theo dữ liệu thực tế.
- Chưa đưa vào phạm vi mặc định: marketplace nhiều người bán, microservices, loyalty, recommendation AI, Redis/queue khi chưa có nhu cầu cụ thể.

Đây là phạm vi đề xuất để tổ chức dự án từ bản bàn giao. Trạng thái thực thi được ghi riêng trong [PROJECT_STATUS.md](PROJECT_STATUS.md); không coi danh sách này là chức năng đã có hoặc yêu cầu triển khai ngay.

## Các quyết định còn mở

1. Thương hiệu, ngành hàng và bộ dữ liệu demo cuối cùng; Rigforge hiện là dấu hiệu giao diện.
2. Currency đã chốt **VND, minor_unit=0** theo yêu cầu ngày 05/11/2026; giá giữ trị số hiện có, không quy đổi FX. Database và API v2 hiện dùng VND nguyên, trả JSON dạng chuỗi; từ 08/11 có [Stripe Checkout sandbox v2](STRIPE_V2.md), không nhân 100. Dữ liệu v1 trong schema lưu trữ giữ nguyên currency gốc.
3. Chính sách giao hàng, hủy đơn, giữ/trừ/hoàn tồn kho và hoàn tiền.
4. Nơi lưu token trên frontend, thời hạn phiên và chính sách nhiều thiết bị.
5. AWS là nền tảng triển khai đã được yêu cầu. Baseline đề xuất EC2 + Compose/Nginx, ECR, RDS private, SSM/OIDC và CloudWatch; ngân sách, domain/region, kích cỡ tài nguyên, lưu ảnh và provider email còn cần chốt khi cài đặt. Không tự thêm ECS/Kubernetes hoặc dịch vụ mới chỉ để tăng stack.

Chỉ cần chốt từng quyết định khi công việc liên quan đến nó. Tài liệu bàn giao có nhắc ý tưởng kinh doanh ngách nhưng không lưu tên sản phẩm; chưa có cơ sở gộp ý tưởng đó vào sản phẩm này.

## Phạm vi hạ tầng hiện tại — 18/11/2026

Chủ dự án chưa có AWS account/domain và yêu cầu hoàn thiện local/CI/bộ triển khai trước. Đã bổ sung Docker lab, production Compose/HTTPS preview chỉ đọc, CI/Release/Deploy workflow definitions, CloudFormation và operational helpers. Xem [hướng dẫn thành phần/trách nhiệm](INFRASTRUCTURE_GUIDE.md) và [hiện trạng có bằng chứng](PROJECT_STATUS.md). Cloud chưa provision/deploy, pipeline chưa chạy trên GitHub; không mô tả bộ file này là hạ tầng đã vận hành. Bản công khai đầu chỉ đọc catalog/trải nghiệm, không tài khoản/đơn/thanh toán thật.

## Ràng buộc AWS miễn phí — 19/11/2026

Người dùng đã chuẩn bị tài khoản AWS và yêu cầu hiện tại chỉ dùng bản free. Chưa xác minh loại Free/Paid plan, credit/hạn sử dụng, region hoặc domain; không tự tạo tài nguyên hay nâng cấp plan. Template EC2 t3.medium + RDS và các dịch vụ phụ trợ hiện có không phải cam kết miễn phí. Trước provision phải đối chiếu quyền lợi thực tế của account với [AWS Free Tier](https://aws.amazon.com/free/) và [account plans](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html); credit thử nghiệm có giới hạn thời gian/số dư, không đồng nghĩa hosting miễn phí vĩnh viễn. Trạng thái CI thật xem PROJECT_STATUS, thay cho ghi chú lịch sử chưa chạy GitHub phía trên.

- Xác nhận tiếp nối 19/11/2026 do người dùng cung cấp: **Free plan, 100 USD**, ngày hiển thị **11/18/2027** (18/11/2027). Chưa truy cập account để xác minh; cần phân biệt expiry credit với thời hạn Free plan vì tài liệu AWS hiện ghi Free plan tối đa sáu tháng hoặc hết credit. Không mặc định ngày người dùng báo bảo đảm chạy miễn phí đến 2027. Region/domain chưa chốt; chưa cấp quyền tạo tài nguyên hay chuyển Paid plan.
- Xác nhận tiếp theo 19/11/2026: region **ap-southeast-2 (Sydney)**; người dùng **đã bật MFA**. Giữ Free plan và giới hạn 100 USD credit; domain và dự toán tài nguyên chưa chốt. Chưa provision/deploy.
- OIDC user cung cấp từ workflow `staging` ngày 19/11/2026: audience `sts.amazonaws.com`, subject `repo:thanhhuydev712@289154137/E-Commerce@1427130391:environment:staging`. Owner/repository ID là metadata công khai, không phải secret. Dùng exact immutable subject cho role trust; không bỏ ID hay thay bằng wildcard. Claims đúng chưa chứng minh AWS AssumeRole thành công.
- Người dùng đã cung cấp ARN provider cùng ngày; lưu cùng tham số repo/OIDC tại `infra/.local/staging.parameters.json` được Git ignore, không đưa account-specific ARN vào mẫu công khai. File local còn placeholder đầu vào foundation/domain/AMI/ngân sách, chưa dùng để execute stack. Region CLI là `ap-southeast-2`.
- Đã kiểm ngày 19/11/2026: AWS CLI **2.41.1** cài tại `C:/Program Files/Amazon/AWSCLIV2/aws.exe`; session công cụ hiện chưa nhận PATH mới. Dùng đường dẫn đầy đủ nếu cần. Hướng dẫn `aws login --profile rigforce-staging` bằng console credentials tạm thời; chưa tự thực hiện đăng nhập/MFA hoặc gọi AWS trong lượt kiểm cài đặt. Không cần access key lâu dài hay bật Organizations để xác thực CLI.
- Tiếp nối 19/11/2026: người dùng đăng nhập profile `rigforce-staging`, STS cho biết principal root. Đã đối chiếu trực tiếp STS, IAM GetOpenIDConnectProvider (URL GitHub/audience sts.amazonaws.com đúng), EC2 DescribeAvailabilityZones (Sydney a/b/c available) và RDS DescribeDBEngineVersions (có PostgreSQL 17). Chỉ gọi API đọc metadata, chưa tạo/sửa tài nguyên hoặc deployment. Không gán principal root là operator triển khai đã nghiệm thu.
- Người dùng chọn **hostname/subdomain miễn phí**, chưa có tên hostname cụ thể. Không yêu cầu mua domain; cần kiểm DNS/ACME của hostname đã chọn trước public HTTPS.
- Đã chọn **rigforce.duckdns.org** và cung cấp email cảnh báo; hostname/email đã điền trong `infra/.local/staging.parameters.json` được Git ignore. DNS hiện chưa được xác nhận trỏ server AWS. Đã chuẩn bị candidate staging t3.small + EBS20 GiB + RDS micro20 GiB, cảnh báo20 USD/tháng (không phải cap), CPU standard và budget loại credit khỏi tính mức tiêu thụ. Cấu hình là đề xuất chưa được provision; chi phí cơ bản Sydney khoảng46 USD/tháng trước phụ phí/ưu đãi, không cam kết hosting miễn phí lâu dài.
- Đã đọc metadata AWS thật và pin AMI AL2023 x86_64 `ami-052190d76c25f66d1`, AZ Sydney a/b, RDS PostgreSQL17.11 micro/gp3 khả dụng. `cfn-lint` và AWS ValidateTemplate qua (35parameters). Bootstrap ba file đã đóng gói/checksum ở `infra/.local/bootstrap/bootstrap.tar.gz`; còn thiếu S3 VersionId vì chưa tạo bucket/upload. Chưa tạo tài nguyên/chạy change set; email/ARN account-specific không đưa vào file mẫu công khai.
- Người dùng đã cho phép **tạo một bucket S3 foundation private và upload bootstrap**, chưa cấp quyền tạo EC2/RDS/execute stack hoặc nâng Paid plan. Đã tạo bucket tại Sydney, bật Block Public Access đủ bốn mục, BucketOwnerEnforced, AES256, versioning và policy deny HTTP. Trạng thái/audit riêng ở `infra/.local/foundation-state.json`; tiến trình upload chờ đủ15 phút sau lần đầu bật versioning theo khuyến nghị AWS. Xem PROJECT_STATUS cho kết quả cuối, không coi quyền S3 này là quyền triển khai cả stack.
- Đã gọi AWS Free Tier GetAccountPlanState ngày 19/11/2026: **FREE / ACTIVE**, remaining credits **100 USD** tại thời điểm đọc, accountPlanExpirationDate **2027-05-18T12:07:34.273Z**. Đây là ngày hết hạn Free plan do API trả về, thay cho suy đoán từ ngày credit người dùng cung cấp; không kết luận khoản credit có cùng ngày. Không gọi API đổi plan. Billing có thể cập nhật chậm, số dư đọc lúc này không chứng minh tài nguyên S3 không có mức sử dụng.
- **S3 foundation đã hoàn tất**: object bootstrap11.396 byte được upload sau908 giây chờ versioning, VersionId thật và SHA256 đã lưu trong params local. Head/checksum S3 + download theo VersionId khớp hash; anonymous HEAD403; API account sau upload vẫn FREE/ACTIVE. Xem `docs/verification/2026-11-19-s3-foundation.json`. Chỉ có S3 được tạo trong phạm vi duyệt; quyền tạo EC2/RDS/execute stack chưa được mở rộng. Các dòng chuẩn bị/chờ upload phía trên là mốc lịch sử.
- **Đã tạo/review change set CREATE** cho `rigforce-staging` theo yêu cầu tiếp tục: CREATE_COMPLETE/AVAILABLE, stack REVIEW_IN_PROGRESS,42 Add và0 resource của stack được dựng. Snapshot/hash/template/parameters đối chiếu AWS đều khớp. Audit public `docs/verification/2026-11-19-cloudformation-review.json`; account identifiers/email và snapshot frozen nằm dưới `infra/.local/`. Chưa Execute, chưa tạo EC2/RDS hay đổi DNS; cần chốt quyền execute riêng sau khi người dùng xem chi phí/quyền IAM/retention. Nếu source/params thay đổi sau snapshot phải tạo/review change set mới, không execute snapshot cũ theo phỏng đoán.
