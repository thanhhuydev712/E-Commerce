# Từ điển dữ liệu v2

Ngày **05/11/2026**, bổ sung **06/11/2026** — từ điển mô hình v2. [Prisma schema v2](PRISMA_V2.md) đã áp dụng vào public, backfill user/catalog/cart/tồn theo VND. Runtime API hiện dùng v2, gồm đặt COD; đối chiếu [hiện trạng](../PROJECT_STATUS.md) để biết phần đã kiểm. Quy tắc nghiệp vụ/transaction dưới đây không tự có chỉ nhờ migration. Xem [TRANSACTIONS.md](TRANSACTIONS.md) và [MIGRATION.md](MIGRATION.md).

## Bổ sung cấu hình PC — 06/11/2026

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `saved_pc_builds` **M** | user_id:uuid → users; name:s150; schema_version:int=1 | FK owner RESTRICT; tên trim không rỗng; I(user_id,created_at,id); API giới hạn 50 bản/tài khoản |
| `saved_pc_build_components` | build_id:uuid → saved_pc_builds; slot:s32; product_id:uuid → products | PK(build_id,slot); FK build CASCADE khi xoá bản lưu; FK product RESTRICT; I(product_id); CHECK slot trong cpu/mainboard/ram/gpu/ssd/psu/case/cooler; API kiểm đúng danh mục sản phẩm |

Migration `20261106010000_storefront_saved_builds` thêm 2 bảng và 3 CHECK; tổng schema 104 model. Các bản lưu chỉ là lựa chọn sản phẩm, không giữ giá/tồn và không thay thế quy tắc checkout. [Audit aggregate hiện tại](DATABASE_AUDIT.json).

## Quy ước đọc

- Tên SQL dùng `snake_case`, tên Prisma tương ứng dùng PascalCase/camelCase và `@@map`/`@map`.
- Trừ bảng nối có PK ghép ghi rõ, mỗi bảng mặc định có `id:uuid PK`, `created_at:timestamptz NOT NULL DEFAULT now()`. Bảng có ký hiệu **M** thêm `updated_at:timestamptz NOT NULL` do ứng dụng cập nhật. Bảng ledger/history không sửa tại chỗ; sửa sai bằng bút toán/sự kiện bù.
- `?` nghĩa nullable; cột còn lại NOT NULL. `→ table` nghĩa FK tới `table.id`, trừ khi ghi cột đích. `U(...)` là unique; `PK(...)` khóa chính ghép; `I(...)` là index. Bảng nối PK ghép không có id mặc định.
- `sN` = varchar(N), `text` = text, `int` = integer, `bool` = boolean, `ts` = timestamptz, `date` = date, `json` = jsonb, `money` = bigint, `rate` = numeric(12,6). Mọi money không âm trừ cột delta có nói rõ; quantity nguyên dương trừ số dư/đếm cho phép 0. Tỷ lệ thuế `rate` thuộc [0,1].
- `state(...)` = varchar(32) với CHECK đúng danh sách giá trị ghi trong từng bảng; chưa phải PostgreSQL enum. Lựa chọn CHECK để triển khai thay đổi trạng thái có kiểm soát; service vẫn phải kiểm tra cạnh chuyển hợp lệ.
- FK mặc định `ON DELETE RESTRICT`, `ON UPDATE RESTRICT`. FK tùy chọn cũng không tự SET NULL khi xóa nếu không được chỉ rõ. Không dùng soft delete đại trà: dữ liệu chủ dùng status/archive; ledger được giữ nguyên; dữ liệu tạm xóa có kiểm soát.
- Tất cả FK cần index nếu chưa là tiền tố trái của PK/unique/index khác. Unique đã tạo index nên không tạo index trùng hệt. Index chuyên biệt bổ sung ghi tại từng nhóm và tài liệu transaction.
- Mọi trường JSON có validation kích thước/schema ở service; không chứa password, access/refresh token, khóa API hoặc dữ liệu thẻ. `snapshot_version:int DEFAULT 1` đi cùng các JSON snapshot của chứng từ.
- Currency dùng FK `currency_code:s3 → currencies.code`; không dùng default ngầm `usd`. Một chứng từ và mọi dòng/attempt/refund của nó phải cùng currency, service kiểm tra dưới khóa parent. Có thể dùng FK ghép khi chuyển thành DDL.

## A. Tài khoản, bảo mật, địa chỉ

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `users` **M** | email:s254; password_hash:text; first_name:s100?; last_name:s100?; phone:s32?; status:state(ACTIVE,LOCKED,ARCHIVED); email_verified_at:ts?; password_changed_at:ts?; archived_at:ts? | Unique `lower(email)`; trim/normalize trước lưu; không tái dùng email archive tự động. Không trả hash qua API. Khóa user không xóa đơn |
| `roles` **M** | code:s64; name:s100; description:text?; is_system:bool | U(code); seed CUSTOMER, ADMIN; vai trò nhân viên tách khi có nhu cầu |
| `permissions` | code:s100; description:text | U(code), ví dụ `inventory.adjust`, `refund.approve`; không nhận quyền từ client |
| `user_roles` | user_id:uuid → users; role_id:uuid → roles; assigned_by:uuid? → users | PK(user_id,role_id); có created_at; cascade theo role/user chỉ sau quy trình xóa dữ liệu chủ hợp lệ |
| `role_permissions` | role_id:uuid → roles; permission_id:uuid → permissions | PK(role_id,permission_id); cascade bảng nối |
| `auth_sessions` **M** | user_id:uuid → users; family_id:uuid; token_hash:text; previous_token_hash:text?; device_label:s200?; user_agent:s512?; ip_hash:s128?; expires_at:ts; rotated_at:ts?; revoked_at:ts?; revoke_reason:s64? | U(token_hash); I(user_id,revoked_at), I(expires_at); không lưu token thô. Reuse token cũ của session đã rotate thì revoke family; chỉ nhận refresh gắn session hợp lệ |
| `auth_challenges` **M** | user_id:uuid → users; purpose:state(VERIFY_EMAIL,RESET_PASSWORD); token_hash:text; expires_at:ts; consumed_at:ts?; attempts:int DEFAULT 0 | U(token_hash); token ngẫu nhiên một lần, attempts >= 0; consume bằng cập nhật có điều kiện. Reset password thu hồi session theo chính sách |
| `addresses` **M** | user_id:uuid → users; label:s100?; recipient_name:s200; phone:s32; country_code:s2; region_code:s32?; region_name:s150?; locality:s150?; postal_code:s32?; line1:s300; line2:s300?; is_default_shipping:bool; is_default_billing:bool; archived_at:ts? | Hai partial unique theo user cho default còn hoạt động; validate country/address ở service; không áp cứng số cấp hành chính |

## B. Catalog và giá

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `currencies` **M** | code:s3; name:s100; minor_unit:int; is_active:bool | PK(code), không id; minor_unit từ 0 đến 6 là giới hạn nội bộ; seed chỉ currency được chấp nhận; không đổi exponent sau khi có giao dịch |
| `brands` **M** | name:s150; slug:s180; description:text?; logo_asset_id:uuid? → media_assets; status:state(ACTIVE,ARCHIVED) | U(slug) |
| `categories` **M** | parent_id:uuid? → categories; name:s150; slug:s180; description:text?; sort_order:int; status:state(ACTIVE,ARCHIVED); image_asset_id:uuid? → media_assets | U(slug); CHECK parent_id != id; chống chu kỳ và giới hạn depth trong transaction service |
| `products` **M** | brand_id:uuid? → brands; name:s250; slug:s280; summary:text?; description:text?; status:state(DRAFT,ACTIVE,ARCHIVED); tax_class_id:uuid? → tax_classes; warranty_policy_id:uuid? → warranty_policies; published_at:ts?; archived_at:ts? | U(slug); I(status,published_at,id). Publish cần variant active + giá hợp lệ; description phải sanitize khi render |
| `product_categories` | product_id:uuid → products; category_id:uuid → categories; is_primary:bool | PK(product_id,category_id); partial U(product_id) WHERE is_primary; active product có đúng một primary do service bảo đảm |
| `media_assets` **M** | storage_key:s512; original_name:s255; mime_type:s100; size_bytes:bigint; width:int?; height:int?; checksum:s128?; status:state(PENDING,READY,REJECTED,ARCHIVED); uploaded_by:uuid? → users | U(storage_key); size >= 0, dimensions > 0 nếu có; không lưu URL ký tạm. Xóa file bằng job sau khi không còn tham chiếu |
| `product_media` **M** | product_id:uuid → products; variant_id:uuid? → product_variants; asset_id:uuid → media_assets; alt_text:s300?; sort_order:int; is_primary:bool | Variant nếu có phải thuộc product (FK ghép khi triển khai); partial unique ảnh chính cho product chung và từng variant; U(product_id,asset_id) |
| `product_variants` **M** | product_id:uuid → products; sku:s100; barcode:s100?; name:s200?; option_signature:s512; status:state(ACTIVE,ARCHIVED); weight_grams:int?; length_mm:int?; width_mm:int?; height_mm:int?; track_serial:bool DEFAULT false; archived_at:ts? | U(sku), unique barcode khi có, U(product_id,option_signature); signature từ tập option/value đã sắp xếp, default variant dùng `default`; kích thước/khối lượng > 0 |
| `product_options` **M** | product_id:uuid → products; code:s64; name:s100; sort_order:int | U(product_id,code); ví dụ màu, dung lượng — khác thông số mô tả |
| `product_option_values` **M** | option_id:uuid → product_options; code:s100; label:s150; sort_order:int | U(option_id,code) |
| `variant_option_values` | variant_id:uuid → product_variants; option_id:uuid → product_options; value_id:uuid → product_option_values | PK(variant_id,option_id); value phải thuộc option bằng FK ghép; option phải thuộc product của variant; kiểm tra đủ lựa chọn khi publish |
| `attribute_definitions` **M** | code:s64; name:s150; data_type:state(TEXT,NUMBER,BOOLEAN); unit:s32?; is_filterable:bool | U(code); thông số như bus RAM, công suất, vật liệu; không dùng thay option mua hàng |
| `category_attributes` | category_id:uuid → categories; attribute_id:uuid → attribute_definitions; is_required:bool; sort_order:int | PK(category_id,attribute_id); yêu cầu hợp lệ kiểm tra lúc publish product |
| `product_attribute_values` **M** | product_id:uuid → products; attribute_id:uuid → attribute_definitions; text_value:text?; number_value:numeric(20,6)?; boolean_value:bool? | U(product_id,attribute_id); CHECK đúng một value; kiểu phải khớp definition ở service |
| `variant_attribute_values` **M** | variant_id:uuid → product_variants; attribute_id:uuid → attribute_definitions; text_value:text?; number_value:numeric(20,6)?; boolean_value:bool? | U(variant_id,attribute_id); CHECK đúng một value; ghi đè giá trị product khi hiển thị/lọc variant |
| `variant_prices` **M** | variant_id:uuid → product_variants; currency_code:s3 → currencies.code; amount:money; compare_at_amount:money? | U(variant_id,currency_code); compare_at >= amount nếu có; giá hiện hành duy nhất, cập nhật có audit; giá cũ lưu trong order snapshot. Chưa có price list B2B |
| `tax_classes` **M** | code:s64; name:s150; description:text? | U(code) |
| `tax_rates` **M** | tax_class_id:uuid → tax_classes; code:s64; country_code:s2; region_code:s32?; rate:rate; effective_from:ts; effective_to:ts?; priority:int | U(tax_class_id,code,effective_from); end > start; không chồng khoảng cho cùng class/code/jurisdiction; chọn rate theo địa chỉ, thời điểm và snapshot. Không mặc định đây là bộ máy thuế đầy đủ |

Giữ filter thuộc tính bằng các index `(attribute_id,number_value)` hoặc `(attribute_id,text_value)` khi có truy vấn tương ứng. Không index mọi cột chỉ vì tồn tại. Giá và thuế không được thay đổi ngược chứng từ đã phát hành.

## C. Kho và cung ứng

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `warehouses` **M** | code:s64; name:s150; address_snapshot:json; status:state(ACTIVE,INACTIVE) | U(code); seed một kho trước; địa chỉ kho không dùng address book khách |
| `inventory_balances` **M** | warehouse_id:uuid → warehouses; variant_id:uuid → product_variants; on_hand:int DEFAULT 0; reserved:int DEFAULT 0; unavailable:int DEFAULT 0; version:int DEFAULT 0 | U(warehouse_id,variant_id); CHECK tất cả >= 0; CHECK reserved + unavailable <= on_hand; version >= 0 |
| `stock_reservations` **M** | balance_id:uuid → inventory_balances; order_item_id:uuid → order_items; quantity:int; status:state(ACTIVE,COMMITTED,CONSUMED,RELEASED,EXPIRED); expires_at:ts?; operation_key:s150 | U(operation_key); ACTIVE phải có expires_at; COMMITTED giữ đến khi giao/hủy. Variant của balance phải khớp order item |
| `inventory_movements` | balance_id:uuid → inventory_balances; on_hand_delta:int; reserved_delta:int; unavailable_delta:int; kind:state(OPENING,RECEIPT,RESERVE,RELEASE,SHIP,RETURN,TRANSFER_OUT,TRANSFER_IN,ADJUST,QUARANTINE); operation_key:s150; source_type:s64; source_id:uuid; reason:text?; actor_id:uuid? → users; occurred_at:ts | U(operation_key); ít nhất một delta != 0; I(balance_id,occurred_at,id). source là tham chiếu audit đa hình, không có FK: service kiểm tra loại/id, không cascade; chứng từ typed ở các bảng nguồn |
| `suppliers` **M** | code:s64; name:s200; contact_name:s150?; email:s254?; phone:s32?; tax_identifier:s64?; address_snapshot:json?; status:state(ACTIVE,INACTIVE) | U(code); đây là master supplier, chưa phải công nợ kế toán |
| `supplier_variants` **M** | supplier_id:uuid → suppliers; variant_id:uuid → product_variants; supplier_sku:s100?; lead_time_days:int?; minimum_order_qty:int DEFAULT 1; last_cost:money?; currency_code:s3 → currencies.code | U(supplier_id,variant_id); lead_time >= 0, MOQ > 0; giá tham khảo không ghi đè giá mua đã xác nhận |
| `purchase_orders` **M** | number:s64; supplier_id:uuid → suppliers; warehouse_id:uuid → warehouses; currency_code:s3 → currencies.code; status:state(DRAFT,APPROVED,PARTIALLY_RECEIVED,RECEIVED,CANCELLED); expected_at:ts?; approved_by:uuid? → users; approved_at:ts?; notes:text? | U(number); đã approved thì sửa qua quy trình amendment hoặc hủy phần chưa nhập; không tự nhập tồn khi approve |
| `purchase_order_items` **M** | purchase_order_id:uuid → purchase_orders; variant_id:uuid → product_variants; sku_snapshot:s100; quantity:int; unit_cost:money; tax_amount:money; discount_amount:money | U(purchase_order_id,variant_id); tổng nhận không vượt quantity trừ quy trình duyệt riêng; unit_cost chưa gồm thuế |
| `goods_receipts` **M** | number:s64; purchase_order_id:uuid? → purchase_orders; warehouse_id:uuid → warehouses; status:state(DRAFT,POSTED,REVERSED); received_at:ts; posted_at:ts?; posted_by:uuid? → users; reason:text?; operation_key:s150 | U(number), U(operation_key); PO null dành nhập đầu kỳ/ngoài PO có lý do, không tự bịa supplier |
| `goods_receipt_items` | receipt_id:uuid → goods_receipts; purchase_order_item_id:uuid? → purchase_order_items; variant_id:uuid → product_variants; accepted_qty:int; rejected_qty:int; unit_cost:money; currency_code:s3 → currencies.code; rejection_reason:text? | accepted/rejected >= 0, tổng > 0; variant/PO/warehouse/currency phải khớp parent; chỉ accepted nhập on_hand; hàng rejected chưa nhập kho bán |
| `stock_transfers` **M** | number:s64; from_warehouse_id:uuid → warehouses; to_warehouse_id:uuid → warehouses; status:state(DRAFT,DISPATCHED,RECEIVED,CANCELLED); dispatched_at:ts?; received_at:ts?; created_by:uuid → users | U(number); from != to; hàng DISPATCHED đang đi đường không available ở hai đầu; RECEIVED chỉ khi nhận đủ hoặc xử lý chênh lệch |
| `stock_transfer_items` **M** | transfer_id:uuid → stock_transfers; variant_id:uuid → product_variants; quantity:int; received_qty:int DEFAULT 0; lost_qty:int DEFAULT 0 | U(transfer_id,variant_id); received + lost <= quantity; mỗi lần nhận có movement key riêng; mất hàng có lý do/audit |
| `stock_counts` **M** | number:s64; warehouse_id:uuid → warehouses; status:state(DRAFT,COUNTING,APPROVED,CANCELLED); counted_at:ts?; approved_by:uuid? → users; approved_at:ts? | U(number); quy trình kiểm kho cần khóa phạm vi hoặc đối chiếu movement sau mốc đếm |
| `stock_count_items` **M** | count_id:uuid → stock_counts; balance_id:uuid → inventory_balances; expected_on_hand:int; counted_on_hand:int?; balance_version:int; reason:text? | U(count_id,balance_id); counted >= 0; approve dùng version, xung đột phải đếm/đối chiếu lại; không giảm on_hand dưới reserved + unavailable |

Số lượng đã nhận/đã giao trên header là projection nếu bổ sung, không phải dữ liệu gốc. Ledger movement là thay đổi số lượng; mô hình này chưa phải tính giá vốn FIFO/weighted average hoặc sổ kế toán tài chính.

## D. Giỏ, checkout và đơn

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `carts` **M** | user_id:uuid? → users; guest_token_hash:text?; currency_code:s3 → currencies.code; status:state(ACTIVE,CONVERTED,ABANDONED); version:int DEFAULT 0; expires_at:ts? | CHECK đúng một user/guest hash; partial U(user_id) WHERE ACTIVE, partial U(guest_token_hash) WHERE ACTIVE; guest cookie là secret ngẫu nhiên, lưu hash |
| `cart_items` **M** | cart_id:uuid → carts; variant_id:uuid → product_variants; quantity:int | U(cart_id,variant_id); cascade khi xóa cart tạm; không lưu giá authoritative; thêm giỏ không giữ hàng |
| `checkout_sessions` **M** | cart_id:uuid → carts; user_id:uuid → users; cart_version:int; currency_code:s3 → currencies.code; quote_snapshot:json; snapshot_version:int; quote_hash:s128; status:state(OPEN,CONVERTED,EXPIRED); expires_at:ts; converted_at:ts? | I(user_id,status,expires_at); quote gồm line/price/tax/shipping/coupon/address và phiên bản chính sách; chỉ một order theo checkout bằng U trên orders.checkout_session_id; checkout không giữ tồn |
| `orders` **M** | number:s64; user_id:uuid → users; checkout_session_id:uuid? → checkout_sessions; source:state(WEB,ADMIN,LEGACY); status:state(PENDING_PAYMENT,CONFIRMED,PROCESSING,COMPLETED,CANCELLED,EXPIRED); currency_code:s3 → currencies.code; subtotal:money; discount_total:money; shipping_total:money; tax_total:money; grand_total:money; customer_email_snapshot:s254; customer_note:text?; pricing_snapshot:json; snapshot_version:int; placed_at:ts; payment_deadline:ts?; cancelled_at:ts?; cancellation_reason:text?; version:int DEFAULT 0 | U(number), U(checkout_session_id) khi có; I(user_id,placed_at,id), I(status,placed_at,id); grand = subtotal - discount + shipping + tax; discount <= subtotal + shipping; source LEGACY có thể thiếu checkout, không dùng null để bỏ qua checkout mới |
| `order_items` | order_id:uuid → orders; variant_id:uuid → product_variants; line_number:int; product_name_snapshot:s250; variant_name_snapshot:s200?; sku_snapshot:s100; option_snapshot:json; image_key_snapshot:s512?; quantity:int; unit_price:money; line_subtotal:money; discount_amount:money; tax_amount:money; line_total:money; warranty_snapshot:json?; snapshot_version:int | U(order_id,line_number); line_subtotal = unit_price × quantity; discount <= subtotal; line_total = subtotal - discount + tax; không U(order,variant) để giữ các dòng có chính sách khác nhau |
| `order_addresses` | order_id:uuid → orders; kind:state(SHIPPING,BILLING); recipient_name:s200; phone:s32; email:s254?; country_code:s2; region_code:s32?; region_name:s150?; locality:s150?; postal_code:s32?; line1:s300; line2:s300?; company_name:s250?; tax_identifier:s64?; original_text:text?; completeness:state(COMPLETE,LEGACY_UNPARSED) | U(order_id,kind); hai snapshot, không FK đến address book; trường bắt buộc được phép null riêng trong migration LEGACY_UNPARSED theo chiến lược ở MIGRATION, không tự điền dữ liệu giả |
| `order_item_taxes` | order_item_id:uuid → order_items; tax_rate_id:uuid? → tax_rates; code_snapshot:s64; rate_snapshot:rate; taxable_amount:money; amount:money | U(order_item_id,code_snapshot); sum = order_items.tax_amount; order.tax_total gồm cả shipping tax trong pricing_snapshot |
| `order_status_history` | order_id:uuid → orders; from_status:s32?; to_status:s32; reason:text?; actor_id:uuid? → users; operation_key:s150 | U(operation_key); I(order_id,created_at,id); ghi cùng transaction đổi order; from null chỉ sự kiện tạo |
| `order_notes` **M** | order_id:uuid → orders; author_id:uuid → users; visibility:state(INTERNAL,CUSTOMER); body:text | Ownership/permission; hạn chế sửa/xóa sau gửi; lưu audit các chỉnh sửa |

Đơn mới phải có ít nhất một item và shipping address COMPLETE trước khi confirm, do transaction service đảm bảo. Chỉnh địa chỉ sau đặt hàng dùng command có quyền, chỉ trước đóng gói và có lịch sử audit; không sửa snapshot tài chính đã thu tiền.

## E. Khuyến mãi

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `promotions` **M** | code:s64; name:s200; type:state(PERCENT,FIXED,FREE_SHIPPING); percent_bps:int?; fixed_amount:money?; currency_code:s3? → currencies.code; min_subtotal:money?; max_discount:money?; starts_at:ts; ends_at:ts; priority:int; stacking_group:s64; status:state(DRAFT,ACTIVE,ARCHIVED); global_limit:int?; per_user_limit:int? | U(code); percent 1..10000, PERCENT chỉ có percent; FIXED chỉ có fixed/currency; mọi ngưỡng money cần currency. ends > starts; giới hạn > 0 |
| `promotion_products` | promotion_id:uuid → promotions; product_id:uuid → products | PK(promotion_id,product_id); không có target product/category nghĩa áp toàn giỏ; có cả hai thì hợp target |
| `promotion_categories` | promotion_id:uuid → promotions; category_id:uuid → categories | PK(promotion_id,category_id); mở rộng cây theo snapshot eligibility lúc checkout |
| `coupons` **M** | promotion_id:uuid → promotions; code:s64; status:state(ACTIVE,DISABLED); usage_limit:int?; expires_at:ts? | Unique upper(code); coupon là cách kích hoạt promotion, không phải engine giá thứ hai |
| `promotion_redemptions` **M** | promotion_id:uuid → promotions; coupon_id:uuid? → coupons; user_id:uuid → users; order_id:uuid → orders; status:state(RESERVED,APPLIED,RELEASED); reserved_until:ts?; operation_key:s150 | U(order_id,promotion_id), U(operation_key); khóa promotion/coupon trước đếm RESERVED/APPLIED; hết hạn/hủy chưa thu tiền trả lượt; hoàn sau mua không tự trả lượt |
| `order_discounts` | order_id:uuid → orders; order_item_id:uuid? → order_items; promotion_id:uuid? → promotions; coupon_id:uuid? → coupons; target:state(ITEM,SHIPPING); code_snapshot:s64; rule_snapshot:json; snapshot_version:int; amount:money | ITEM bắt buộc order_item_id, SHIPPING phải null; amount > 0; item thuộc order; tổng phân bổ khớp discount_total. Không cộng order_discounts lần nữa vào tổng đã có item.discount_amount |

Trong lần đầu hỗ trợ coupon: một promotion trong mỗi stacking_group; các nhóm có thể cộng theo priority cố định. Thứ tự và cách làm tròn được snapshot. Các luật phức tạp như buy-X-get-Y cần mô hình bổ sung; không nhét script tùy ý vào rule_snapshot.

## F. Thanh toán và đối soát

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `payments` **M** | order_id:uuid → orders; currency_code:s3 → currencies.code; amount_due:money; status:state(UNPAID,PENDING,PAID,PARTIALLY_REFUNDED,REFUNDED); captured_amount:money DEFAULT 0; refunded_amount:money DEFAULT 0; version:int DEFAULT 0 | U(order_id); refunded <= captured; captured/refunded là projection từ giao dịch SUCCEEDED; số tiền capture vượt dự kiến phải ghi nhận và xử lý, không che mất sự kiện |
| `payment_attempts` **M** | payment_id:uuid → payments; provider:s32; provider_account:s150; mode:state(TEST,LIVE); method:state(CARD,COD,BANK_TRANSFER); provider_intent_id:s255?; idempotency_key:s150; requested_amount:money; status:state(CREATED,PENDING,SUCCEEDED,FAILED,CANCELLED,UNKNOWN); failure_code:s100?; expires_at:ts?; settled_at:ts? | U(provider,provider_account,mode,provider_intent_id), U(idempotency_key); partial U(payment_id) khi CREATED/PENDING/UNKNOWN; lần UNKNOWN phải retrieve trước retry mới; không lưu PAN/CVC/client_secret |
| `payment_transactions` | attempt_id:uuid → payment_attempts; refund_id:uuid? → refunds; provider:s32; provider_account:s150; mode:state(TEST,LIVE); external_id:s255; kind:state(CAPTURE,REFUND,CHARGEBACK,CHARGEBACK_REVERSAL); amount:money; currency_code:s3 → currencies.code; status:state(SUCCEEDED); occurred_at:ts; source_event_id:uuid? → provider_events | U(provider,provider_account,mode,external_id,kind); amount > 0; chỉ ledger giao dịch thực đã xác nhận, thất bại nằm ở attempt/refund/event. REFUND phải có refund_id, kinds khác phải null |
| `provider_events` **M** | provider:s32; provider_account:s150; mode:state(TEST,LIVE); external_event_id:s255; event_type:s150; object_id:s255?; payload_redacted:json; payload_hash:s128; received_at:ts; status:state(RECEIVED,PROCESSING,PROCESSED,RETRY,DEAD); attempts:int DEFAULT 0; next_attempt_at:ts?; lease_until:ts?; processed_at:ts?; last_error_code:s100? | U(provider,provider_account,mode,external_event_id); I(status,next_attempt_at); chỉ persist sau xác minh chữ ký/raw body; payload không phải bản chứng minh chữ ký, lưu hash để truy vết |
| `refunds` **M** | payment_id:uuid → payments; return_request_id:uuid? → return_requests; amount:money; currency_code:s3 → currencies.code; reason:text; status:state(REQUESTED,APPROVED,PROCESSING,SUCCEEDED,FAILED,CANCELLED,UNKNOWN); requested_by:uuid? → users; approved_by:uuid? → users; provider_refund_id:s255?; idempotency_key:s150; completed_at:ts? | U(idempotency_key); provider ID unique theo account/mode qua attempt/payment transaction; amount > 0; khóa payment khi giữ hạn mức refund; UNKNOWN còn chiếm hạn mức |
| `refund_allocations` | refund_id:uuid → refunds; order_item_id:uuid? → order_items; target:state(ITEM,SHIPPING,GOODWILL); quantity:int?; amount:money; tax_amount:money | ITEM phải có item; SHIPPING/GOODWILL phải null; ITEM quantity > 0 nếu hoàn theo số lượng, null khi điều chỉnh một phần giá; amount gồm tax_amount; tax <= amount; tổng amount = refunds.amount |
| `reconciliation_runs` **M** | provider:s32; provider_account:s150; mode:state(TEST,LIVE); window_start:ts; window_end:ts; status:state(RUNNING,COMPLETED,FAILED); completed_at:ts?; summary:json? | end > start; chạy chồng khoảng được nhưng issue dùng dedupe; không lưu file sao kê chứa PII trong JSON |
| `reconciliation_issues` **M** | run_id:uuid → reconciliation_runs; payment_id:uuid? → payments; external_object_id:s255; dedupe_key:s255; kind:state(MISSING_INTERNAL,MISSING_EXTERNAL,AMOUNT_MISMATCH,CURRENCY_MISMATCH,STATUS_MISMATCH); status:state(OPEN,RESOLVED,IGNORED); detail_redacted:json; resolved_by:uuid? → users; resolved_at:ts? | U(dedupe_key); sửa sai phải tạo giao dịch bù có audit, không sửa ledger gốc |

`COD`/`BANK_TRANSFER` là lựa chọn thiết kế sau; chỉ enable khi có quy trình chứng minh thu tiền và đối soát. Không dùng admin đổi `PAID` làm bằng chứng thu. Chargeback giữ riêng khỏi refund, không làm âm/ghi đè captured_amount; projection tranh chấp tính từ ledger.

## G. Giao hàng

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `shipping_methods` **M** | code:s64; name:s150; carrier_code:s64?; service_code:s100?; status:state(ACTIVE,INACTIVE) | U(code); chưa có carrier credential trong bảng |
| `shipping_zones` **M** | name:s150; country_code:s2; region_code:s32?; postal_pattern:s100?; priority:int; status:state(ACTIVE,INACTIVE) | Quy tắc vùng cụ thể thắng vùng tổng theo priority; tránh hai rule ngang ưu tiên cùng match bằng validation |
| `shipping_rates` **M** | method_id:uuid → shipping_methods; zone_id:uuid → shipping_zones; currency_code:s3 → currencies.code; min_weight_grams:int; max_weight_grams:int?; min_subtotal:money; max_subtotal:money?; base_amount:money; starts_at:ts; ends_at:ts? | Các khoảng dùng [min,max), max > min; không rule giao nhau cho cùng method/zone/currency/time; service chọn và snapshot, không tính lại đơn cũ |
| `shipments` **M** | order_id:uuid → orders; warehouse_id:uuid → warehouses; shipping_method_id:uuid? → shipping_methods; number:s64; status:state(DRAFT,READY,SHIPPED,DELIVERED,FAILED,RETURNED,CANCELLED); carrier_code:s64?; carrier_account:s150?; tracking_number:s150?; provider_shipment_id:s255?; address_snapshot:json; method_snapshot:json; snapshot_version:int; shipped_at:ts?; delivered_at:ts?; operation_key:s150 | U(number), U(operation_key); unique tracking theo carrier/account nếu có; shipment luôn từ một kho, nhiều kho thì nhiều shipment |
| `shipment_items` | shipment_id:uuid → shipments; order_item_id:uuid → order_items; reservation_id:uuid → stock_reservations; quantity:int | U(shipment_id,reservation_id); reservation thuộc item và kho shipment; tách reservation khi giao một phần, không consume một reservation hai lần |
| `shipment_events` | shipment_id:uuid → shipments; external_event_id:s255?; dedupe_key:s255; status:s64; description:text?; location:s200?; occurred_at:ts; received_at:ts; payload_redacted:json? | U(dedupe_key); I(shipment_id,occurred_at,id); dedupe gồm carrier/account + external ID hoặc hash ổn định; sự kiện cũ không ghi lùi trạng thái |

Tổng shipment_items ở shipment chưa CANCELLED không vượt order_items.quantity. Kiểm tra dưới khóa order item, gồm cả DRAFT/READY để không đóng gói trùng. Return shipment không tạo lại dòng giao đi để tăng giới hạn giả.

## H. Đổi trả, serial và bảo hành

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `return_requests` **M** | number:s64; order_id:uuid → orders; requested_by:uuid → users; status:state(REQUESTED,APPROVED,REJECTED,RECEIVED,INSPECTED,CLOSED,CANCELLED); reason:text; resolution:state(REFUND,REPLACEMENT,REPAIR); approved_by:uuid? → users; approved_at:ts?; closed_at:ts? | U(number); không tự hoàn tiền chỉ vì nhận hàng; REPLACEMENT sinh đơn thay thế qua order_links |
| `return_items` **M** | return_id:uuid → return_requests; order_item_id:uuid → order_items; quantity:int; reason:text; requested_condition:s100? | U(return_id,order_item_id); tổng request không REJECTED/CANCELLED không vượt số đã giao, trừ phần trả đã hủy thật; khóa item khi duyệt |
| `return_inspections` | return_item_id:uuid → return_items; warehouse_id:uuid → warehouses; inspector_id:uuid → users; quantity:int; disposition:state(RESTOCK,QUARANTINE,SCRAP,REPAIR); condition_notes:text; inspected_at:ts; operation_key:s150 | U(operation_key); tổng kiểm tra <= số nhận thực; RESTOCK tăng on_hand; QUARANTINE/REPAIR tăng on_hand và unavailable; SCRAP không nhập lại tồn |
| `return_receipts` | return_item_id:uuid → return_items; warehouse_id:uuid → warehouses; quantity:int; received_by:uuid → users; received_at:ts; tracking_number:s150?; operation_key:s150 | U(operation_key); tổng received <= return_items.quantity; chưa inspection thì hàng ở khu tiếp nhận, chưa vào balance bán |
| `order_links` | source_order_id:uuid → orders; target_order_id:uuid → orders; return_request_id:uuid? → return_requests; kind:state(REPLACEMENT,EXCHANGE); reason:text | U(source_order_id,target_order_id,kind); source != target; đơn thay thế có giá/trách nhiệm thanh toán riêng, không sửa đơn gốc |
| `warranty_policies` **M** | code:s64; name:s150; duration_months:int; starts_on:state(DELIVERED,PURCHASED); terms:text; status:state(ACTIVE,ARCHIVED) | U(code); duration >= 0; terms snapshot tại order item; không suy ra mọi sản phẩm đều có bảo hành |
| `serial_units` **M** | variant_id:uuid → product_variants; serial_number:s150; warehouse_id:uuid? → warehouses; receipt_item_id:uuid? → goods_receipt_items; status:state(IN_STOCK,RESERVED,SOLD,RETURNED,IN_REPAIR,SCRAPPED); current_order_item_id:uuid? → order_items; warranty_start:date?; warranty_end:date? | U(variant_id,serial_number); warranty_end >= start; serial thuộc đúng SKU; tồn số lượng và số serial khớp khi track_serial=true |
| `serial_unit_events` | serial_unit_id:uuid → serial_units; kind:state(RECEIVED,RESERVED,RELEASED,SHIPPED,RETURNED,REPAIRED,REPLACED,SCRAPPED); order_item_id:uuid? → order_items; shipment_item_id:uuid? → shipment_items; return_item_id:uuid? → return_items; actor_id:uuid? → users; operation_key:s150; detail:json? | U(operation_key); lịch sử serial không mất khi đổi current_order_item_id; fulfillment phải ghi đủ serial cho quantity |
| `warranty_claims` **M** | number:s64; serial_unit_id:uuid? → serial_units; order_item_id:uuid → order_items; user_id:uuid → users; quantity:int; issue:text; coverage_snapshot:json; snapshot_version:int; status:state(OPEN,APPROVED,REJECTED,RECEIVED,REPAIRING,RESOLVED,CLOSED); resolution:state(REPAIR,REPLACE,REFUND)?; resolved_at:ts? | U(number); serial nếu có phải từng giao ở order item; không chỉ kiểm tra current owner; không serial vẫn có claim theo order/quantity |
| `warranty_events` | claim_id:uuid → warranty_claims; actor_id:uuid? → users; from_status:s32?; to_status:s32; note:text?; asset_id:uuid? → media_assets; operation_key:s150 | U(operation_key); ghi cùng transaction đổi claim; thay thế/hoàn tiền liên kết order_links/refunds, không tự sinh bằng ghi chú |

Sửa chữa không đồng nghĩa bán một SKU mới. Nếu cần quản lý linh kiện sửa chữa, phí dịch vụ hoặc bảo hành từ nhà sản xuất, bổ sung nghiệp vụ service/RMA riêng sau, không ghi chung movement không có nguồn.

## I. Chứng từ thương mại

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `invoices` **M** | order_id:uuid → orders; number:s64?; status:state(DRAFT,ISSUED,VOID); currency_code:s3 → currencies.code; seller_snapshot:json; buyer_snapshot:json; totals_snapshot:json; snapshot_version:int; total_amount:money; issued_at:ts?; void_reason:text? | Unique number khi có; issued có number/issued_at; không sửa nội dung ISSUED, điều chỉnh bằng credit note; có thể nhiều invoice/order nhưng không invoice trùng quantity |
| `invoice_lines` | invoice_id:uuid → invoices; order_item_id:uuid? → order_items; kind:state(ITEM,SHIPPING); line_number:int; description:text; quantity:int; unit_price:money; discount_amount:money; tax_amount:money; total_amount:money; tax_snapshot:json; snapshot_version:int | U(invoice_id,line_number); ITEM có order item; SHIPPING null; phân bổ theo snapshot order, không lấy giá catalog |
| `credit_notes` | invoice_id:uuid → invoices; refund_id:uuid? → refunds; number:s64; reason:text; currency_code:s3 → currencies.code; amount:money; issued_at:ts; lines_snapshot:json; snapshot_version:int | U(number); amount > 0; sum credit <= invoice total dưới khóa invoice; lines_snapshot có invoice_line_id, qty, net/tax/total và validation. Chứng từ điều chỉnh không phải bằng chứng tiền đã refund |

Đây là chứng từ nội bộ được thiết kế, chưa khẳng định đáp ứng hóa đơn điện tử hoặc yêu cầu pháp lý của bất kỳ thị trường nào. Muốn phát hành chứng từ pháp định cần xác minh quy định và nhà cung cấp tại thời điểm triển khai.

## J. Trải nghiệm khách hàng và nội dung

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `wishlists` **M** | user_id:uuid → users; name:s150; is_default:bool; visibility:state(PRIVATE,PUBLIC); share_token_hash:s128? | Partial U(user_id) WHERE is_default; unique token hash; public chỉ lộ trường cho phép |
| `wishlist_items` | wishlist_id:uuid → wishlists; variant_id:uuid → product_variants | PK(wishlist_id,variant_id); cascade theo wishlist |
| `reviews` **M** | user_id:uuid → users; product_id:uuid → products; order_item_id:uuid → order_items; rating:int; title:s200?; body:text; status:state(PENDING,PUBLISHED,REJECTED,HIDDEN); moderated_by:uuid? → users; moderated_at:ts? | U(user_id,product_id); rating 1..5; verified purchase từ order item thuộc user/product và đã giao, không phải bool client gửi |
| `review_media` | review_id:uuid → reviews; asset_id:uuid → media_assets; sort_order:int | PK(review_id,asset_id); asset READY, ownership và moderation |
| `review_votes` | review_id:uuid → reviews; user_id:uuid → users; helpful:bool | PK(review_id,user_id); chặn tự vote ở service |
| `content_pages` **M** | slug:s180; title:s250; body:json; status:state(DRAFT,PUBLISHED,ARCHIVED); author_id:uuid → users; published_at:ts?; seo_title:s250?; seo_description:s500? | U(slug); body dùng block schema có phiên bản; trang chính sách, giới thiệu, FAQ |
| `articles` **M** | slug:s180; title:s250; excerpt:text?; body:json; cover_asset_id:uuid? → media_assets; author_id:uuid → users; status:state(DRAFT,PUBLISHED,ARCHIVED); published_at:ts?; seo_title:s250?; seo_description:s500? | U(slug); I(status,published_at,id); tin tức/hướng dẫn |
| `banners` **M** | title:s200; asset_id:uuid → media_assets; placement:s64; target_url:s2048?; sort_order:int; starts_at:ts; ends_at:ts?; status:state(DRAFT,ACTIVE,ARCHIVED) | Validate URL scheme/host; end > start; không để raw HTML/script trong link |
| `collections` **M** | slug:s180; title:s200; description:text?; status:state(DRAFT,ACTIVE,ARCHIVED); starts_at:ts?; ends_at:ts? | U(slug); nhóm sản phẩm biên tập trang chủ; không đồng nghĩa promotion |
| `collection_products` | collection_id:uuid → collections; product_id:uuid → products; sort_order:int | PK(collection_id,product_id) |
| `support_tickets` **M** | number:s64; user_id:uuid → users; order_id:uuid? → orders; subject:s250; status:state(OPEN,IN_PROGRESS,WAITING_CUSTOMER,RESOLVED,CLOSED); priority:state(LOW,NORMAL,HIGH); assigned_to:uuid? → users; closed_at:ts? | U(number); order thuộc user; nhân viên phải có quyền support |
| `support_messages` | ticket_id:uuid → support_tickets; author_id:uuid → users; visibility:state(INTERNAL,CUSTOMER); body:text | I(ticket_id,created_at,id); customer không đọc internal |
| `support_attachments` | message_id:uuid → support_messages; asset_id:uuid → media_assets | PK(message_id,asset_id); quyền tải theo ticket/message, không public mặc định |
| `notifications` **M** | user_id:uuid → users; type:s64; title:s200; body:text; resource_type:s64?; resource_id:uuid?; dedupe_key:s200; read_at:ts? | U(user_id,dedupe_key); I(user_id,read_at,created_at,id); resource là navigation metadata, kiểm quyền khi mở |
| `notification_preferences` **M** | user_id:uuid → users; topic:s64; channel:state(IN_APP,EMAIL,SMS); enabled:bool | U(user_id,topic,channel); phân biệt thông báo giao dịch và marketing consent ở policy |
| `notification_deliveries` **M** | notification_id:uuid → notifications; outbox_event_id:uuid → outbox_events; channel:state(IN_APP,EMAIL,SMS); recipient_encrypted:text; template_code:s100; template_version:int; status:state(PENDING,SENDING,SENT,FAILED,UNKNOWN); attempts:int DEFAULT 0; provider_message_id:s255?; idempotency_key:s150; sent_at:ts?; last_error_code:s100? | U(idempotency_key); I(status,created_at); recipient mã hóa ở app với key bên ngoài DB; không nhận callback delivery là bằng chứng thanh toán |

## K. Độ tin cậy, audit và cấu hình

| Bảng | Cột nghiệp vụ | Khóa và quy tắc |
| --- | --- | --- |
| `idempotency_keys` **M** | actor_scope:s150; operation:s100; key:s150; request_hash:s128; status:state(IN_PROGRESS,SUCCEEDED,FAILED); resource_type:s64?; resource_id:uuid?; response_code:int?; response_redacted:json?; lease_until:ts?; expires_at:ts | U(actor_scope,operation,key); cùng key khác hash trả conflict; resource link tới kết quả đã commit; expiry không xóa chống lặp của financial operation |
| `outbox_events` **M** | aggregate_type:s64; aggregate_id:uuid; event_type:s100; schema_version:int; payload:json; dedupe_key:s200; status:state(PENDING,PROCESSING,PUBLISHED,RETRY,DEAD); attempts:int DEFAULT 0; available_at:ts; lease_until:ts?; published_at:ts?; last_error_code:s100? | U(dedupe_key); I(status,available_at); insert cùng transaction nghiệp vụ; payload chủ yếu ID, tránh PII; consumer dedupe bằng operation key |
| `audit_logs` | actor_id:uuid? → users; actor_type:state(USER,SYSTEM,PROVIDER); action:s100; entity_type:s64; entity_id:s150; request_id:s100?; before_redacted:json?; after_redacted:json?; reason:text?; ip_hash:s128? | I(entity_type,entity_id,created_at,id), I(actor_id,created_at); append-only, không ghi password/token/payment secret; không dùng audit thay movement/transaction |
| `store_settings` **M** | key:s100; value:json; schema_version:int; changed_by:uuid → users; description:text | U(key); allowlist key và validation schema; cấu hình currency/TTL/shop contact; không lưu secret; đổi config không sửa snapshot cũ |

## L. Ràng buộc xuyên bảng phải triển khai

Các quy tắc sau không được coi là đã bảo đảm chỉ vì có FK đơn:

| Ràng buộc | Cách đảm bảo khi cài đặt |
| --- | --- |
| Option value thuộc option, option thuộc product của variant | FK ghép cho value/option; service khóa product khi sửa tập option; publish kiểm đủ lựa chọn và signature |
| Media variant thuộc product | FK ghép `(variant_id,product_id)` tới unique tương ứng |
| Refund/item, shipment/item, return/item cùng order | Load qua parent đã kiểm quyền và khóa item/payment; FK ghép nơi hợp lý |
| Currency cùng order/payment/attempt/refund/transaction | FK ghép hoặc transaction service kiểm currency của parent bất biến; không nhận currency tùy ý từ request |
| Mọi item có quantity > 0, totals không âm | CHECK tại DB; validation DTO chỉ là tầng đầu |
| Mỗi order mới có item, địa chỉ và tổng đúng | Tạo nguyên tử trong transaction; không expose CRUD rời cho các bảng chứng từ |
| Tổng reserved = tổng reservation ACTIVE/COMMITTED | Khóa balance, cập nhật reservation + movement + balance cùng transaction; đối soát định kỳ |
| Số dư = tổng các movement từ OPENING | Không có stock ngoài ledger; migrate stock hiện tại bằng opening movement |
| Refund quantity/amount không vượt phần đã trả | Khóa payment và các item; đếm cả refund đang xử lý/UNKNOWN; tách hoàn giá một phần khỏi hoàn quantity |
| Tổng hàng giao/trả/nhận PO/chuyển kho không vượt chứng từ | Khóa dòng nguồn, cộng allocation đã có hiệu lực, unique operation key; không chỉ kiểm tra trước transaction |
| Hóa đơn/credit không ghi trùng số tiền, số lượng | Khóa order/invoice khi phân bổ; nguồn allocation từ snapshot; không tính lại từ catalog |
| Serial không gán cho hai shipment hiện hành | Khóa serial unit, chuyển status có điều kiện và ghi serial event; count serial bằng quantity |
| Không sửa/xóa ledger hoặc snapshot đã chốt | Quyền DB theo môi trường, command service, audit; thiết kế migration/repair riêng có truy vết |

Các index có điều kiện, biểu thức, CHECK nâng cao và FK ghép cần được thể hiện trong SQL migration thực tế và kiểm tra trên PostgreSQL test. Không giả định khai báo Prisma đơn giản đã bao phủ tất cả các quy tắc này.
