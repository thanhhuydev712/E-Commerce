# RIGFORCE STORE — rà soát trước khi mở bán thật

Ngày: **17/11/2026**. Kết luận hiện tại: **chưa đủ điều kiện mở bán/thu tiền thật**. Đây là rà soát mã và kiểm tra UI có mục tiêu, không phải chứng nhận an toàn hoặc nghiệm thu production. Không thay `.env`, không chuyển Stripe sang live, không sửa dữ liệu DB và không provision/deploy trong lượt này.

## Thông tin chủ cửa hàng đã xác nhận

| Nội dung | Trạng thái |
| --- | --- |
| Tên cửa hàng | **RIGFORCE STORE**; cập nhật tên trên logo chữ, metadata, footer và phần giới thiệu chính |
| Ngành hàng | Đồ công nghệ, gear; cần danh sách ngành hàng/SKU chính thức để nhập dữ liệu |
| Khách hàng mục tiêu | Người dùng laptop/PC; đây là nhóm khách hàng, chưa xác định phạm vi địa lý giao hàng |
| Pháp nhân, mã số thuế, người bán chịu trách nhiệm | Chưa cung cấp; tên cửa hàng chưa đồng nghĩa tên pháp nhân |
| Hotline, email, địa chỉ, giờ làm việc | Chưa cung cấp; không tự điền thông tin giả |
| Thanh toán, giao vận, bảo hành/đổi trả | Người dùng xác nhận **chưa chốt** |
| Domain, AWS region/ngân sách, địa bàn phục vụ | Chưa chốt |

## Nhận xét từ góc nhìn khách hàng

Trang chủ có nhận diện màu rõ, ảnh chủ đạo đẹp, logo hãng thật và PC Studio tạo điểm nhớ. Tuy nhiên, khi cân nhắc trả tiền, khách còn thiếu câu trả lời: ai đang bán, hàng nào thực sự có sẵn, ảnh có đúng SKU không, giao tới địa chỉ của tôi bao lâu và bao nhiêu tiền, nếu hỏng ai chịu trách nhiệm, khi nào được hoàn tiền. Hình ảnh đẹp hiện chưa thay thế được bằng chứng vận hành và sự tin cậy.

Nội dung còn bộc lộ dữ liệu demo: sản phẩm/ảnh và thương hiệu cũ trong catalog, chính sách/showroom minh họa, footer thông báo không có giao dịch thật. Không xóa các nhãn này để làm website trông đã sẵn sàng; thay bằng dữ liệu xác nhận rồi mới bỏ nhãn. Các logo hãng không chứng minh quan hệ đối tác/phân phối.

## P0 — phải hoàn tất trước mở bán

| Hạng mục | Bằng chứng đang có / phần còn thiếu | Điều kiện đóng |
| --- | --- | --- |
| Bản vá dependency | FE đã ở Next 16.4.6, audit runtime 0 và build qua. BE đã cập nhật lockfile bằng audit fix tương thích; platform-express 12.5.1/body-parser 2.4.0/multer 2.5.0, audit runtime 0, generate v2/build/unit qua. Audit cả dev vẫn còn 5 entry qua chuỗi @nestjs/mau (2 high), chưa force downgrade | Xử lý dev tooling, clean install và kiểm HTTP/auth/upload/checkout tích hợp. Audit 0 không chứng nhận mã nghiệp vụ an toàn |
| Email xác thực/khôi phục | `api/src/modules/auth/challenge-delivery.ts` lưu thư trong bộ nhớ và chủ động từ chối production | Chọn provider/domain gửi; SPF/DKIM/DMARC, gửi thật, expiry, rate limit, retry và theo dõi thư lỗi; không trả token ra UI/log |
| Thanh toán thật | `environment.ts` chỉ nhận `sk_test_`; `stripe.gateway.ts` chỉ bật test; `stripe-payment.service.ts` kiểm sandbox và bỏ qua event live | Chọn provider phù hợp pháp nhân/quốc gia/đối soát; chế độ test/live tách rõ, webhook HTTPS/chữ ký/chống lặp, đối soát, thử thành công/thất bại/timeout trước khi bật live |
| Hoàn tiền và hậu mãi | Stripe v2 có Refund REQUESTED, chưa có bằng chứng provider refund và workflow hoàn tiền đầy đủ | Quyền duyệt, số tiền/phần hàng, idempotency, trạng thái provider, đối soát, khách được thông báo; hoàn tiền không tự hoàn kho |
| Đơn hàng/kho/giao vận | COD tạo/hủy và reservation đã có; chưa nghiệm thu luồng đóng gói → xuất kho → bàn giao → giao thành công/thất bại → thu COD | Chốt trạng thái và người thao tác, khóa/cập nhật tồn có điều kiện, hủy/hoàn hàng đúng một lần, tracking và đối soát COD |
| Quản trị vận hành | `admin-live.tsx` chủ yếu overview/list; backend catalog có controller riêng, không đồng nghĩa UI vận hành đã đủ | CRUD SKU/giá/ảnh, nhập/điều chỉnh tồn, xử lý đơn/refund/hỗ trợ; phân quyền nhỏ, audit log và tài khoản nhân viên riêng |
| Dữ liệu bán hàng | Catalog development, ảnh minh họa và một số nội dung hardcode còn hiện hữu | SKU/variant đúng ảnh, thông số, giá vốn/giá bán, VAT/hóa đơn, tồn thực, thời gian bảo hành; loại fixture khỏi DB production bằng kế hoạch riêng, không reset DB hiện có |
| Thông tin người bán/chính sách | Liên hệ, pháp nhân, vùng giao, điều kiện đổi trả và mức phí chưa được xác nhận | Nội dung được chủ cửa hàng duyệt; xác minh nghĩa vụ kinh doanh, thuế, TMĐT và bảo vệ dữ liệu phù hợp thị trường; không gắn chứng nhận/đối tác chưa có căn cứ |
| Hạ tầng triển khai | Chưa thấy Dockerfile/Compose/Nginx/workflow triển khai trong khảo sát file; có DEPLOYMENT_PLAN nhưng đó là thiết kế | Linux clean build, Prisma v2 đúng runtime, HTTPS/same-origin /api/v1, CI gates, staging riêng, release/rollback có bằng chứng; chốt AWS budget/region/domain trước tài nguyên tính phí |
| Dữ liệu và media bền vững | Media mặc định `.local-media`, DB cần vận hành độc lập với container | Storage/volume hoặc object storage bền vững, quyền riêng, DB private, mã hóa, lịch backup, thử restore và rollback migration tương thích |
| Bảo mật vận hành | Có validation/ownership/session/throttle nền; `http.ts` bật Swagger, cần review exposure/security headers/proxy topology | Rà đường ghi dữ liệu/admin/IDOR, brute force, cookie/TLS, CSRF, upload, body limit; chính sách Swagger, secret runtime, log không chứa PII/token; xử lý phát hiện trước release |
| Nghiệm thu release | Các lượt UI dev đã qua không chứng minh production hoạt động | E2E trên image production và DB test riêng: auth/reset → chọn SKU → quote → đặt đơn → thanh toán → xuất/giao → hủy/hoàn; test lặp/đồng thời, reboot, rollback, restore, mobile/Safari |

Tham chiếu chính: [DEPLOYMENT_PLAN](DEPLOYMENT_PLAN.md), [Stripe v2 sandbox](STRIPE_V2.md). Webhook phía server phải là căn cứ xử lý thanh toán; trang khách quay về không đủ tin cậy để quyết định đã thanh toán. [Stripe — fulfillment](https://docs.stripe.com/checkout/fulfillment). Rà bảo mật theo [OWASP Node.js](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html) và [HTTP headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html).

## P1 — để khách mua dễ và cửa hàng vận hành được

Cập nhật UX 17/11/2026: đã bổ sung tìm trong danh mục, lọc còn hàng, khôi phục ngữ cảnh khi xóa lọc, báo khoảng giá ngược và so sánh thuộc tính có tên/lọc khác biệt. **6/6 ca Chromium dev qua**, chi tiết tại [PROJECT_STATUS](PROJECT_STATUS.md). Đây là hoàn thiện trải nghiệm chọn hàng trên snapshot hiện có; không đóng các yêu cầu dữ liệu thật, truy vấn catalog toàn bộ hay vận hành bên dưới. Mốc công khai hiện chọn public preview theo [RELEASE_PLAN](RELEASE_PLAN.md); tiêu chí mở bán trong tài liệu này là giai đoạn riêng. Những nhận xét hạ tầng phía trên là ảnh chụp thời điểm khảo sát, không phủ nhận các file Docker/Compose/CI được thêm đồng thời; sự tồn tại của file chưa là bằng chứng deploy.

- Catalog có phân trang/tìm kiếm/lọc từ server khi tăng dữ liệu; storefront snapshot hiện có `take: 100` trong service, không thể coi snapshot là toàn bộ catalog không giới hạn.
- Trang sản phẩm: nhiều ảnh đúng variant, mô tả có ích, thông số có nguồn, bảo hành thực, trạng thái tồn, giá và điều kiện ưu đãi rõ. Chốt cách hiển thị VAT/phí/hóa đơn; không tự mặc định đã bao gồm thuế.
- Checkout: địa chỉ theo vùng giao, báo phí/ETA thực, giữ form khi lỗi, giải thích phương thức thanh toán, hỗ trợ người mua gặp lỗi; cân nhắc guest checkout theo chính sách tài khoản.
- Hỗ trợ: hotline/email thật, giờ hỗ trợ, ticket có nhân viên xử lý và thông báo, tra cứu đơn/bảo hành theo quy trình thật.
- Email giao dịch: xác nhận đơn/thanh toán, đổi trạng thái, hủy/hoàn tiền; nội dung và các link đúng domain.
- Tài khoản: lịch sử đơn/tracking, yêu cầu hậu mãi, quản lý phiên và quy trình dữ liệu cá nhân. Review xác minh mua hàng/duyệt nội dung nếu mở chức năng đánh giá.
- SEO: domain/canonical, metadata từng sản phẩm, sitemap/robots, OpenGraph và structured data từ dữ liệu thật. Chưa thấy sitemap/robots/canonical trong khảo sát App Router; chưa triển khai khi domain chưa chốt.
- Chất lượng: đo Core Web Vitals/mobile trên production; kiểm keyboard/contrast/zoom/trình đọc màn hình, ảnh lỗi/ảnh lớn/loading/error/empty; không tăng animation hoặc banner thay cho tối ưu luồng mua.
- Giám sát: uptime, log có requestId, cảnh báo lỗi thanh toán/email, dung lượng DB/media, chi phí, quy trình ứng cứu và người trực.

## P2 — nâng lợi thế sau khi luồng bán hàng tin cậy

Nội dung tư vấn gắn nhu cầu/budget, bộ cấu hình do người có chuyên môn duyệt, video/ảnh setup thực, so sánh thực dụng, đánh giá người mua xác minh, chiến dịch có dữ liệu đo lường. Không thêm chat/AI/loyalty/queue chỉ để giống các website lớn.

## Đã sửa ngay trong lượt rà soát

1. Ghi tên đã xác nhận vào `front/src/config/store-identity.ts`, áp dụng logo, metadata, footer và phần giới thiệu. Chưa sửa tên SKU/coupon/media trong DB vì đó là dữ liệu cần chủ cửa hàng kiểm duyệt.
2. Bỏ lời hứa mã RIGFORGE5 giảm 5% hardcode ở chi tiết sản phẩm và marquee; hướng khách tới ưu đãi đang áp dụng, server vẫn xác minh khi đặt hàng.
3. Bỏ lời hứa miễn phí giao hàng cố định từ 5 triệu trên trang chi tiết, thay bằng thông tin phí/điều kiện xác nhận tại thanh toán.
4. Card chỉ hiện giá gạch khi oldPrice lớn hơn giá bán và badge giảm khi phần trăm dương; tránh giảm âm/0% hoặc gạch giá 0đ.
5. Vá dependency runtime backend trong giới hạn semver tương thích; giữ schema và generated-client path v2. Frontend trong workspace đã ở Next 16.4.6 và được kiểm tra lại. Không dùng audit fix --force để ép đổi phiên bản công cụ dev.

Giữ nhãn môi trường demo và ảnh minh họa cho đến khi dữ liệu/vận hành được thay thật. Không tuyên bố các chặn P0 đã hoàn tất.

## Thứ tự thực hiện tiếp

1. Chủ cửa hàng hoàn thiện các thông tin trống ở bảng đầu và chốt mở bán thật hay website giới thiệu chưa thu tiền.
2. Vá dependency, hoàn thiện email, quản trị và bộ dữ liệu thật; chạy staging với provider test.
3. Hoàn thiện giao vận/refund, CI/CD/HTTPS/backup/monitoring; nghiệm thu đầy đủ các P0 bằng môi trường tách biệt.
4. Sau khi nghiệm thu, cấu hình provider live/đối soát, nhập tồn và giá thật, rà nội dung/legal, chuyển domain và mở bán có giám sát. Chưa có thời hạn go-live hay ngân sách được xác nhận trong lượt này.
