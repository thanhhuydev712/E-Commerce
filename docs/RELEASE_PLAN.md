# Đưa website hiện tại thành bản công khai

Ngày: **17/11/2026**. Người dùng xác nhận mục tiêu trước mắt: **website công khai để giới thiệu và trải nghiệm, chưa nhận đơn thật**. Tài liệu này xác định phạm vi sản phẩm và điều kiện phát hành; [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) tiếp tục là nguồn thiết kế Docker/Nginx/CI/CD/AWS.

## 1. Bản đầu tiên cần đạt điều gì?

Giữ giao diện hiện tại và phát hành một **public preview**: bản chạy công khai bằng cấu hình production, có domain/HTTPS, đọc API thật và cho thấy khả năng của dự án. Production là cách build/vận hành; không có nghĩa đã mở kinh doanh hoặc dùng payment live.

- Giữ nhận diện hiện đang được code sử dụng ở `front/src/config/store-identity.ts`: **RIGFORCE STORE**, cùng bố cục Spectrum, responsive và PC Studio. Tên Rigforge trong tài liệu/màn hình cũ cần rà lại trước phát hành; chưa tự quyết đổi thương hiệu hoặc ngành hàng cuối cùng.
- Giới thiệu, tìm/lọc/xem sản phẩm, đọc bài viết, so sánh và trải nghiệm PC Studio là phạm vi công khai chính. Giá/tồn/nội dung development phải được nhận diện là dữ liệu minh họa.
- Giỏ hàng, tài khoản, lưu cấu hình, đặt/hủy COD và Stripe sandbox đã có mã và bằng chứng lịch sử; chỉ mở như **trải nghiệm demo có giới hạn** khi có cơ chế tài khoản/dữ liệu riêng an toàn. Chưa quảng bá là nhận đơn, thanh toán, bảo hành hoặc giao hàng thật.
- Các endpoint tạo đơn/thanh toán phải tuân thủ chế độ demo ở server, không chỉ dựa vào nhãn hoặc nút ẩn ở FE. Đề xuất bản công khai đầu khóa tạo đơn public nếu chưa có cấu hình demo đáng tin cậy; không phá luồng test hiện tại để đạt điều này.
- Không gỡ nhãn demo để làm website có vẻ chính thức. Chỉ thay dữ liệu/claim bằng thông tin đã được chủ dự án xác nhận; không tự điền hotline, showroom, quan hệ đối tác, chứng nhận hoặc chính sách kinh doanh.

## 2. Hiện trạng có bằng chứng

| Nội dung | Bằng chứng tại 17/11/2026 | Giới hạn |
| --- | --- | --- |
| Giao diện hiện tại | Đã mở trang chủ dev ở 1440×1000 và 390×844, xem ảnh desktop/mobile | HTTP 200, một h1 visible, không tràn ngang/pageerror trong smoke; chưa phải kiểm toàn website hoặc production |
| Luồng FE–BE | AppModule nạp commerce/storefront và các module v2; frontend dùng API nội bộ/cùng origin; các lượt kiểm lịch sử tại PROJECT_STATUS | Không chạy lại E2E ghi dữ liệu trong lượt rà này |
| Thanh toán | Stripe Checkout sandbox, chữ ký webhook, chống lặp và recovery đã có theo [STRIPE_V2.md](STRIPE_V2.md) | Không bật live; refund/thu COD/giao vận đầy đủ chưa được nghiệm thu |
| Dependency | Trước sửa: `npm audit --omit=dev --json` báo 1 moderate ở Next 16.4.2, GHSA-mfr8-8qww-v76h | Không kết luận website đã bị khai thác; audit không bao phủ mọi lỗi ứng dụng |
| SEO | Root metadata có title/description; chưa thấy metadataBase/canonical, robots/sitemap hoặc metadata riêng theo sản phẩm trong phạm vi đã rà | Smoke trang chủ xác nhận chưa có canonical/robots meta; chưa audit mọi route/status code |
| Email | `api/src/modules/auth/challenge-delivery.ts` từ chối production, chỉ giữ message trong bộ nhớ local | Reset/xác minh email chưa thể được giới thiệu như dịch vụ công khai hoàn chỉnh |
| Media | `api/src/modules/media/media.service.ts` dùng filesystem, mặc định `.local-media` | Phải giữ volume/storage và có backup khi thay container |
| Hạ tầng | Chưa thấy Dockerfile/Compose/Nginx/workflow triển khai trong workspace đã khảo sát | Chưa provision/deploy; bản production local trong lịch sử không phải AWS |

Nguồn bản vá: [Next.js 16.4.5 security release](https://github.com/vercel/next.js/releases/tag/v16.4.5), [advisory cụ thể](https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h), [16.4.6](https://github.com/vercel/next.js/releases/tag/v16.4.6). Trong đợt mở đầu, cập nhật Next và eslint-config-next cùng patch **16.4.6**, giữ major và các thư viện khác; kết quả kiểm sau sửa ghi tại [PROJECT_STATUS.md](PROJECT_STATUS.md). Không dùng kết quả audit 0 thay cho nghiệm thu production.

## 3. Lộ trình theo các đợt nhỏ

| Đợt | Việc thực hiện | Tiêu chí hoàn thành |
| --- | --- | --- |
| P0 — ổn định bản hiện tại | Vá dependency được xác minh, giữ thay đổi UI đang có; gom kết quả kiểm theo mã cuối | Lint/type/build và smoke phù hợp qua; không bỏ qua cảnh báo bảo mật để phát hành; ghi rõ suite chưa chạy |
| P1 — chốt bản public preview | Rà toàn route/menu/CTA; thống nhất tên thương hiệu; xác minh asset/claim; chốt các luồng public/demo/ẩn; triển khai ràng buộc demo ở server | Không có nút hứa nghiệp vụ chưa có; nhãn demo nhất quán tại giá/checkout; request trực tiếp không tạo giao dịch thật |
| P2 — chuẩn hóa nội dung và SEO | Nội dung giới thiệu có nguồn, trang hỗ trợ/chính sách đúng phạm vi, metadata theo route, canonical, sitemap/robots, social preview và icon khi có asset được duyệt | URL hợp lệ, thiếu sản phẩm/bài trả đúng 404, một h1; staging không index, route riêng tư không có trong sitemap |
| P3 — hoàn thiện trải nghiệm production | Kiểm catalog/detail/search/cart/auth/PC Studio/error; đo catalog/asset, mobile và reduced motion; bổ sung email nếu mở auth công khai | Một lượt regression trên mã cuối + kiểm hành trình API thật trong schema riêng; loading/error/empty, keyboard và session isolation đúng |
| P4 — đóng gói và kiểm tự động | Pin Node/env; Docker multi-stage/Compose, Nginx giữ API prefix, storage bền, CI lint/build/test/audit | Image Linux chạy được; ảnh không mất sau recreate; cookie/Origin/trust proxy đúng; smoke qua Nginx; PR lỗi bị chặn |
| P5 — staging và public preview | Chốt domain/ngân sách/region; dựng AWS theo kế hoạch; HTTPS, secrets, logs, alarms, backup, deploy/rollback | Staging đạt checklist rồi promote đúng image/config; thử rollback/reboot/restore; public vẫn không nhận đơn/tiền thật |

Không tự thực hiện tất cả các đợt trong một nhiệm vụ; mỗi thay đổi có phạm vi và bằng chứng riêng. Thứ tự P2/P3 có thể xen kẽ theo dependency; không cần viết lại giao diện hoặc triển khai đủ nghiệp vụ của mọi bảng để phát hành bản trải nghiệm.

### P1: phân loại chức năng trước khi công khai

| Nhóm | Hướng phát hành ban đầu | Điều kiện |
| --- | --- | --- |
| Landing/catalog/search/articles/compare | Công khai | Dữ liệu giả có nhãn; ảnh và nội dung có quyền sử dụng, không claim hợp tác thật |
| PC Studio/3D | Công khai với fallback 2D | Ghi rõ mô hình minh họa; không xác nhận tương thích vật lý khi thiếu thông số SKU |
| Auth/lưu cấu hình/wishlist | Mở có điều kiện | Email/reset production hoặc tài khoản demo theo từng khách được giới hạn, không dùng chung tài khoản có quyền; dữ liệu người dùng tách biệt |
| Checkout/COD/Stripe | Chỉ demo kiểm soát, hoặc khóa public trong đợt đầu | Không yêu cầu người dùng nhập địa chỉ/thẻ thật; không provider live; không tạo đơn kinh doanh, không gửi yêu cầu giao hàng |
| Admin | Không giới thiệu là bộ quản trị kinh doanh đầy đủ | Guard/permission backend vẫn bắt buộc; overview hiện có không thay thế xuất kho/giao/thu tiền |
| Showroom/bảo hành/đối tác | Chỉ nội dung đã xác minh hoặc minh họa có nhãn | Hiện có địa điểm demo và logo nhận diện; không chuyển thành tuyên bố điểm bán/đại lý thật |

Nếu thêm cấu hình chế độ phát hành, đó là contract **đề xuất**, phải hiện thực và test mới tính là có. Không dùng `NODE_ENV=development` trên AWS để né các điều kiện production. Chế độ demo không được tự cấp ADMIN, trả secret/token dùng chung hoặc cho khách ghi dữ liệu sang tài khoản khác. Chưa quyết định mở đăng ký public trước khi có phương án email và quản lý dữ liệu.

### P2: nội dung và tìm kiếm

- Rà cả header/footer, showroom, bài viết, thông số SKU, giá/khuyến mại, chính sách và quyền dùng asset; xem [BRAND_ASSETS.md](../front/docs/BRAND_ASSETS.md) và [VISUAL_ASSETS.md](../front/docs/VISUAL_ASSETS.md). Không gắn cam kết giao/bảo hành hoặc đánh dấu Product/Offer như sản phẩm đang bán thật khi chỉ demo.
- Domain chưa được chốt, không hardcode domain giả làm canonical. Metadata động phải lấy từ dữ liệu route và tuân theo Next đang cài; không chỉ đổi title chung ở root.
- Staging dùng hạn chế truy cập và noindex phù hợp. `robots.txt` không phải biện pháp phân quyền; account/admin/checkout vẫn phải có bảo vệ ứng dụng. Chốt route nào được index ở public preview, không đưa nội dung riêng hoặc demo giao dịch vào sitemap.
- Chỉ thêm kênh liên hệ thật khi chủ dự án cung cấp/xác nhận; trang chính sách mô tả đúng bản trải nghiệm. Khi thu dữ liệu người dùng thật cần xác định mục đích, nơi lưu, thời hạn giữ/xóa và người vận hành trước khi mở chức năng.

### P3: kiểm tra và hiệu năng

Kiểm trên production server/image với DB test riêng, không reuse dev server hoặc ghi đơn vào public DB: homepage → search/filter → SKU → compare/PC Studio → tài khoản/demo cart nếu được mở → lỗi mạng/hết phiên → khôi phục. Bộ checkout test hiện có vẫn chạy trong môi trường test; khóa public phải được test riêng cả request trực tiếp và UI.

Phép đo mẫu trước đây thấy catalog snapshot khá lớn/chậm; `front/src/catalog/server.ts` hiện fetch storefront đầy đủ ở runtime và root layout cần snapshot này. Đo TTFB, payload, truy vấn DB, ảnh lazy/LCP và hoạt động 3D trước khi chọn tối ưu; chưa tự thêm Redis hoặc chuyển mọi dữ liệu thành cache dùng chung. Không cache response có danh tính/giá riêng tư. Có kết quả Chromium không đồng nghĩa Safari/thiết bị thật đã qua.

### P4/P5: điều kiện vận hành

Thực hiện theo [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md), có các điểm phải khớp mã mới:

- `API_INTERNAL_URL` hiện là **origin backend không có `/api/v1`**, ví dụ nội bộ `http://api:3001`; mã FE tự nối prefix. Browser tiếp tục gọi `/api/v1` cùng origin.
- Next hiện dùng `distDir` tùy biến; Docker phải dùng đúng output thực tế, không mặc định `.next`. Rewrite trong next.config được xử lý lúc build: khi Nginx nhận `/api/v1`, cấu hình runtime/server fetch và build rewrite phải được kiểm riêng, không hứa promote image nếu còn URL môi trường bị đóng cứng.
- Media filesystem phải có volume/storage, backup và phép thử recreate; DB ở RDS private có TLS. Không cần thêm S3 media ngay nếu một máy và volume bền đã đáp ứng, nhưng phải ghi rõ rủi ro/phương án phục hồi.
- Kiểm forwarded headers/trust proxy trước bật throttling sau Nginx. Không để rate limit gom mọi khách thành IP proxy; không tin X-Forwarded-For client tùy ý.
- Chạy migration một lần với quyền riêng; app theo digest/config, secret ngoài Git/image, logs đã che thông tin nhạy cảm; backup/rollback/reboot được thử trước phát hành.

## 4. Việc chưa chặn mốc giới thiệu công khai

Rà soát riêng cho mốc kinh doanh nằm ở [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md); tài liệu đó có các điều kiện mở bán thật. Mốc người dùng chọn trong RELEASE_PLAN hiện chỉ là giới thiệu/trải nghiệm, vì vậy không dùng toàn bộ checklist mở bán làm điều kiện chặn bản preview.

Quy trình xuất kho/giao hàng/đối soát COD, hoàn tiền provider và payment live chỉ trở thành điều kiện bắt buộc nếu mở bán thật. Không phát triển các phần đó để trì hoãn bản giới thiệu; đồng thời không cho UI hoặc endpoint public hứa chúng đã có. Backend hiện mới có admin overview và reservation, chưa phải vận hành đơn hàng khép kín.

Khi người dùng yêu cầu nhận đơn thật, mở một mốc riêng: dữ liệu catalog/giá/tồn có chủ sở hữu xác nhận, chính sách kinh doanh/giao nhận, quyền vận hành admin, trạng thái đơn và xuất/hoàn kho đúng một lần, thu COD hoặc provider thanh toán phù hợp, hỗ trợ và đối soát. Stripe sandbox hiện cố ý từ chối live; phải đánh giá điều kiện tài khoản/thị trường trên [Stripe global availability](https://stripe.com/global) trước khi chọn provider thực tế. Không tự chuyển test key sang live hoặc giả định chủ dự án đủ điều kiện sử dụng.

## 5. Checklist phát hành bản đầu

- [ ] Chốt phạm vi public/demo/khóa ở từng route/API và test được ràng buộc server.
- [ ] Bản vá dependency đạt kiểm tra; một tập kết quả cuối gắn đúng commit/diff, ghi mọi giới hạn.
- [ ] Nội dung, asset, tên thương hiệu và kênh hỗ trợ được rà; nhãn demo chính xác, không nhận đơn/tiền thật.
- [ ] Auth nếu public có phương án email/khôi phục; dữ liệu và quyền tách người dùng, không dùng tài khoản admin demo chung.
- [ ] Metadata/canonical/social preview/sitemap/robots phù hợp domain và phạm vi index; URL sai trả đúng trạng thái.
- [ ] Image production qua Nginx đạt smoke/E2E, cookie/session/trust proxy và storage qua recreate.
- [ ] HTTPS, secret, logs/alarms, ngân sách, backup/restore và rollback có bằng chứng.
- [ ] Chủ dự án duyệt bản staging cụ thể trước thao tác deploy công khai; yêu cầu định hướng này chưa tự cấp quyền provision/push/deploy.

Mỗi đợt cập nhật [PROJECT_STATUS.md](PROJECT_STATUS.md). Không đánh dấu checklist hoàn tất chỉ vì có tài liệu, script hoặc kết quả kiểm trên dev. Lượt 17/11 mở đầu bằng rà soát/bản vá; chưa phải phát hành public preview. [Bằng chứng bản vá và smoke production](verification/2026-11-17-public-preview.json) tách rõ môi trường kiểm, kết quả và giới hạn.

## Bộ production preview đã chuẩn bị — 18/11/2026

Theo yêu cầu tiếp tục hoàn thiện và xác nhận chưa có AWS account/domain, đã tạo production Compose/HTTPS, boundary API + banner/login preview ở FE, runtime DB chỉ SELECT, định nghĩa CI/Release/Deploy và bộ AWS CloudFormation/helpers. Đọc [INFRASTRUCTURE_GUIDE](INFRASTRUCTURE_GUIDE.md). Checkout/tài khoản/Stripe được đóng ở production preview; DB/dev vẫn có luồng nghiệp vụ để học. Kiểm Docker local/TLS/restore không tự hoàn thành checklist công khai: vẫn cần chạy Actions thật, provision staging, DNS/ACME, diễn tập cloud và kiểm nội dung/quyền ảnh trước mở website.
