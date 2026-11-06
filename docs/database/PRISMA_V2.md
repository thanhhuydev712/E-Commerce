# Prisma v2: database đã chuyển đổi, API cần cập nhật

**Cập nhật 06/11/2026:** Platform/Auth/Accounts/Access đã chuyển sang một Prisma Client v2 và kiểm tra với PostgreSQL; các module thương mại v1 đã tách khỏi runtime vào `api/legacy/`. Phần mô tả API còn v1 bên dưới là bối cảnh tại mốc migration 05/11; contract hiện hành ở [API_IDENTITY_V2.md](../API_IDENTITY_V2.md). Không generate client legacy để chạy API mới.

Ngày **05/11/2026**. Database `public` đã áp dụng migration v2 gồm **102 bảng**. Đã chuyển tài khoản, quyền, danh mục, sản phẩm, giá, tồn kho và giỏ hàng; currency hiện hành là **VND, minor_unit=0**, giữ trị số giá cũ, không quy đổi ngoại tệ. Backend vẫn dùng các service/client v1, cần cập nhật trước khi chạy nghiệp vụ với database v2. Có bảng không đồng nghĩa tính năng tương ứng đã triển khai.

## Các file và vai trò

| File | Vai trò |
| --- | --- |
| [`schema.prisma`](../../api/prisma/schema.prisma) | Schema đích v2: UUID native, money BigInt, JSONB, timestamptz, relations/unique/index và tên SQL qua map |
| [`schema.v1.prisma.bak`](../../api/prisma/archive/schema.v1.prisma.bak) | Bản nguyên trạng schema v1 trước thay đổi; dùng đối chiếu migration và generate client cho các service cũ |
| [`constraints.sql`](../../api/prisma/v2/constraints.sql) | Nguồn SQL bổ sung; bản đã áp dụng nằm trong migration upgrade, không chạy lại file này trên database đã migrate |
| [`upgrade v2`](../../api/prisma/migrations/20261105010000_upgrade_v2_vnd/migration.sql) | Migration thứ ba đã áp dụng: lưu v1, tạo 102 bảng, thêm CHECK/index, backfill VND và kiểm tra dữ liệu |
| [`baseline SQL`](../../api/prisma/v2/migrations/20261105000000_commerce_v2_baseline/migration.sql) | Artifact đầu vào để soạn upgrade; không áp dụng baseline này thêm lần nữa và không đăng ký nó vào history public |
| `api/generated/prisma-v2/` | Client v2 được generate, bỏ qua trong Git; không sửa tay |

Prisma config vẫn trỏ tới `prisma/schema.prisma`. Chạy `prisma generate` mặc định sinh client v2 ở thư mục riêng; **không thay client v1 tại `@prisma/client`**. Service hiện tại tiếp tục dùng client v1, Cart còn dùng client tùy biến đã có ở `src/generated/prisma`; việc thống nhất import khi chuyển service vẫn là công việc tiếp theo.

Bản lưu v1 dùng đuôi `.prisma.bak` để editor không gom nhầm vào schema v2. Nếu để đuôi `.prisma` dưới `prisma/archive/`, enum `Role` cũ có thể xung đột với model `Role` mới và gây lỗi `@relation: Invalid field type, not a relation` tại `UserRole.role`/`RolePermission.role`. Prisma CLI vẫn đọc được file `.bak` khi chỉ định `--schema` như script generate:legacy. Không đổi tên model v2 hay thêm lại enum Role chỉ để xử lý lỗi này.

Tách output giữ việc chuyển kiểu có kiểm soát. **Sau migration, build bằng client v1 không chứng minh backend chạy được với public v2.** Phải cập nhật PrismaService và mọi import client liên quan cùng DTO/service/Swagger, serializer BigInt và các test. Không trộn client v1/v2 trong một transaction. Không tự trỏ API cũ sang `legacy_v1` rồi tiếp tục ghi vì sẽ làm dữ liệu archive và v2 lệch nhau.

## Lệnh kiểm tra từ `api/`

```powershell
npm.cmd run prisma:format
npm.cmd run prisma:validate
npm.cmd run prisma:generate

# Chỉ dùng khi kiểm tra mã nguồn v1, không để chạy nghiệp vụ với public v2:
npm.cmd run prisma:generate:legacy
npm.cmd run build
```

`npm.cmd` tránh lỗi PowerShell chặn `npm.ps1` trên máy hiện tại; không cần thay execution policy. Các script tương đương dùng `npm` trong shell hỗ trợ bình thường. Validate/generate không áp dụng schema vào DB. Config vẫn đọc biến môi trường theo cách đã có; không in giá trị bí mật để kiểm tra.

Có thể render DDL vào file tạm để review **không cần kết nối DB**:

```powershell
node node_modules/prisma/build/index.js migrate diff --from-empty --to-schema prisma/schema.prisma --script --output .tmp/v2-baseline.sql
```

Tạo `.tmp/` trước nếu chưa có. File trên là baseline cho database trống và **chưa có constraints.sql**, không dùng như migration nâng cấp database v1. Không chạy `db push` hoặc tự sinh/áp dụng `migrate dev` vào DB có dữ liệu chỉ vì schema đã validate. Trước migration cần preflight, quyết định currency, chuyển money, tồn kho đầu kỳ và mapping ở [MIGRATION.md](MIGRATION.md).

## Quyết định khi hiện thực hóa

- Giữ trạng thái là `String @db.VarChar(32)` + SQL CHECK đúng thiết kế, chưa đổi thành PostgreSQL enum. Client không có enum v2 tự sinh; service cần bộ hằng/validation có kiểu khi triển khai, không cho người dùng tự PATCH trạng thái. Chỉ validate Prisma sẽ không kiểm tra các CHECK SQL.
- Mỗi FK có relation hai chiều và `onDelete/onUpdate` rõ ràng. Giao dịch/hồ sơ lịch sử mặc định RESTRICT; cascade chỉ ở một số bảng nối/dữ liệu tạm. Không giữ cascade xóa order/payment từ user của v1.
- FK ghép `ProductMedia(variantId, productId)` và `VariantOptionValue(valueId, optionId)` bảo đảm sở hữu product và option ở DB. Quan hệ khác order/payment/currency, chu kỳ category, tổng nhiều dòng, số serial và chuyển trạng thái vẫn cần transaction/validation; xem [TRANSACTIONS.md](TRANSACTIONS.md).
- Giá dùng BigInt minor units, không có currency mặc định. Các trường state/boolean chưa có default được giữ bắt buộc để command khai báo quyết định rõ ràng. `snapshotVersion` mặc định 1; số dư/version có default theo thiết kế.
- `OrderAddress.recipientName/phone/countryCode/line1` cho phép null để nhập địa chỉ legacy chưa parse; SQL CHECK bắt đủ trường khi `completeness=COMPLETE`. Không điền địa chỉ giả để đạt NOT NULL.
- DDL từ Prisma chưa tự chứa partial unique, expression index và CHECK trong `constraints.sql`. Khi tạo migration thật, ghép phần SQL bổ sung đã review vào migration sau DDL và trước khi mở ghi v2; kiểm tra lại với PostgreSQL test. File SQL chỉ phục vụ schema v2, không chạy trên bảng v1.
- Các khoảng tax/shipping không chồng lấn, snapshot không được sửa sau phát hành và ledger append-only chưa được bảo đảm hoàn toàn bằng quyền DB/trigger. Phải thực hiện các lớp kiểm soát đó theo module, không coi tên model là bằng chứng tính năng hoàn chỉnh.

## Mức xác nhận

Đã chạy format/validate/generate, dry run toàn bộ upgrade trên PostgreSQL rồi rollback, kiểm tra năm ràng buộc từ chối dữ liệu sai, áp dụng migration bằng Prisma Migrate và kiểm tra dữ liệu sau commit. Kết quả cụ thể tại [PROJECT_STATUS.md](../PROJECT_STATUS.md). Chưa có API E2E hoặc test checkout/payment v2; chưa gọi Stripe.

Prisma migrate status xác nhận ba migration đã áp dụng; diff database → schema v2 cuối cùng rỗng. Index `auth_sessions_family_idx` đã khai báo trong Prisma schema thay vì chỉ tồn tại trong SQL bổ sung; không sửa nội dung migration đã chạy.

## Chuẩn bị migration — 05/11/2026

Lựa chọn cuối của người dùng: giữ dữ liệu còn lại, bỏ đơn cũ khỏi dữ liệu đang dùng và chuyển sang VND. Migration đưa tám bảng cùng ba enum v1 sang schema `legacy_v1`, tạo v2 tại `public` và backfill trong cùng transaction. Bản gốc có 1 đơn đã hủy và 1 payment pending (amount không khớp order) được giữ trong archive để đối chiếu; **không đưa vào public v2, không ghi CAPTURE hoặc gọi Stripe**. Chỉ v2 dùng VND; archive giữ nguyên raw currency/amount lịch sử, không đổi nhãn tiền của chứng từ cũ.

Đã giữ 1 user với password hash khớp nguồn, 1 user-role, 1 category, 3 product/variant, 1 cart và tổng stock 128. Tồn khớp ledger OPENING. Bốn ảnh (3 sản phẩm, 1 danh mục) có media PENDING; URL gốc ở archive, chưa tải/import file và chưa có storage key READY. Token v1 không được chuyển thành session v2; cần đăng nhập lại khi auth v2 sẵn sàng.

Migration lưu archive trên cùng database để phục hồi và so sánh, **không thay thế backup độc lập/PITR**. Không xóa archive hoặc chạy lại script chuẩn bị để đổi nội dung migration đã áp dụng. `test-upgrade.cjs` chỉ chạy trước migration vì nó đòi public còn cấu trúc v1; `verify-upgrade.cjs` là kiểm tra chỉ đọc sau migration.

`node prisma/v2/preflight.cjs` chỉ đọc số dòng các bảng, không in dữ liệu cá nhân hoặc chuỗi kết nối. `node prisma/v2/prepare-migration.cjs` render baseline offline từ schema và constraints; từ chối ghi đè khi file migration có nội dung khác. Không dùng tùy chọn thay file chưa áp dụng cho migration đã chạy.
