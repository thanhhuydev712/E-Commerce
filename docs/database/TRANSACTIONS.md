# Luồng nghiệp vụ, transaction và tính nhất quán

Ngày **05/11/2026** — thiết kế đề xuất, chưa được cài đặt hoặc chạy test. Các SQL dưới đây là **đoạn minh họa cho schema đích**, không chạy trực tiếp trên schema hiện tại. Tên bảng/cột theo [DATA_DICTIONARY.md](DATA_DICTIONARY.md).

## 1. Tiền và giá

### Nguồn dữ liệu

Client gửi `variantId`, `quantity`, `addressId`, `shippingMethodId`, `couponCode` và idempotency key. Server xác thực ownership, đọc giá theo currency của cart, kiểm product/variant active, kiểm coupon, tính shipping và thuế. Không dùng `price`, `discount`, `amount`, `tax` hoặc `paymentStatus` do client truyền làm nguồn quyết định.

Checkout snapshot dùng để trình bày và phát hiện thay đổi, không thay thế lần xác minh khi tạo order. Giá/điều kiện thay đổi làm quote không còn đúng thì trả lỗi yêu cầu xác nhận quote mới, không âm thầm tăng tiền khách trả.

### Công thức

Tất cả amount theo minor units; dùng BigInt hoặc decimal arithmetic có kiểm soát khi nhân tỷ lệ. Mặc định thiết kế là giá chưa gồm thuế. Một dòng thuế dùng `round_half_up(taxable_amount × rate)` cho amount không âm; các dòng thuế cộng riêng, không compound trừ khi sau này có policy rõ.

```text
item.line_subtotal = unit_price × quantity
item.line_total    = line_subtotal - discount_amount + tax_amount

order.subtotal       = Σ item.line_subtotal
order.discount_total = Σ item.discount_amount + shipping_discount
order.shipping_total = phí ship trước giảm, chưa gồm thuế
order.tax_total      = Σ item.tax_amount + shipping_tax
order.grand_total    = subtotal - discount_total + shipping_total + tax_total
                     = Σ item.line_total
                       + shipping_total - shipping_discount + shipping_tax
```

`order_discounts` là bản phân bổ/giải thích `discount_total`, không cộng trừ một lần nữa. Shipping discount không lớn hơn shipping_total; discount dòng không lớn hơn line_subtotal. Thuế tính trên phần sau giảm. Giá trị 0 ở thuế phải có lý do/policy trong pricing snapshot; không mặc định tax_class null nghĩa miễn thuế.

Giảm toàn đơn được phân bổ theo tỷ trọng giá trị các dòng đủ điều kiện: lấy phần nguyên trước, sau đó chia phần dư từng minor unit theo thứ tự phần lẻ giảm dần, hòa thì theo line_number. Lưu kết quả, không tính lại trong refund. Cùng input và policy version phải ra cùng kết quả.

Ví dụ số nguyên: hai dòng 10.000 và 20.000, giảm 1.000 thì phân bổ 333 và 667; không chia thành 333,33/666,67. Ví dụ chỉ minh họa làm tròn, không quyết định currency bán chính.

Đối với một dòng quantity > 1, khi hoàn theo số lượng, tiếp tục phân bổ discount/tax đã chốt thành các phần đơn vị bằng cùng thuật toán. Mỗi lần refund giữ hạn mức phần đơn vị chưa refund dưới khóa item. Khoản GOODWILL không tăng hạn mức hoàn vượt tiền đã capture.

### Các bất biến tiền

- Amount của payment bằng grand_total lúc chốt đơn. Sau đó không sửa số tiền gốc để khớp một request mới.
- Tổng capture đã xác nhận không vượt số phải thu trong luồng bình thường. Nếu bên ngoài thật sự thu hai lần, ghi nhận cả hai, tạo issue và quy trình hoàn thừa; không bỏ giao dịch thứ hai vì vi phạm giả định.
- Tổng refund SUCCEEDED cộng APPROVED/PROCESSING/UNKNOWN không vượt captured amount có thể hoàn. REQUESTED chưa duyệt không chiếm hạn mức; lúc duyệt phải kiểm lại.
- Chargeback không phải refund do cửa hàng phát hành; ghi ledger riêng và đóng băng quyết định hoàn liên quan cho tới đối soát. Không cho refund một khoản đã chargeback mà không có policy.
- Payment zero amount: không gọi provider. Xác nhận đơn bằng sự kiện nội bộ có operation key và audit, payment có amount_due=0 và PAID; stock vẫn theo luồng giữ/giao bình thường.

## 2. Giỏ hàng, phiên và ownership

Guest có token ngẫu nhiên trong cookie; DB chỉ lưu hash. Giỏ guest không đồng nghĩa khách có quyền xem đơn. Đăng nhập hợp nhất hai giỏ trong transaction: khóa cả hai theo thứ tự id, gộp quantity theo variant, kiểm currency và giới hạn số lượng, chuyển giỏ nguồn ABANDONED, tăng version giỏ đích. Không tự chuyển giá trị giữa hai currency.

Một user chỉ có một cart ACTIVE nhờ partial unique. Request tạo đồng thời bắt unique conflict rồi đọc lại giỏ; không dựa hoàn toàn vào `findFirst` trước `create`. Mọi thay đổi item tăng cart.version. Checkout dựa vào version và hash quote; hai quote khác nhau không được chuyển cùng một cart thành hai đơn.

Refresh token chứa session identifier đã ký; server kiểm session/family, hash và expiry. Rotate bằng compare-and-set dưới transaction, lưu previous hash để nhận diện reuse gần nhất; token cũ hơn vẫn được nhận diện là sai current token qua session id và bị thu hồi family theo policy. Không cung cấp endpoint public tra session id. Đổi mật khẩu/reset/logout cập nhật session và audit. Chốt chính sách xử lý hai refresh đồng thời để không vô tình revoke phiên hợp lệ; lần đầu có thể chọn client chỉ có một refresh đang chạy và không có grace window.

API luôn query theo `resource.id` **và** owner hoặc permission đã xác thực. FK `user_id` không thay thế kiểm quyền. Admin tạo đơn thay khách cũng phải có permission riêng và actor audit; không đổi owner theo body request từ customer.

## 3. Tạo đơn và giữ tồn

Thứ tự khóa chung: idempotency → cart/checkout → các khóa promotion theo id → order/payment nếu đã có → order items theo id → balances theo `(warehouse_id,variant_id)` → reservations/serial. Các command trong cùng miền giữ cùng thứ tự; deadlock/serialization conflict được retry có giới hạn với cùng operation key, không gọi provider bên trong callback transaction.

1. Claim idempotency key `(user,create_order,key)` và request hash. Khác hash trả 409; key đã thành công trả lại order cũ; đang chạy trả pending/conflict theo contract.
2. Khóa checkout và cart. Kiểm user, OPEN, expiry, version và cart ACTIVE. Validate lại catalog/pricing snapshot; nếu khác thì rollback để lấy quote mới.
3. Khóa promotion/coupon theo thứ tự; đếm lượt RESERVED/APPLIED còn hiệu lực; tạo reservation lượt dùng trong transaction.
4. Chọn kho và khóa balance theo thứ tự cố định. Giữ đủ số lượng cho toàn đơn bằng update có điều kiện. Nếu một dòng thiếu, rollback toàn bộ. Chia một dòng qua nhiều kho bằng nhiều reservation nếu policy cho phép.
5. Tạo order PENDING_PAYMENT, items/addresses/taxes/discount snapshot; reservations ACTIVE có deadline; ledger RESERVE; history; outbox.
6. Chuyển checkout CONVERTED và cart CONVERTED **ngay khi order được tạo**, không chờ payment; tránh mua lại cùng cart khi payment pending. Khách mua tiếp có cart ACTIVE mới. Không tự đưa hàng lại giỏ khi đơn hết hạn.
7. Mark idempotency SUCCEEDED kèm order id trong cùng transaction nghiệp vụ. Nếu crash trước commit, mọi hiệu ứng cùng rollback; nếu crash sau commit, retry tìm lại kết quả.

Tạo payment attempt là bước tiếp theo, tách giao dịch database khỏi HTTP call tới provider.

```sql
-- Trong transaction, sau khi đã xác định đúng balance và quantity > 0:
UPDATE inventory_balances
SET reserved = reserved + :quantity,
    version = version + 1,
    updated_at = now()
WHERE id = :balance_id
  AND on_hand - reserved - unavailable >= :quantity
RETURNING id;
-- Không có dòng trả về: thiếu hàng, rollback toàn đơn.
-- Cùng transaction phải INSERT reservation và movement RESERVE có key unique.
```

Balance CHECK `reserved + unavailable <= on_hand` là lớp bảo vệ DB bổ sung. Không dùng `SELECT stock` ngoài transaction rồi decrement mù.

## 4. Tồn kho theo sự kiện

| Sự kiện | on_hand delta | reserved delta | unavailable delta | Điều kiện |
| --- | --- | --- | --- | --- |
| Nhập hàng đạt | +q | 0 | 0 | Receipt POSTED đúng một lần |
| Giữ cho đơn | 0 | +q | 0 | Available >= q |
| Thanh toán thành công | 0 | 0 | 0 | ACTIVE → COMMITTED, bỏ expires_at |
| Hủy/hết hạn trước giao | 0 | -q | 0 | ACTIVE/COMMITTED → RELEASED/EXPIRED đúng một lần |
| Xuất giao | -q | -q | 0 | COMMITTED → CONSUMED; COD dùng policy xác nhận riêng |
| Trả hàng tốt sau kiểm | +q | 0 | 0 | Inspection RESTOCK chưa ghi sổ |
| Trả hàng lỗi, cần sửa | +q | 0 | +q | Inspection QUARANTINE/REPAIR chưa ghi sổ |
| Giải phóng hàng cách ly | 0 | 0 | -q | Có quyết định kiểm tra và operation key |
| Hủy hàng cách ly | -q | 0 | -q | Có audit và quyền adjustment |
| Chuyển kho đi | -q | 0 | 0 | Chỉ lấy available; transfer DISPATCHED |
| Chuyển kho đến | +q | 0 | 0 | Nhận thực tế; không tăng trước lúc nhận |

Payment commit không đổi số dư nên không tạo movement delta 0; thay đổi status reservation có audit/order event. Mỗi mutation số dư có movement khác 0. Operation key gồm document + line + loại thao tác + số lần nhận hợp lệ, không dùng random mới mỗi lần retry.

Giao một phần phải tách reservation COMMITTED q thành hai reservation tổng q trong transaction dưới khóa balance/item; không thay reserved tổng. Hai nhánh dùng key xác định, nhánh đem giao được consume đúng một lần. Nếu thiếu serial hoặc khác kho, rollback đóng kiện.

Worker đối soát kiểm `balance = SUM(movement.delta)` từng cột và `reserved = SUM(quantity WHERE ACTIVE/COMMITTED)`. Có chênh lệch thì chặn thao tác liên quan, tạo issue/audit và điều tra; không tự ghi đè ledger để làm số khớp.

## 5. Thanh toán, webhook và lỗi mạng

### Tạo attempt

1. Khóa order/payment, kiểm ownership, đơn chưa cancel/expire và chưa đủ tiền. Lấy amount/currency từ order.
2. Tạo/reuse attempt với provider idempotency key bền vững, commit. Partial unique chặn nhiều attempt đang CREATED/PENDING/UNKNOWN trên cùng payment.
3. Gọi provider ngoài transaction DB. Timeout là UNKNOWN; không tạo attempt mới để thử lại ngay. Retry cùng provider key hoặc retrieve object cũ.
4. Lưu provider_intent_id và trạng thái sau khi khóa parent. Nếu webhook tới trước HTTP response, consumer nối bằng metadata attempt/payment đã tồn tại và xác minh account/mode/amount/currency; response không ghi lùi trạng thái.
5. Payment intent secret chỉ trả qua response cần thiết cho user sở hữu, không lưu trong ledger, audit hoặc outbox.

### Nhận webhook

Endpoint dùng raw body xác minh chữ ký trước parse nghiệp vụ và trước persist. Sai signature không tạo provider event. Event hợp lệ insert inbox theo `(provider,account,mode,event_id)`; conflict được acknowledge theo contract provider. Acknowledge chỉ sau khi event đã được lưu bền vững hoặc xử lý thành công; nếu DB không lưu được thì trả lỗi để provider retry.

Consumer claim event bằng lease. Trong transaction, khóa event/order/payment và balance cần thiết, kiểm object linkage, amount, currency, account, mode; insert payment transaction unique; đổi projection, order/reservation, redemption, history và outbox rồi mark event PROCESSED. Nếu nghiệp vụ fail, rollback mọi thay đổi và đặt retry ở transaction riêng. Không đánh dấu event xong trước khi các hiệu ứng commit.

Event đến sai thứ tự không được ghi lùi SUCCEEDED thành PENDING. Trường hợp không đủ thông tin cần retrieve object provider ngoài transaction và xác minh lại dưới khóa khi áp dụng; provider event time không phải khóa sắp xếp duy nhất.

### Hết hạn giữ tồn và payment đến muộn

Worker khóa order/payment rồi item/balance trước khi EXPIRE. Nếu tiền đã capture thì không release như đơn chưa trả. Hủy attempt phía provider thực hiện ngoài transaction bằng outbox và có đối soát.

Nếu expiry commit trước webhook capture, đơn giữ EXPIRED, ledger vẫn ghi khoản capture thực tế. **Mặc định đề xuất: không tự phục hồi đơn và giữ hàng lại**, tạo refund toàn phần tự động qua quy trình refund, thông báo khách và reconciliation issue nếu hoàn lỗi. Capture đến sau CANCELLED xử lý cùng nguyên tắc; không đổi lại thành CONFIRMED. Nhờ vậy không bán lại hàng đã được khách khác giữ. Webhook và expiry/cancel cạnh tranh cùng khóa nên chỉ một nhánh thắng; nhánh đến sau xử lý trạng thái mới.

### COD và chuyển khoản

Lần triển khai đầu chỉ enable phương thức thật sự được tích hợp. COD, nếu mở sau, cho CONFIRMED/COMMITTED khi chấp nhận đơn dù chưa PAID; thu tiền chỉ ghi CAPTURE khi có xác nhận đối soát từ hãng hoặc nhân viên có quyền kèm bằng chứng. Đơn giao rồi nhưng chưa chuyển tiền COD phải hiển thị công nợ thu hộ theo projection riêng, không đánh đồng DELIVERED với PAID.

## 6. Trạng thái và command

### Order

| Từ | Đến | Command/điều kiện |
| --- | --- | --- |
| Tạo | PENDING_PAYMENT | Snapshot và reservation commit thành công |
| PENDING_PAYMENT | CONFIRMED | Payment đủ hoặc free order; COD chỉ khi đã enable policy |
| PENDING_PAYMENT | CANCELLED / EXPIRED | Khóa kiểm tra; release tồn/lượt dùng; chưa ghi nhận capture |
| CONFIRMED | PROCESSING | Bắt đầu chuẩn bị hàng |
| CONFIRMED / PROCESSING | CANCELLED | Chưa SHIPPED bất kỳ phần nào; release phần giữ; nếu đã thu tiền tạo refund request |
| PROCESSING | COMPLETED | Toàn bộ quantity đã giao thành công, điều kiện thu tiền theo policy đạt |

Đơn CANCELLED vẫn có thể đang chờ refund. COMPLETED vẫn có thể phát sinh return/claim. Không mở lại order status để biểu diễn refund. Hủy một phần dòng sau giao chưa thuộc lõi đầu tiên; phần đã giao dùng return, phần chưa giao muốn hủy cần bổ sung cancellation allocation rõ ràng, không giảm quantity gốc.

### Payment, attempt, refund

- Payment: UNPAID → PENDING → PAID → PARTIALLY_REFUNDED → REFUNDED. Khi mọi attempt thất bại và chưa capture, PENDING có thể về UNPAID. Projection từ ledger thành công, không nhận status tùy ý.
- Attempt: CREATED → PENDING hoặc UNKNOWN → SUCCEEDED/FAILED/CANCELLED; UNKNOWN phải đối soát trước attempt mới. Thông tin provider terminal đã xác nhận không bị response cũ ghi lùi. Capture trễ trên attempt bị cancel vẫn ghi ledger và xử lý ngoại lệ.
- Refund: REQUESTED → APPROVED → PROCESSING → SUCCEEDED; REQUESTED/APPROVED có thể CANCELLED khi chưa gửi; PROCESSING → UNKNOWN nếu không rõ kết quả, hoặc FAILED khi provider xác nhận thất bại. FAILED được retry với **cùng refund id/key**, cần chiếm lại hạn mức dưới khóa; UNKNOWN không giải phóng hạn mức.
- Ledger chỉ append các CAPTURE/REFUND/CHARGEBACK đã xác nhận; các lần gọi thất bại nằm trên attempt/refund/provider event. Một provider object thành công chỉ có một transaction nhờ unique external id theo scope.

### Shipment và return

Shipment DRAFT → READY → SHIPPED → DELIVERED. DRAFT/READY có thể CANCELLED; SHIPPED có thể FAILED, rồi giao lại bằng sự kiện vận chuyển hợp lệ hoặc RETURNED. DELIVERED muốn khách trả thì mở return request riêng. Hàng giao thất bại vẫn đang ở bên vận chuyển; không tự tăng tồn tới khi kho nhận và kiểm tra.

Return REQUESTED → APPROVED → RECEIVED → INSPECTED → CLOSED; có REJECTED/CANCELLED trước nhận. Nhiều receipt/inspection được phép, header chỉ tiến khi đủ quantity. Partial nhận trả giữ trạng thái APPROVED và UI dùng số lượng projection. Refund có thể xảy ra trước khi đủ kiểm tra nếu policy được duyệt, nhưng không tự nhập lại tồn.

## 7. Refund một phần, đổi trả và bảo hành

Tạo refund kiểm tra payment thuộc order, quyền/ownership và từng allocation cùng order. Duyệt refund khóa payment rồi item, tính hạn mức từ snapshot sau giảm, số tiền đã refund và các refund đang giữ hạn mức. Ghi APPROVED cùng allocations và outbox trước khi gọi provider.

```text
refundable_money = confirmed_capture
                 - succeeded_refunds
                 - approved_processing_unknown_refunds
```

Tax trong refund allocation là một phần amount, không cộng thêm lần nữa. GOODWILL không gắn quantity; ITEM hoàn một phần giá quantity null phải trừ tiền còn có thể refund ở item, không chiếm thêm số lượng hàng trả. Ghi rõ policy số lượng để lần hoàn hàng sau không hoàn lại khoản giảm giá đã bù.

Callback refund thành công insert REFUND transaction với external id unique, cập nhật refund/payment và phát outbox trong một transaction. Provider success nhưng DB fail thì retry/reconciliation phục hồi cùng refund, không tạo refund mới. Giữ nguyên sự thật về tiền kể cả đơn đã đóng.

Return receipt ghi việc kho thực nhận. Inspection chỉ restock phần đã nhận và chưa xử lý; operation key unique chặn nhân viên bấm hai lần. Hàng lỗi được quarantine; quyết định scrap/repair tạo movement và serial event riêng.

Đổi hàng không sửa SKU/quantity của order cũ: nhận lại qua return, tạo order mới liên kết EXCHANGE/REPLACEMENT. Chênh lệch giá có thanh toán/refund riêng; claim bảo hành tham chiếu lần bán gốc và coverage snapshot. Mô hình hiện chưa có dòng bù trừ kế toán giữa hai order, cần workflow cụ thể trước khi tự động hóa đổi có chênh lệch.

## 8. PO, nhập, chuyển và kiểm kho

PO approved chỉ là cam kết mua. Goods receipt POSTED mới tạo movement RECEIPT tăng stock accepted. Khóa PO item trước cộng accepted đã POSTED để không vượt quantity. Receipt reverse chỉ được khi có thể đảo tồn an toàn; nếu hàng đã giữ/giao thì cần nghiệp vụ điều chỉnh/hoàn nhà cung cấp riêng, không xóa receipt gốc.

Transfer dispatch chỉ lấy available, trừ kho nguồn và ghi thời điểm vận chuyển. Các lần nhận tăng kho đích theo quantity thực, khóa transfer item và dùng key mỗi receipt; tổng received + lost <= dispatched. Hàng đang đi đường suy từ quantity - received - lost. Lost có reason và audit, không tự nhập đủ cho đẹp số.

Stock count chụp số kỳ vọng và balance.version tại mốc kiểm. Approve nếu version thay đổi phải đối chiếu movement/đếm lại. Adjustment không đưa on_hand dưới reserved + unavailable; cần xử lý reservation hoặc xác nhận thiếu hàng trước. Không cho một PATCH stock trực tiếp bỏ qua chứng từ.

## 9. Index và SQL ràng buộc quan trọng

Các đoạn này bổ sung cho từ điển dữ liệu; khi có Prisma migration phải review SQL thật, thêm preflight kiểm dữ liệu và chạy trên DB test.

```sql
CREATE UNIQUE INDEX users_email_normalized_uq ON users (lower(email));

CREATE UNIQUE INDEX carts_active_user_uq ON carts (user_id)
WHERE status = 'ACTIVE' AND user_id IS NOT NULL;

CREATE UNIQUE INDEX carts_active_guest_uq ON carts (guest_token_hash)
WHERE status = 'ACTIVE' AND guest_token_hash IS NOT NULL;

CREATE UNIQUE INDEX addresses_default_shipping_uq ON addresses (user_id)
WHERE is_default_shipping AND archived_at IS NULL;

CREATE UNIQUE INDEX addresses_default_billing_uq ON addresses (user_id)
WHERE is_default_billing AND archived_at IS NULL;

CREATE UNIQUE INDEX product_primary_category_uq
ON product_categories (product_id) WHERE is_primary;

CREATE UNIQUE INDEX product_primary_media_uq
ON product_media (product_id) WHERE is_primary AND variant_id IS NULL;

CREATE UNIQUE INDEX variant_primary_media_uq
ON product_media (variant_id) WHERE is_primary AND variant_id IS NOT NULL;

CREATE UNIQUE INDEX payment_attempt_active_uq ON payment_attempts (payment_id)
WHERE status IN ('CREATED', 'PENDING', 'UNKNOWN');

ALTER TABLE inventory_balances ADD CONSTRAINT inventory_nonnegative
CHECK (on_hand >= 0 AND reserved >= 0 AND unavailable >= 0
       AND reserved + unavailable <= on_hand);

ALTER TABLE carts ADD CONSTRAINT cart_owner_exactly_one
CHECK ((user_id IS NOT NULL) <> (guest_token_hash IS NOT NULL));

ALTER TABLE orders ADD CONSTRAINT order_totals_consistent
CHECK (subtotal >= 0 AND discount_total >= 0 AND shipping_total >= 0
       AND tax_total >= 0 AND grand_total >= 0
       AND discount_total <= subtotal + shipping_total
       AND grand_total = subtotal - discount_total + shipping_total + tax_total);

ALTER TABLE order_items ADD CONSTRAINT order_item_totals_consistent
CHECK (quantity > 0 AND unit_price >= 0 AND discount_amount >= 0
       AND tax_amount >= 0 AND discount_amount <= line_subtotal
       AND line_subtotal = unit_price * quantity
       AND line_total = line_subtotal - discount_amount + tax_amount);

CREATE INDEX orders_customer_history_idx ON orders (user_id, placed_at DESC, id DESC);
CREATE INDEX reservation_expiry_idx ON stock_reservations (expires_at, id)
WHERE status = 'ACTIVE';
CREATE INDEX outbox_due_idx ON outbox_events (available_at, id)
WHERE status IN ('PENDING', 'RETRY');
```

Partial unique chỉ bảo đảm **tối đa** một bản ghi, không bảo đảm có ít nhất một. Publish product/default address cần transaction service. Các CHECK không thể tự xác nhận SUM ở nhiều dòng; dùng khóa parent và command nguyên tử, integration test bắt buộc.

Tìm tên sản phẩm ban đầu dùng query có pagination và dữ liệu nhỏ; đo query plan trước khi thêm full-text/trigram/search engine. Dashboard doanh thu lấy capture trừ refund theo currency/timezone báo cáo, tách chargeback; không cộng USD với VND hoặc lấy tổng tất cả order kể cả hủy.

## 10. Worker, bảo mật và vận hành dữ liệu

Outbox/inbox worker claim nhóm nhỏ bằng `FOR UPDATE SKIP LOCKED`, cập nhật lease rồi commit trước gọi mạng. Worker chết thì lease hết hạn cho phép retry. Không giữ transaction DB trong khi gửi email/gọi provider. Mark processed chỉ sau hiệu ứng bền vững; consumer cần dedupe vì crash sau gửi nhưng trước mark vẫn có thể gửi lại. Với email provider không hỗ trợ idempotency, ghi rõ giới hạn có thể gửi trùng, không tuyên bố exactly-once.

Retry exponential backoff có jitter và giới hạn; DEAD có giao diện/routine replay được phân quyền, cùng operation key. Pending/UNKNOWN tài chính phải có cảnh báo và đối soát theo khoảng thời gian chồng nhau. Không xóa chống lặp provider transaction, refund và movement khi dọn idempotency cache.

DB role của ứng dụng chỉ có quyền cần thiết; tài khoản migration tách riêng. API không expose ledger CRUD. PII ở addresses/order/support/recipient chỉ trả theo nhu cầu, log redact; marketing consent không suy từ mua hàng. Cấu hình secret ở environment/secret manager, không store_settings. Token có TTL và hash; recipient nhạy cảm mã hóa với key ngoài DB.

Retention phải có bảng chính sách cho từng loại dữ liệu: session/challenge hết hạn, guest cart bỏ quên, quote hết hạn, raw event đã redact, log/audit và chứng từ. Giao dịch phải giữ dedupe key đủ vòng đời retry/đối soát. Chỉ partition/archive khi số liệu cho thấy cần; chưa chọn TTL pháp lý cho chứng từ.

Backup định kỳ và PITR nếu hạ tầng hỗ trợ cần được diễn tập restore trên môi trường tách biệt. Chọn RPO/RTO (mức mất dữ liệu/thời gian khôi phục chấp nhận được) theo nhu cầu vận hành; không tự khẳng định đã có vì có schema. Kiểm tra referential integrity, tổng tiền/tồn, outbox pending và provider reconciliation sau restore trước mở lại checkout.
