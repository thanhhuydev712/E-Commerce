# Backend v2 — catalog, giá VND, ảnh và tồn kho

Ngày **06/11/2026**. Phần cài đặt giai đoạn 2 trong [thiết kế backend](BACKEND_DESIGN.md). AppModule nạp Catalog, Pricing, Media và Inventory bên cạnh Platform/Auth/Accounts/Access. Dùng schema và generated client v2 hiện có; giai đoạn này không thêm migration hoặc dependency.

## 1. Luồng dữ liệu và quyền

Luồng quản trị: tạo danh mục/thương hiệu → định nghĩa thông số → tạo sản phẩm DRAFT → gắn danh mục chính → khai báo option/SKU → đặt giá VND → điền thông số bắt buộc → upload/gắn ảnh → publish. Nhập điều chỉnh tồn kho là thao tác riêng có phiên bản và mã chống lặp.

API nằm dưới `/api/v1`. JSON dùng `{ data, meta: { requestId } }`, lỗi dùng `{ error, meta }`; riêng nội dung ảnh trả binary. Swagger ở `/api/docs`, JSON `/api/docs-json`. Request DTO từ chối field ngoài contract. Public catalog, giá, kết quả điều chỉnh kho và metadata ảnh có response schema trong Swagger; các response quản trị còn lại chưa mô tả đầy đủ mọi field bằng response DTO.

Các field tùy chọn nhưng không nullable như sortOrder, optionValueIds khi PATCH, isFilterable/isPrimary và priority không nhận null; bỏ field nếu muốn giữ nguyên/dùng mặc định. Null chỉ dùng cho field cho phép xóa giá trị, như parentId hoặc compareAtAmount. Phân trang catalog/kho/tài khoản giới hạn page tối đa 21474837, limit tối đa 100 để offset không vượt int32; đầu vào vượt giới hạn trả 400.

Các route `/admin/*` yêu cầu Bearer access còn hiệu lực và permission đọc từ DB mỗi request:

| Permission | Tác vụ |
| --- | --- |
| `catalog.read` | Đọc sản phẩm quản trị, thương hiệu/danh mục/thông số và cấu hình thuế |
| `catalog.write` | Sửa catalog, SKU, trạng thái, thông số và gắn ảnh |
| `pricing.write` | Đặt giá, tạo lớp thuế và mức thuế |
| `media.write` | Upload, đọc metadata và preview ảnh riêng |
| `inventory.read` | Đọc kho, balance và movement |
| `inventory.adjust` | Tạo kho và điều chỉnh tồn |

`seed:access` bổ sung sáu permission trên, tổng cộng 10 cùng bốn permission danh tính. Seed có thể chạy lại và gắn grants cho system ADMIN; không tự gán ADMIN cho tài khoản đã migrate. Không có bypass chỉ dựa vào tên role. Thao tác ghi thành công có audit trong cùng transaction; thay đổi giá có before/after, điều chỉnh tồn có actor/reason và movement.

## 2. Catalog công khai

| Method/route | Hành vi |
| --- | --- |
| GET `/products` | `page=1`, `limit=20` (tối đa 100), `q`, `categoryId`, `brandId`, `minPrice`, `maxPrice`, `sort=newest\|name`; data gồm items/total/page/limit |
| GET `/products/:slug` | Chi tiết sản phẩm đủ điều kiện hiển thị; không thấy trả 404 |
| GET `/categories` | Danh mục ACTIVE có toàn bộ tổ tiên ACTIVE; danh sách phẳng có parentId/sortOrder để UI dựng cây |
| GET `/brands` | Thương hiệu ACTIVE |
| GET `/currencies` | Cấu hình VND đang active; không có route đổi currency tùy ý |

Sản phẩm xuất hiện khi status ACTIVE, publishedAt đã tới, danh mục chính và tổ tiên ACTIVE, thương hiệu ACTIVE nếu được gắn, currency VND active/minorUnit=0 và có SKU ACTIVE với giá VND. SKU không có giá hoặc đã archive bị loại khỏi public response. Hết tồn vẫn có thể xem sản phẩm; `available=0` chưa phải chính sách cấm xem hay cấm đặt hàng. Response không lộ balance theo kho, ledger, actor hoặc storage key.

`q` tìm không phân biệt hoa/thường theo tên sản phẩm hoặc SKU. `categoryId` khớp danh mục được gắn trực tiếp, chưa tự mở rộng toàn bộ cây con. Bộ lọc giá yêu cầu ít nhất một SKU ACTIVE có giá trong khoảng; response vẫn gồm các SKU hợp lệ khác của sản phẩm. `newest` sắp theo createdAt rồi id; chưa có sắp xếp theo giá, full-text search hoặc facet count. Một sản phẩm được đọc trong snapshot transaction nhất quán.

Giá `amount` và `compareAtAmount` là **chuỗi số nguyên VND**, ví dụ `"1500000"`; không ép qua JavaScript Number, không nhân 100 hoặc quy đổi ngoại tệ. Thông số NUMBER trả chuỗi thập phân chính xác; BOOLEAN giữ cả giá trị false. Description là dữ liệu văn bản chưa tin cậy; frontend phải xử lý an toàn nếu muốn render HTML.

## 3. Quản trị catalog

Các route bên dưới có prefix `/admin`; đọc cần catalog.read, ghi cần catalog.write:

| Method/route | Tác vụ |
| --- | --- |
| GET/POST `/products` | Phân trang quản trị / tạo DRAFT; create nhận name, slug, brandId?, taxClassId?, summary?, description? |
| GET/PATCH `/products/:id` | Chi tiết quản trị / sửa nội dung; detail thấy cả SKU chưa có giá/đã archive và media PENDING |
| POST `/products/:id/publish`, `/unpublish`, `/archive` | Chuyển ACTIVE/DRAFT/ARCHIVED có kiểm tra nghiệp vụ, HTTP 200 |
| PUT `/products/:id/categories` | Thay categoryIds và primaryCategoryId thuộc danh sách đó |
| POST `/products/:id/options` | Tạo code/name và values[{code,label}], chỉ khi DRAFT |
| POST `/products/:id/variants` | Tạo sku/name?/barcode?/weightGrams?/optionValueIds?, chỉ khi DRAFT |
| PATCH `/variants/:id` | Sửa metadata; đổi optionValueIds chỉ khi DRAFT; SKU không đổi qua PATCH |
| PUT `/variants/:id/status` | ACTIVE hoặc ARCHIVED; không làm sản phẩm ACTIVE mất SKU hợp lệ cuối cùng |
| GET/POST `/brands`, PATCH `/brands/:id`, PUT `/brands/:id/status` | Thương hiệu, slug và logoAssetId READY |
| GET/POST `/categories`, PATCH `/categories/:id`, PUT `/categories/:id/status` | Cây danh mục, parentId, imageAssetId READY, sortOrder |
| GET/POST `/attributes` | Định nghĩa code/name/dataType TEXT\|NUMBER\|BOOLEAN, unit?, isFilterable? |
| PUT `/categories/:id/attributes` | Thay attributes[{attributeId,isRequired}]; unpublish các sản phẩm đang gắn trước khi đổi |
| PUT `/products/:id/attributes`, `/variants/:id/attributes` | Thay toàn bộ giá trị thông số của đối tượng |
| POST `/products/:id/media` | Gắn assetId READY, variantId?, altText?, sortOrder?, isPrimary? |

Publish kiểm toàn bộ SKU ACTIVE có giá VND, mỗi option chọn đúng một value thuộc cùng sản phẩm, option signature khớp và thông số bắt buộc của các danh mục đã gắn được đáp ứng ở sản phẩm hoặc từng SKU. Thiếu điều kiện trả 409; mutation làm mất thông số bắt buộc trên sản phẩm ACTIVE cũng rollback. Tối đa 10 option và 100 SKU/sản phẩm. SKU và tổ hợp option bị ràng buộc duy nhất; lỗi trùng trả 409. Không tạo endpoint CRUD riêng cho bảng nối.

Thông số nhận đúng một trong textValue/numberValue/booleanValue theo định nghĩa. numberValue là chuỗi Decimal(20,6). Danh mục không tự trỏ mình, không tạo vòng hoặc vượt 16 cấp; kiểm cây và mutation cấu trúc được serialize bằng advisory lock để tránh hai request cùng tạo vòng. Các mutation SKU/giá/kho khóa sản phẩm trước khi thay đổi. Đổi brand/danh mục sang ARCHIVED có thể ẩn sản phẩm ngay; dữ liệu liên kết được giữ. Archive sản phẩm hoặc SKU bị chặn nếu còn reserved stock. Đây chưa phải luồng hủy đơn hoặc hoàn tồn.

Ảnh chính được đổi trong một transaction theo phạm vi sản phẩm/SKU. variantId phải thuộc sản phẩm đang gắn; ảnh chưa READY không được dùng. Chưa có quản lý xóa ảnh/tái cấu trúc option đầy đủ, import catalog hàng loạt hoặc lọc theo thông số.

## 4. Giá và cấu hình thuế

`PUT /admin/variants/:id/price` cần pricing.write:

```json
{ "amount": "1500000", "compareAtAmount": "1700000" }
```

Chỉ chấp nhận chuỗi nguyên không âm dạng chuẩn, tối đa 9223372036854775807 (PostgreSQL bigint); compareAtAmount phải lớn hơn hoặc bằng amount, có thể null để bỏ. SKU phải ACTIVE và sản phẩm chưa ARCHIVED. Không nhận currency hoặc price từ body tạo sản phẩm; server cố định VND. Việc dùng giá này cho giỏ/đơn sẽ triển khai ở giai đoạn sau.

GET/POST `/admin/tax-classes` và GET/POST `/admin/tax-classes/:id/rates` quản lý cấu hình. Đọc cần catalog.read; ghi cần pricing.write. Rate là chuỗi thập phân từ 0 đến 1, tối đa sáu chữ số lẻ. Khoảng hiệu lực `[effectiveFrom, effectiveTo)` không được chồng nhau cho cùng tax class/code/country/region; cho phép hai khoảng tiếp giáp. Đây là cấu hình nghiệp vụ, chưa tính thuế checkout hoặc hóa đơn.

## 5. Kho và điều chỉnh tồn

| Method/route | Quyền / hành vi |
| --- | --- |
| GET `/admin/inventory/warehouses` | inventory.read; danh sách kho |
| POST `/admin/inventory/warehouses` | inventory.adjust; code/name/address, tạo ACTIVE |
| GET `/admin/inventory/balances` | inventory.read; page/limit, variantId?, warehouseId? |
| GET `/admin/inventory/movements` | inventory.read; cùng bộ lọc, ledger theo thời gian giảm dần |
| POST `/admin/inventory/adjustments` | inventory.adjust; bắt buộc header Idempotency-Key, HTTP 200 |

Ví dụ body điều chỉnh (ID thay bằng fixture local):

```json
{
  "variantId": "00000000-0000-4000-8000-000000000001",
  "warehouseId": "00000000-0000-4000-8000-000000000002",
  "delta": 10,
  "expectedVersion": 0,
  "reason": "Nhập tồn ban đầu"
}
```

Balance mới bắt đầu version=0. Server khóa row, so expectedVersion với version hiện tại, kiểm `onHand + delta >= reserved + unavailable` và giới hạn PostgreSQL int, rồi ghi balance tăng version, movement ADJUST, audit và kết quả chống lặp trong **cùng transaction**. SKU theo serial bị từ chối do cần luồng nhận serial riêng. Không cho client ghi trực tiếp onHand/reserved/unavailable; chưa có API reserve/release/consume.

Header Idempotency-Key dài 8–96 ký tự gồm chữ, số, `. _ : -`. Cùng actor + operation + key + payload trả lại kết quả đã lưu, kể cả hai request đồng thời; đổi payload cùng key trả 409. Retry một thao tác phải giữ nguyên key/payload. Tạo thao tác mới sau khi version conflict phải đọc balance mới và dùng key mới. Ledger có operationKey duy nhất; nếu bản ghi replay thiếu nhưng movement còn, server trả 409 thay vì áp dụng lại. Bản ghi chống lặp hiện được giữ lâu dài (expiresAt năm 9999), chưa có job dọn; cần thiết kế retention nếu tăng quy mô. `available=onHand-reserved-unavailable` là số tham khảo, chưa giữ hàng cho khách.

## 6. Ảnh local

POST `/admin/media` nhận multipart với đúng một field file tên `file`, tối đa 5 MiB. Chấp nhận PNG/JPEG; kiểm MIME/header/cấu trúc và kích thước ảnh (mỗi chiều tối đa 20.000, tổng tối đa 25 triệu pixel). Từ chối SVG, header giả và URL từ xa. Đây chưa phải decode/re-encode đầy đủ, quét malware, tạo thumbnail hoặc tối ưu ảnh.

File lưu dưới MEDIA_ROOT, mặc định `.local-media` tương đối working directory `api/`; thư mục được gitignore. Server tạo tên UUID, không nhận storage key từ client. Chỉ sau khi ghi file và transaction metadata/audit thành công mới trả READY; lỗi DB sẽ dọn file vừa ghi. Crash giữa filesystem và DB vẫn có thể để lại file mồ côi; chưa có job reconciliation.

GET `/admin/media/:id` đọc metadata, GET `/admin/media/:id/content` preview có guard media.write. Upload chưa gắn vào catalog vẫn riêng. GET công khai `/media/:id` chỉ trả ảnh READY gắn với sản phẩm đang hiển thị (và SKU ACTIVE nếu có), danh mục có đường tổ tiên ACTIVE hoặc thương hiệu ACTIVE. Mỗi lần đọc kiểm lại quyền hiển thị và tên file, trả Content-Type cùng `X-Content-Type-Options: nosniff`, cache no-store. Không mount thư mục thành static public.

Bốn media backfill PENDING chưa được import, không tự tải URL trong archive. Các instance phải thấy cùng dữ liệu ảnh; local adapter hiện chỉ dành cho development/một instance có volume bền vững. Khi triển khai cần volume/backup phù hợp hoặc adapter object storage theo [kế hoạch hạ tầng](DEPLOYMENT_PLAN.md); không coi file trong image/container tạm là storage đã vận hành.

## 7. Kiểm tra và giới hạn nghiệm thu

Trong `api/`: generate client v2 trước build, sau đó lint, unit và `npm.cmd run test:e2e:isolated`. Suite danh tính dùng schema `codex_auth_test_*`; suite catalog tạo schema `codex_catalog_test_*` cùng thư mục ảnh tạm do chính nó sở hữu, rồi dọn sau khi chạy. Không reset/truncate public/legacy_v1, không gọi Stripe hoặc nhập ảnh từ mạng. Không dùng kết nối production.

E2E kiểm publish/visibility, giá vượt Number.MAX_SAFE_INTEGER, Decimal/boolean, cycle danh mục đồng thời, option ownership/unique, rollback, phân quyền, retry điều chỉnh kho đồng thời, version conflict, stock floor, serial guard và upload/đọc ảnh. Kết quả thực tế và giới hạn từng lượt ghi tại [PROJECT_STATUS.md](PROJECT_STATUS.md).

Vẫn quan sát được cảnh báo deprecation của pg 8 khi Prisma runtime/adapter đọc quan hệ trong transaction; stack trace từ artifact dist đi qua generated runtime và adapter-pg. Đã bỏ truy vấn Promise.all của ứng dụng trên cùng transaction, nhưng chưa xử lý hành vi bên trong dependency hoặc xác minh tương thích pg 9. Không sửa generated client hoặc che cảnh báo; đây chưa phải benchmark/concurrency audit toàn hệ thống.

Chưa triển khai ở giai đoạn này: giỏ/checkout/đơn/payment/refund v2, frontend gọi API thật, thuế checkout, luồng serial/nhập mua/chuyển kho, import bốn ảnh cũ, object storage, email provider, tác vụ dọn/đối soát, benchmark tải và deployment. Không tự publish hoặc sửa giá/tồn thật chỉ để tạo dữ liệu demo.
