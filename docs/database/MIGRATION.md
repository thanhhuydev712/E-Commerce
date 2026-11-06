# Chuyển từ schema hiện tại sang v2 và nghiệm thu

Ngày **05/11/2026** — kế hoạch tham chiếu và kết quả triển khai. **Đã áp dụng `20261105010000_upgrade_v2_vnd`**, backfill dữ liệu còn lại vào public v2, lưu tám bảng v1 ở `legacy_v1`; theo yêu cầu mới, không chuyển đơn/payment cũ sang dữ liệu active. Currency v2 là VND, không FX. [PRISMA_V2.md](PRISMA_V2.md) ghi kết quả và giới hạn; các phương án giữ lịch sử đầy đủ dưới đây là tham chiếu cho tình huống khác. Chưa chuyển service/DTO hoặc gọi Stripe.

## 1. Chọn cách chuyển phù hợp dữ liệu

**Nếu chỉ có dữ liệu demo có thể bỏ:** tạo database phát triển v2 riêng, migration baseline mới ở nhánh triển khai và seed giả lập. Giữ database/schema/migrations cũ để đối chiếu cho tới khi chạy đủ luồng. Không reset database hiện tại theo suy đoán.

**Nếu có dữ liệu phải giữ:** dùng expand → backfill → verify → switch → contract. Expand là thêm cấu trúc mới chưa xóa cũ; backfill là chuyển dữ liệu có đối chiếu; switch là chuyển đường đọc/ghi; contract chỉ bỏ cấu trúc cũ sau cửa sổ tương thích và diễn tập rollback. Với thay đổi lớn của project nhỏ, maintenance window chặn ghi lúc chuyển lõi đơn/kho thường ít rủi ro hơn duy trì dual write lâu dài.

Không sửa lịch sử migration đã áp dụng. Schema hiện giữ id UUID dưới dạng text trong PostgreSQL; đổi sang native uuid phải kiểm dữ liệu có cast được, FK và downtime trước. Có thể giữ text trong giai đoạn tương thích, không bắt buộc đổi kiểu cùng lúc đổi nghiệp vụ.

## 2. Ánh xạ dữ liệu cũ

| Nguồn | Đích | Quy tắc backfill và giới hạn |
| --- | --- | --- |
| `User.id/email/password` | users và user_roles | Giữ id, hash hiện có; preflight email trùng sau lower/trim trước tạo unique; USER → CUSTOMER, ADMIN → ADMIN; không tạo quyền dựa dữ liệu request |
| `User.refreshToken` | auth_sessions | Không thể mặc định đây là hash hợp lệ: service hiện có bất nhất lưu/compare. Thu hồi phiên cũ, yêu cầu login lại; không copy token thô sang thiết kế mới |
| `Category` | categories | Giữ id/slug; parent null; map active/archive; không tự tạo cây giả |
| `Product` | products + một product_variants | Product giữ id; tạo variant id mới ổn định bằng bảng mapping backfill; SKU cũ chuyển sang variant, signature `default`; slug tạo có xử lý trùng; chưa có brand/attribute thì để thiếu ở master |
| `Product.price` | variant_prices | Chỉ đổi Decimal sang minor unit sau khi chốt currency từng tập dữ liệu. Không dùng display UI làm bằng chứng currency |
| `Product.stock` | balance một kho + OPENING movement | Xem mục tồn kho bên dưới để không giữ/trừ lại lượng đã trừ ở đơn cũ; reject stock âm và tạo báo cáo dữ liệu bất thường |
| `Product.imageUrl` | media_assets + product_media | Phân biệt URL public ngoài với storage key nội bộ; chưa tải/kiểm file thì trạng thái PENDING. Nếu URL ngoài phải có adapter/allowlist hoặc import file hợp lệ, không ghi URL vào storage_key rồi coi đã migrate |
| `Cart/CartItem` | carts/cart_items theo variant mapping | `carts_items` là tên bảng cũ. Giữ cart mới nhất chưa checkout làm ACTIVE, gộp các giỏ khác theo rule có audit; xử lý duplicate quantity, product inactive, currency khác; không giữ tồn từ cart |
| `Order` | orders, addresses, history | Giữ id/number, source LEGACY; checkout_session null; status map bên dưới, snapshot ghi nguồn legacy và phần thiếu. Không khẳng định subtotal/tax/discount cũ đáng tin nếu chưa đối chiếu |
| `OrderItem.price/quantity` | order_items snapshot | Lưu giá lịch sử hiện có trước; tên/SKU chỉ có catalog hiện tại thì đánh dấu snapshot phục dựng trong pricing_snapshot, không gọi là thông tin gốc tại ngày mua |
| `Order.shippingAddress` | order_addresses | Giữ nguyên original_text, completeness LEGACY_UNPARSED; parse thủ công hoặc flow xác minh trước fulfillment. Không tự đoán số điện thoại/tỉnh/quận |
| `Payment` | payments + attempt + transaction nếu có bằng chứng | Giữ liên kết order; transactionId đối chiếu provider/account/mode; không tạo CAPTURE/REFUND chỉ vì enum COMPLETED/REFUNDED. Legacy chưa rõ được chặn khỏi quyết định tự động và tạo reconciliation issue |

Backfill dùng mapping bền vững cho variant/asset/attempt: file chuyển đổi không chứa secret hoặc PII, hoặc bảng staging nằm trong môi trường migration được kiểm quyền. Rerun không tạo id mới cho cùng entity. Báo cáo mapping không commit email/địa chỉ thật.

### Tiền tệ cũ

`Product/Order` chưa có currency, Payment có default `usd`, service dùng `amount × 100` và frontend có cách hiển thị riêng. Đây là **dữ liệu cần điều tra**, không phải cơ sở gán toàn bộ đơn cũ sang VND hay USD.

Quy trình: kiểm amount/order/payment/provider bằng dữ liệu dev/test được phép; xác định currency trên mỗi tập chứng từ; nhân theo exponent bằng Decimal chính xác; nếu phần thập phân vượt độ chính xác cho phép thì báo lỗi/manual review, không tự làm tròn im lặng. Đơn không xác định được currency lưu staging và chưa switch sang lõi v2. Chỉ bật một currency bán ở lần đầu nhưng không thay currency của chứng từ lịch sử.

Tổng cũ có thể khác `Σ price × quantity` vì lỗi request hoặc dữ liệu trước đây. Xuất báo cáo chênh lệch, giữ bản gốc phục vụ điều tra, không sửa lịch sử để ép CHECK. Chỉ migrate khi có quyết định xử lý; không gọi các đơn đó là đủ tính nhất quán mới.

### Tồn kho cũ

Service hiện trừ stock ngay khi tạo order. Vì vậy copy stock rồi giữ lại toàn bộ đơn đang chờ sẽ làm mất khả năng bán hai lần về mặt số dư.

Trong maintenance window, phân loại từng order: đã giao, đang giữ hàng chưa giao, đã hủy/hoàn, không rõ. Đối soát tồn vật lý nếu có. Với phần giữ đã bị trừ ở hệ thống cũ và chưa giao, tính:

```text
new_on_hand = old_available_stock + confirmed_outstanding_allocations
new_reserved = confirmed_outstanding_allocations
new_available = old_available_stock
```

Tạo OPENING movement cho new_on_hand, sau đó RESERVE movement và reservation tương ứng từng dòng chưa giao. ACTIVE dành đơn chờ thanh toán với deadline mới được phê duyệt; COMMITTED dành đơn đã xác nhận trả tiền. Không cộng lại đơn đã giao hoặc đã hoàn tồn. Shipment lịch sử phục dựng chỉ để truy vết, không chạy lại command SHIP để trừ tồn sau OPENING; movement v2 bắt đầu từ mốc cutover đã đối soát. Nếu không chứng minh được old stock đã trừ/hoàn chính xác, không dùng công thức mù: kiểm kê và xử lý chênh lệch trước switch.

### Trạng thái cũ

| Cũ | Mới / xử lý |
| --- | --- |
| Order `PENDING` | PENDING_PAYMENT chỉ sau đối chiếu payment; cấp deadline/reservation theo chính sách migration |
| Order `PROCESSING` | PROCESSING sau xác minh đã confirm và chưa giao; không suy ra đã thu tiền từ status đơn |
| Order `SHIPPED` | Order PROCESSING + shipment SHIPPED; thiếu carrier/tracking thì method_snapshot ghi legacy, không bịa tracking |
| Order `DELIVERED` | COMPLETED khi đủ bằng chứng; shipment DELIVERED và item allocations phục dựng có đánh dấu |
| Order `CANCALLED` | CANCELLED; mapping enum rõ, không đổi tên cũ bằng search/replace rồi bỏ migration |
| Payment `PENDING/FAILED` | Attempt PENDING/UNKNOWN/FAILED tùy provider; payment UNPAID/PENDING theo dữ liệu thực |
| Payment `COMPLETED` | PAID chỉ sau xác minh giao dịch; ledger CAPTURE có external id thật và đúng currency |
| Payment `REFUNDED` | REFUNDED chỉ sau xác minh khoản hoàn; schema cũ không có đủ chi tiết refund một phần |

Cho dữ liệu address legacy thiếu trường, DDL giai đoạn chuyển đổi cho phép nullable ở recipient/phone/country/line1 và CHECK `completeness='LEGACY_UNPARSED' OR các trường bắt buộc IS NOT NULL`. Từ điển ghi hợp đồng dữ liệu mới; migration không được điền placeholder giả để đạt NOT NULL. Đơn legacy thiếu dữ liệu không được giao tự động.

## 3. Các lát triển khai

| Giai đoạn | Cấu trúc và API cần làm cùng | Điều kiện kết thúc |
| --- | --- | --- |
| 0. Khảo sát | Chụp schema/row counts không PII; migration status; verify client import; currency/stock audit; backup restore | Có dữ liệu kiểm chứng và quyết định giữ/bỏ dữ liệu; không còn nhập nhằng currency trước backfill |
| 1. Danh tính | User/session/challenge/roles/addresses; auth + guards + DTO/Swagger | Login/refresh/logout/reset và chặn ownership có test; không còn token thô |
| 2. Catalog và kho | Product/variant/media/price/currency/tax; một warehouse, balance/reservation/movement; seed có SKU mặc định | API product và inventory chuyển sang variant; adjustment có chứng từ; giá/tồn không âm |
| 3. Checkout và payment | Cart/quote/order snapshot/discount nếu enable; payment attempts/transactions/refunds/provider events; idempotency/audit/outbox tối thiểu | Luồng server pricing → reserve → payment → cancel/refund đúng; sửa DTO/controller/service/Swagger đồng bộ |
| 4. Giao và trả | Shipping methods/rates, shipments/items/events, return receipts/inspection, refund allocations | Giao một phần, trả lỗi, thu hồi giữ tồn đúng; frontend hiển thị trạng thái độc lập |
| 5. Cung ứng | Supplier/PO/receipt/transfer/count, serial khi bật, reconciliation UI | Nhập/chuyển/kiểm không tạo kho âm hoặc tăng trùng; có audit người duyệt |
| 6. Sản phẩm và hậu mãi | Promotion nâng cao, review/wishlist, CMS/support/notification, invoice/credit, warranty | Mỗi nhóm có acceptance criteria riêng; không gắn nhãn hoàn thành chỉ vì tạo bảng |

Giai đoạn là lát giao hàng, không phải thứ tự chạy SQL từng bảng. Cần tạo bảng cha/FK theo dependency; có vòng giữa media/products/variants và attempt/refund/transaction thì tạo bảng trước, thêm FK sau. Giai đoạn 2–3 chỉ switch ghi khi catalog/kho/order/payment và service đã tương thích toàn luồng. Không deploy nửa lõi làm mất reservation hoặc dùng lại Product.stock.

## 4. Quy trình migration có thể review

1. Chốt acceptance criteria của lát triển khai và các chính sách còn mở; chuyển mô hình tương ứng sang Prisma schema, giữ import `.js` ESM/NodeNext.
2. Thống nhất Prisma Client theo generator thực tế. Hiện generator `prisma-client-js` mặc định nhưng Cart import `src/generated/prisma`; không sửa tay generated client.
3. Tạo migration mới trên DB phát triển riêng. Review DDL, delete rules, index biểu thức/partial, CHECK và FK ghép. Không mặc định ORM tạo đủ ràng buộc xuyên bảng.
4. Viết backfill idempotent, có preflight và dry run số liệu; chạy trên bản sao test. Không in connection string/token/PII. Ghi nguồn phục dựng, tổng chênh lệch và bản ghi cần xử lý thủ công.
5. Chạy integrity/concurrency tests, so sánh số dòng và tổng từng currency, test rollback. Giữ cột cũ chưa contract trong cửa sổ tương thích.
6. Switch trong maintenance window nếu cần: ngừng tạo đơn/cập nhật tồn, xử lý attempt UNKNOWN và webhook/inbox đang pending theo runbook, backfill delta, kiểm lại invariant rồi bật service v2. Provider vẫn có thể gửi webhook nên phải tiếp nhận bền vững, không bỏ sự kiện khi tạm dừng checkout.
7. Theo dõi lỗi/payment/inventory reconciliation. Chỉ drop cột/bảng cũ ở migration sau khi không còn code đọc/ghi, có retention và backup đã kiểm chứng.

Rollback trước khi có ghi v2 có thể quay code/schema tương thích. Sau khi phát sinh thu/hoàn tiền hoặc movement v2, không restore backup cũ rồi coi như chưa có giao dịch: cần forward fix hoặc replay/đối soát mọi sự kiện sau mốc. External payment không rollback theo DB transaction.

## 5. Bộ kiểm thử nghiệp vụ bắt buộc trước switch

| Trường hợp | Bằng chứng cần đạt |
| --- | --- |
| Hai request tạo active cart | Chỉ một cart ACTIVE/user; request còn lại reuse được |
| Giá giả từ client; giá đổi sau quote | Giá giả bị bỏ/từ chối; quote đổi trả yêu cầu xác nhận, không âm thầm thu giá mới |
| Hai khách mua SKU available=1 | Chỉ một order giữ được hàng; request còn lại rollback đầy đủ |
| Đơn nhiều dòng, dòng cuối hết hàng | Không có order/reservation/coupon bị commit dở |
| Hai request cùng cart, key khác nhau | Tối đa một order do cart/checkout state + lock; không chỉ chống trùng cùng key |
| Cùng idempotency key, payload giống/khác | Giống trả cùng order; khác trả conflict; crash sau commit không tạo đơn mới |
| Hai request tạo attempt, provider timeout | Một active attempt; UNKNOWN được retrieve/retry cùng provider key |
| Webhook giả/lặp/sai thứ tự/đến trước response | Giả không persist; lặp không ghi trùng ledger; không ghi lùi status; mapping đúng attempt |
| Worker expiry chạy cùng capture | Không release hàng đã commit; late capture sau EXPIRED tạo luồng hoàn/issue đúng policy |
| Hai request hủy đơn | Release reservation/lượt dùng một lần, không tăng stock hai lần |
| Hai request refund một phần | Tổng giữ hạn mức + thành công không vượt captured/item net; phần lẻ cộng đúng |
| Provider refund thành công nhưng DB timeout | Replay cùng refund không hoàn hai lần; ledger phục hồi được |
| Hai shipment đóng cùng một order item | Tổng allocation không vượt quantity, serial không bị gán trùng |
| Giao một phần, trả một phần | Reservation split/consume đúng; số trả <= đã giao; tiền/tồn độc lập |
| Trả hàng hỏng và retry inspection | Không tăng available; chỉ một movement hợp lệ |
| Hai receipt nhận một PO line | Accepted tổng không vượt quantity; stock chỉ tăng một lần mỗi receipt |
| Chuyển kho đang vận chuyển | Available không xuất hiện đồng thời ở cả hai kho; thiếu hàng có dấu vết |
| Kiểm kho khi có movement mới | Version conflict yêu cầu đối chiếu; không ghi đè reserved |
| User sửa địa chỉ/tên sản phẩm | Snapshot order/invoice không đổi theo master data |
| User xem đơn/payment/support của người khác | Bị từ chối; list/detail và attachment đều kiểm quyền |
| Khóa/archive user/product | Lịch sử order/payment/movement còn nguyên, không bị cascade |
| Currency exponent 0/2; amount lớn | Adapter đúng minor units; DTO chuỗi không mất số; không nhân 100 mọi currency |
| Worker crash sau gửi mạng | Lease/retry/dedupe hoạt động; giới hạn gửi email trùng được ghi rõ |
| Backup restore và backfill rerun | FK/totals/stock khớp, không nhân đôi variant/reservation/ledger |

Unit test cho tính tiền/chuyển trạng thái; integration test với PostgreSQL test riêng cho CHECK/FK/lock/concurrency; API E2E cho auth → checkout → payment. Dùng fixture/provider test giả lập hoặc Stripe test mode đúng phạm vi, không gọi live. Build/lint không thay thế được các bài kiểm tra nghiệp vụ này.

## 6. Hoàn thành bản thiết kế và trạng thái thực tế

Bản thiết kế đạt khi có ranh giới nghiệp vụ, từ điển dữ liệu, quan hệ, quy tắc tiền/tồn, transaction và lỗi mạng, delete/retention, mapping migration, tiêu chí kiểm thử và trade-off. Bản thiết kế đã có; lượt tiếp theo đã hiện thực hóa schema theo [PRISMA_V2.md](PRISMA_V2.md), chưa chuyển database/service.

Database v2 chỉ được gọi là **đã triển khai** khi schema/migration/service/DTO/Swagger/frontend types tương thích, kiểm thử trên PostgreSQL qua, dữ liệu cũ đối chiếu và quy trình deploy/restore đã chạy theo phạm vi phát hành. Chưa có những bằng chứng đó trong lượt thiết kế này.
