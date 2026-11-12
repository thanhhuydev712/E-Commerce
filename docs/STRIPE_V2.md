# Stripe Checkout v2 — sandbox

Ngày 08/11/2026. Luồng thẻ sử dụng Stripe Checkout dạng trang riêng; SDK Stripe đã có trong backend. Không cần publishable key hoặc thư viện Stripe.js ở frontend cho phương án này. Chỉ hỗ trợ sandbox, không bật live key.

## Cấu hình local

Trong `api/.env`, giữ các biến hiện hữu và bổ sung:

```dotenv
STRIPE_SECRET_KEY=sk_test_GIA_TRI_RIENG
STRIPE_WEBHOOK_SECRET=whsec_GIA_TRI_RIENG
STOREFRONT_URL=http://localhost:3000
```

`STOREFRONT_URL` là origin chính xác, cũng phải nằm trong `ALLOWED_ORIGINS`. Nếu bỏ trống, dùng origin đầu tiên trong danh sách. Không đặt secret trong `NEXT_PUBLIC_*`, tài liệu hoặc Git. `whsec_` khi thử bằng CLI phải lấy từ chính listener của CLI; secret của endpoint Dashboard là secret khác.

Terminal riêng:

```powershell
stripe login
stripe listen --events checkout.session.completed,checkout.session.expired --forward-to http://localhost:3001/api/v1/webhooks/stripe
```

Chọn cùng sandbox với API key. Nếu secret listener khác cấu hình đang có, cập nhật `api/.env`, rồi khởi động lại Nest. Giữ terminal listener chạy khi thử webhook. Khởi động backend/frontend bằng lệnh development hiện có; không cần migration mới cho tính năng này.

## Thử qua giao diện

1. Đăng nhập tài khoản thử nghiệm, thêm hàng và mở checkout.
2. Điền thông tin giả hợp lệ để nhận báo giá. Nếu hai secret đã có, báo giá cho phép COD và Stripe test.
3. Chọn Stripe, tạo đơn. Đơn ở `PENDING_PAYMENT`, giữ tồn `ACTIVE`, hạn một giờ.
4. Trang kết quả có nút **Tiếp tục thanh toán Stripe test**; bấm để sang trang Stripe.
5. Dùng thẻ thử nghiệm `4242 4242 4242 4242`, ngày hết hạn trong tương lai và CVC ba chữ số. Không nhập thẻ thật. Nguồn: [Stripe testing](https://docs.stripe.com/testing).
6. Sau thanh toán, quay lại website. Backend xác minh webhook trước khi ghi CAPTURE, cập nhật PAID/CONFIRMED và chuyển giữ tồn sang COMMITTED. Trang kết quả tự tải lại khi còn chờ; có nút cập nhật thủ công.

Thử đóng/quay lại từ Stripe: URL quay lại không tự hủy đơn hoặc xác nhận đã trả tiền. Có thể tiếp tục trên cùng đơn. Muốn hủy, mở chi tiết đơn và bấm hủy; backend đóng Session ở Stripe trước khi nhả tồn. Đơn đã trả tiền yêu cầu quy trình hoàn tiền riêng.

## Contract và dữ liệu

| API dưới `/api/v1` | Hành vi |
| --- | --- |
| `POST /me/checkout/quote` | `methods` cho biết các phương thức đã cấu hình; tiền VND nguyên |
| `POST /me/orders` | `method: COD/STRIPE`, cần `Idempotency-Key`; giá và tồn lấy lại từ DB |
| `POST /me/orders/:id/stripe-checkout` | Có Bearer và ownership; trả `{url,orderId}`. Gọi lại tái sử dụng attempt/Session; `url=null` khi đã đóng và đã đồng bộ trạng thái |
| `POST /webhooks/stripe` | Không dùng JWT; kiểm `Stripe-Signature` trên raw body; xử lý completed/expired |
| `GET /me/orders/:id` | Thêm `paymentMethod`, `paymentStatus`, `paymentDeadline`, `canPay`; không trả client secret |
| `POST /me/orders/:id/cancel` | Stripe Session phải hết hạn ở provider trước khi giải phóng tồn |

Provider call nằm ngoài transaction DB. Attempt và provider idempotency key được lưu trước khi gọi mạng; lỗi không rõ kết quả giữ UNKNOWN và retry cùng key. URL thanh toán không lưu trong ledger/audit/inbox. Chỉ lưu Session ID và origin cấu hình trong bản ghi idempotency.

Webhook khóa event rồi user; tạo inbox, ghi ledger và cập nhật order/reservation/notification/audit cùng transaction. Event ID và provider intent có unique key riêng nên event lặp hoặc hai event cho cùng khoản thu không ghi tiền hai lần. Sai amount/currency/metadata/Session được cách ly thành DEAD. Sai chữ ký không tạo inbox; lỗi DB trả lỗi để Stripe retry. Sự kiện không thuộc ứng dụng hoặc loại không xử lý được acknowledge và bỏ qua.

Tiền VND không nhân 100. Checkout chỉ mở thẻ, một dòng tổng tiền từ snapshot đơn bao gồm giảm giá/phí; chi tiết từng sản phẩm vẫn nằm trên đơn nội bộ. Adapter tắt Adaptive Pricing, automatic tax và promotion codes phía Stripe để giữ đúng giá/tiền tệ do server chốt. Nguồn tham khảo: [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create), [currencies](https://docs.stripe.com/currencies), [Adaptive Pricing](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing), [Nest raw body](https://docs.nestjs.com/faq/raw-body).

## Phục hồi và giới hạn

- Khi Nest chạy với cấu hình Stripe và `NODE_ENV` khác test, mỗi phút quét tối đa 20 đơn chờ đã tạo hơn một phút, retrieve Session để phục hồi webhook bị lỡ. Worker không phụ thuộc browser; restart xong tiếp tục đọc dữ liệu bền vững. Chưa có trang vận hành/replay/alarms cho DEAD/UNKNOWN.
- Session hết hạn hoặc đơn hết hạn chưa mở Session được giải phóng tồn đúng một lần. Một đơn không có attempt mà còn dưới 31 phút sẽ không tạo Session mới vì Stripe yêu cầu ít nhất 30 phút; khách hủy và đặt lại. Khi provider không xác nhận được kết quả, giữ tồn chờ đối soát thay vì tự giải phóng.
- UNKNOWN không có Session ID chỉ được retry create cùng key tối đa 23 giờ; sau đó cần đối soát thủ công, tránh tạo khoản thu mới khi Stripe có thể đã hết thời gian giữ idempotency key.
- Nếu capture đến sau CANCELLED/EXPIRED, vẫn ghi tiền thực thu, không phục hồi đơn hoặc giữ lại hàng. Tạo Refund REQUESTED và thông báo yêu cầu kiểm tra. **Chưa tự gọi API hoàn tiền**, chưa có màn hình duyệt/đối soát hoàn tiền; đây không phải luồng refund hoàn chỉnh.
- Đơn đã thanh toán vẫn chưa có giao vận/xuất kho/đối soát COD. Không suy ra production/Nginx/AWS hoạt động từ kiểm thử local.

## Kiểm tra

Trong `api/`:

```powershell
npm.cmd run prisma:generate
npm.cmd run build
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e:isolated -- test/stripe.e2e-spec.ts --reporter=verbose
```

E2E tạo và dọn schema `codex_stripe_test_<uuid>` cùng media riêng, dùng PostgreSQL thật, chữ ký webhook thật với secret fixture và provider giả lập. Không gọi Stripe thật hoặc sửa public/legacy. Test giao diện `front/tests/e2e/stripe-payment.spec.ts` dùng tài khoản trong runner riêng và intercept response thanh toán, không xác nhận thanh toán end-to-end với provider.

Smoke provider tùy chọn, sau build, trong `api/`:

```powershell
$env:RUN_STRIPE_SANDBOX_SMOKE = '1'
node test/stripe-sandbox-smoke.mjs
Remove-Item Env:RUN_STRIPE_SANDBOX_SMOKE
```

Lệnh này chủ động tạo rồi expire một Checkout Session test trị giá 1.000.000 VND; không gọi database, không nhập thẻ hoặc thu tiền. Kiểm account/key, payload SDK, VND, cùng key/cùng Session và cleanup. Không dùng kết quả này để khẳng định đã kiểm 3DS, decline, webhook qua CLI hoặc giao diện thanh toán Stripe. Kết quả thực tế ghi tại PROJECT_STATUS.
