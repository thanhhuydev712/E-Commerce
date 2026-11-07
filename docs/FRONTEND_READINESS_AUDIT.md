# Rà soát FE, UI/UX và PC Studio — 07/11/2026

## Kết luận và cách đọc

Đây là rà soát mã nguồn, kiểm thử trình duyệt và kiểm tra bản build local; không phải chứng nhận website đã hoàn thiện 100% hoặc đã sẵn sàng bán hàng production. Phạm vi sản phẩm hiện có là bản trải nghiệm kết nối API thật, catalog development và đặt hàng COD. Stripe, giao vận, email thật và các workflow quản trị đầy đủ vẫn cần triển khai/nghiệm thu riêng.

Các mục dưới phân biệt: hành vi đã chạy kiểm thử, mã đã xem/sửa và phần chưa được kiểm chứng. Kết quả của lượt kiểm tra cuối nằm ở phần **Bằng chứng**; không suy diễn trạng thái từ việc có file test.

## Phạm vi

- Đọc layout/App Router, catalog/API client, auth/session, tài khoản, giỏ/checkout/đơn, tìm kiếm/lọc/so sánh, nội dung/showroom và PC Builder/renderer 3D.
- Kiểm tra 20 mẫu trang ở 360, 390, 768, 1024, 1440 và 1920 px; bảo toàn `--rf-home-width`, header full width và hành vi hai quảng cáo bên cạnh.
- Kiểm tra riêng các hành trình đăng ký, khôi phục phiên, hồ sơ/địa chỉ, giỏ sau reload, lưu cấu hình, COD/coupon/hủy đơn và giới hạn quyền quản trị.
- Thêm tình huống proxy trả HTML, lỗi API khi lưu cấu hình/tạo đơn, phiên hết hạn, SKU không còn xuất hiện trong catalog, mất WebGL và giảm chuyển động.
- Kiểm bản production bằng Next build/start nối Nest/PostgreSQL trong schema test riêng. Không deploy, gọi thanh toán thật, reset/seed public hoặc tự nâng quyền tài khoản.

## Lỗi FE đã sửa trong lượt rà soát

| Vấn đề | Hành vi trước sửa | Sau sửa / bằng chứng |
| --- | --- | --- |
| Mua ngay khi chưa đăng nhập | Gọi thêm giỏ bất đồng bộ rồi đẩy `/cart` ngay, có thể ghi đè điều hướng đăng nhập | Chờ kết quả thêm giỏ; chỉ mở giỏ khi thành công. Test cả card và trang sản phẩm |
| Giỏ có SKU đã bị ẩn | `variantById(...)!` có thể làm sập giỏ/checkout khi catalog không còn SKU | Hiện sản phẩm không khả dụng và nút xóa; checkout yêu cầu quay lại giỏ. Không âm thầm coi SKU mất là giá 0 để cho đặt hàng |
| Cập nhật giỏ đang gửi | Có thể bấm liên tiếp với số lượng cũ, khó biết request đã xong | Store cung cấp `cartPending`; khóa các control giỏ/sản phẩm liên quan trong lúc gửi. Server vẫn kiểm tồn/giá |
| Tạo đơn chưa thể hiện đang xử lý | Có ref chặn trùng nhưng nút không phản hồi trực quan | Có `aria-busy`, nút “Đang tạo đơn hàng…” bị khóa và phục hồi khi lỗi; giữ giỏ/thông tin |
| Lưu cấu hình thất bại | Dialog đóng ngay trước khi API trả kết quả | Chờ API, khóa nút khi gửi; lỗi giữ tên và linh kiện để thử lại; chỉ đóng sau thành công |
| Dữ liệu của URL trước | Hook resource có thể giữ data/error của path cũ khi URL đổi | Kết quả gắn với path và phiên reload; URL mới nhận loading thay vì dữ liệu cũ |
| Phản hồi lỗi không phải JSON | Proxy HTML/text làm UI hiện lỗi parse JSON | API client chuyển lỗi thành thông báo dễ hiểu, xử lý 204 và lỗi kết nối |
| Thử lại lỗi server | Error boundary dùng `reset()`, chỉ render lại payload lỗi cũ | Đổi sang `retry()` của Next 16.4; kiểm trên production riêng cho thấy request dữ liệu tăng từ 2 lên 3 sau click và trang chủ phục hồi. Global error có stylesheet riêng |
| Phiên hết hạn trong lúc dùng | Access token hết hiệu lực nhưng header/store có thể vẫn hiện người dùng và dữ liệu riêng cũ | API báo sự kiện hết phiên; xóa dữ liệu riêng trong store, yêu cầu đăng nhập lại. Các response giỏ/lưu cấu hình/đơn đến trễ không ghi sang phiên mới |
| Đổi mật khẩu thành công | Backend thu hồi phiên nhưng giao diện có thể còn hiển thị tài khoản cũ trước lần gọi API tiếp theo | Xóa phiên và dữ liệu riêng ngay khi đổi mật khẩu thành công, rồi đưa về đăng nhập |
| Tương thích PC thiếu thông số | `undefined === undefined` có thể báo socket/DDR hợp lệ; kích thước thiếu được mặc định 0 | Thông số thiếu tạo cảnh báo “chưa đủ dữ liệu”; ID cũ/sai nhóm/hết hàng bị chặn. Có test kiểm quy tắc thuần |
| 3D render liên tục khi đứng yên | Canvas dùng vòng lặp liên tục dù không quay quạt hoặc thay đổi cảnh | Dùng `frameloop="demand"`; chỉ yêu cầu frame khi lắp/tách linh kiện, xoay camera hoặc quay quạt. Test đếm draw call để xác nhận nghỉ |
| Giảm chuyển động làm tắt cả đèn | Prop `powered` bị ép false khi giảm chuyển động | Tách trạng thái bật máy và quay quạt; đèn giữ trạng thái, quạt dừng. Test chuyển chế độ khi máy đang bật |
| Control 3D trong 2D | “Mở kính”/“Góc nhìn” vẫn bấm được nhưng không có tác dụng trong 2D | Khóa hai control ở 2D; mất WebGL quay về 2D, giữ linh kiện |
| Editor cấu hình đã lưu | State khởi tạo có thể còn thuộc saved ID trước khi đổi route | Editor có key theo saved ID; tạo editor mới khi đổi cấu hình |
| Cấu hình cũ có sản phẩm đã mất | Chỉ đếm key và vẽ theo ID có giá trị, dù catalog không còn linh kiện | Bộ đếm, tag 2D và mô hình 3D chỉ lấy linh kiện đúng nhóm còn trong catalog; giữ lỗi để người dùng chọn lại. Cảnh 3D rỗng có hướng dẫn |
| Landmark và dữ liệu showroom rỗng | Tài khoản lồng `main` trong `main`; showroom truy cập thẳng phần tử đầu | Bỏ landmark lồng; dùng khởi tạo an toàn và empty state cho showroom |

Các file chính: `front/src/catalog/api-client.ts`, `hooks/use-api-resource.ts`, `providers/shop-provider.tsx`, `features/{cart,checkout,catalog,pc-builder,account,content}/` và `components/storefront/product-card.tsx`.

## Ma trận tính năng và UI/UX

| Khu vực | Phạm vi kiểm | Giới hạn cần giữ rõ |
| --- | --- | --- |
| Trang chủ / Hero | Auto 3 giây, nối vòng, kéo/vuốt, caption, pause, bàn phím, giảm chuyển động, rail/tab/blog | Ảnh và chương trình development không xác nhận ưu đãi kinh doanh thật |
| Header / điều hướng | Tìm không dấu, gợi ý bằng bàn phím, Escape, mega menu, Link/Back, header theo route | Chưa thay cho kiểm screen reader/thiết bị cảm ứng thật |
| Catalog / tìm kiếm | Danh mục, hãng, facet, min/max, sắp xếp, chip, refresh và phân trang URL | Đang tải snapshot catalog để lọc ở client; cần đo khi dữ liệu tăng lớn |
| Sản phẩm | Ảnh/zoom/focus, phiên bản/SKU, số lượng/tồn, CTA yêu thích/so sánh/giỏ | Giá/tồn cuối cùng do server quyết định; stock có thể đổi sau khi xem |
| Giỏ / checkout | Giá từ catalog/server, coupon có quote, khóa request trùng, lỗi API và SKU mất | Mới có COD; chưa có giao vận/thanh toán online hoàn chỉnh |
| Đơn hàng | Tải trạng thái từ backend, reload, lịch sử, COD, chứng từ, hủy theo quyền/trạng thái | Chứng từ, thu tiền và giao hàng chỉ có khi nghiệp vụ tương ứng được triển khai |
| Auth / tài khoản | Form thật, khôi phục phiên, dữ liệu riêng, hồ sơ/địa chỉ, wishlist, thông báo, yêu cầu hỗ trợ | Local chưa gửi email thật; thông báo thành công không có nghĩa email đã tới hộp thư |
| Bảo hành / đổi trả | Tra dữ liệu thuộc người dùng và tạo ticket hỗ trợ | Tạo ticket không phải duyệt bảo hành/hoàn tiền; không tạo kết quả serial giả |
| Admin | Chặn khách không có quyền; tổng quan và danh sách catalog | Chưa phải UI CRUD đầy đủ cho catalog/kho/đơn, không đánh dấu quản trị đã hoàn chỉnh |
| Nội dung / showroom | Trang thông tin, tin/bài, tìm bài, bộ lọc showroom, trạng thái rỗng | Showroom/bản đồ/hotline vẫn là nội dung minh họa, chưa xác nhận điểm kinh doanh |
| PC Builder | 8 nhóm, picker, đề xuất, bỏ linh kiện, hoàn tác/reset, tổng/ngân sách, lưu/mở | Bộ quy tắc tương thích có giới hạn; không bảo đảm mọi cấu hình phần cứng thực tế |

## PC Studio/3D: đã có gì và chưa có gì

Đã có mô hình hình học theo nhóm linh kiện, cập nhật khi chọn/bỏ, lắp/tách, mở kính, nguồn/đèn/quạt, OrbitControls xoay/zoom và đặt lại góc nhìn. Renderer được tải khi người dùng chọn 3D; camera reset không cấp lại WebGL context. Đã có error boundary và listener mất context để trở về 2D.

Kiểm định trong lượt này bao gồm: mở 3D/giữ canvas khi reset góc nhìn, tách linh kiện, quay về 2D, giả lập sự kiện mất context và giữ cấu hình, render nghỉ khi cảnh tĩnh, quạt hoạt động khi bật máy và dừng chuyển động khi người dùng yêu cầu. Một lỗi thời điểm khởi tạo được phát hiện khi mất context ngay sau khi canvas xuất hiện: listener trong cây scene bất đồng bộ chưa được gắn; đã chuyển listener lên ref canvas với layout effect để gắn trước paint. Đã kiểm riêng browser không cấp được WebGL context: tự về 2D và giữ đủ 8 linh kiện. Đây là kiểm chức năng trên Chromium local; không phải benchmark GPU/điện năng trên điện thoại.

Chưa có model đúng từng SKU, kích thước tỷ lệ thật, collision/clearance thật, đi dây, BIOS, đầu cấp nguồn, topology khe PCIe/M.2 hoặc xác minh toàn bộ linh kiện trên thị trường. `checkBuild` chỉ đối chiếu metadata có sẵn; cảnh báo thiếu thông số không được diễn đạt thành xác nhận lắp được. Tên gọi phù hợp là **xem cấu hình 3D minh họa**.

## Việc còn lại trước khi công khai / production

| Ưu tiên | Việc cần nghiệm thu | Vì sao / tiêu chí |
| --- | --- | --- |
| P1 | Email reset/verification thật, HTTPS/cookie qua proxy và khôi phục phiên sau deploy | Thử được email tới hộp thư và link đúng origin; kiểm login/logout/refresh sau Nginx |
| P1 | Hoàn thiện phạm vi thanh toán/giao vận/admin đã chốt | COD demo không thay thế Stripe/webhook/refund/giao hàng hoặc bộ UI quản trị đầy đủ |
| P1 | Đo thời gian tải và dung lượng catalog/HTML/JS trên môi trường staging | Root đọc catalog runtime; không suy ra nhanh từ việc build qua. Cần dữ liệu/latency gần môi trường triển khai, sau đó đặt ngân sách hiệu năng |
| P1 | Kiểm Safari/iOS/Android và máy không có GPU/driver yếu | Đặc biệt nhập form, bàn phím ảo, touch, sticky nav, zoom/pinch, WebGL và mất context; headless Chromium chưa bao phủ |
| P2 | Rà typography/tương phản/đích bấm trên thiết bị thật | Một số thông số/card/control Studio đang dùng chữ 7–10 px; ảnh desktop đẹp không chứng minh dễ đọc/chạm trên màn hình nhỏ |
| P2 | Hoàn thiện SEO theo sản phẩm/bài viết | Metadata root chưa thay thế title/description/OpenGraph/canonical/schema/sitemap cho từng trang; đối chiếu yêu cầu public launch trước khi bổ sung |
| P2 | Hoàn thiện UX các form tài khoản và công cụ quản trị | Bổ sung trạng thái gửi/thử lại nhất quán, xác nhận thao tác quan trọng, Việt hóa mã trạng thái nghiệp vụ và hoàn thiện empty/loading theo phạm vi |
| P2 | Kiểm accessibility sâu và bản in cấu hình | Đã kiểm một số bàn phím/dialog/landmark; chưa có chứng nhận WCAG, kiểm screen reader hoặc nghiệm thu PDF/bản in trên nhiều trình duyệt |

P1/P2 ở đây là thứ tự xử lý trong dự án, không phải chứng nhận rủi ro hoặc bảo mật độc lập.

## Bằng chứng

- Kiểm tĩnh cuối: `npm run lint`, `npm run format:check`, `npx tsc --noEmit` đều qua. Production build qua trong runner; có 30 shell route với dữ liệu runtime. Không suy ra tốc độ tải hoặc tính đúng của nghiệp vụ từ build.
- Lượt rộng trên Next production local + Nest/PostgreSQL thật: **73/75 ca qua**, 0 skip/retry/flaky, khoảng 28 phút 52 giây; artifact `front/.visual-review/codex_live_test_00ae21d3b7e54932b544574d09ed63f9/results.json`. Hai ca chưa qua là so sánh kích thước card tuyệt đối lệch khoảng 0,00005 px và mất WebGL ngay sau khi canvas xuất hiện. Đã sửa phép đo bằng so sánh gần đúng tới 2 chữ số thập phân và gắn listener trước paint; không gọi lượt này là 75/75.
- Chạy lại production sau sửa: **6/6 ca qua**, 1 worker, không retry, khoảng 1 phút 19 giây. Bao gồm motion thường/giảm chuyển động, đổi mật khẩu xóa phiên UI, cấu hình cũ thiếu linh kiện, mất WebGL ngay khi mở và renderer nghỉ/đèn khi giảm chuyển động. Artifact `front/.visual-review/codex_live_test_be501915c955454da4fd4fe7b1117078/results.json`. Hai ca đổi mật khẩu/cấu hình cũ được thêm sau lượt rộng; hiện có 77 ca nhưng **chưa chạy toàn bộ 77 ca trong một lượt sạch trên mã cuối**. Không cộng các lượt thành một lần chạy toàn bộ.
- Trong lượt rộng, toàn bộ **20 mẫu route × 6 viewport = 120 tổ hợp** qua kiểm nội dung, một `main` hiển thị, không tràn ngang và không có `pageerror`. Snapshot báo 0 ảnh đã tải bị hỏng tại thời điểm đo; không coi đây là kiểm toàn bộ ảnh lazy-loading. Đã mở xem ảnh trang chủ/Studio mobile, catalog/Studio desktop và màn hình lỗi phục hồi.
- Các luồng FE–BE thực trong lượt rộng và **5/5 ca quy tắc tương thích PC** đều qua. Bao gồm tài khoản/địa chỉ, giỏ sau reload, lưu cấu hình, COD/coupon/hủy và chặn quyền quản trị, bên cạnh Hero/tìm kiếm/lọc/so sánh/3D.
- Smoke production riêng: nút thử lại lỗi root thực sự refetch dữ liệu (request từ 2 lên 3) và phục hồi trang chủ; khi browser không cấp WebGL, editor trở về 2D và giữ 8 linh kiện. Bằng chứng `front/.visual-review/readiness-recovery.json`, ảnh `readiness-root-error.png` và `readiness-3d-1440.png`.
- Ca mới: `front/tests/e2e/readiness.spec.ts` và `front/tests/unit/compatibility.spec.ts`.
- Lượt đầu không được coi là kết quả UI: sandbox chặn chuẩn bị môi trường bằng EACCES; lượt chạy tiếp mất Next server sau hai ca, các lỗi connection refused sau đó không chứng minh 54 lỗi giao diện.
- Lượt regression riêng: 12/13 qua; ca duyệt 120 trang trong một test hết 360 giây tại bước chờ `load`. Đã tách 6 ca theo viewport và chờ DOM/nội dung cần kiểm, tránh dùng tải xong mọi tài nguyên làm điều kiện duy nhất.
- Runner hiện có khóa chống chạy trùng, kiểm cổng và không reuse server dev. Lượt này bổ sung `LIVE_FRONTEND_MODE=production` để build/start cùng đích API trong môi trường test; giữ hành vi mặc định dev.
- Đọc catalog của backend test cho thấy 183 sản phẩm, không có sản phẩm thiếu SKU, 8/8 bài có ảnh và nhóm CPU/mainboard dùng trong builder có socket. Ba GET công khai trả 200, cùng payload 147.392 byte, mất 6.812 / 3.128 / 2.752 ms trong lúc E2E đang chạy. Đây là đo mẫu có tải đồng thời, không phải kết quả staging/Lighthouse hoặc cam kết latency production; vẫn cần ưu tiên đo và tối ưu đường lấy dữ liệu.
- Chromium đã cài; Firefox/WebKit chưa có binary trong môi trường này. Không suy diễn kết quả trên Safari/iOS/Android từ viewport Chromium.
- Ảnh và báo cáo chi tiết ở `front/.visual-review/codex_live_test_*/`, bị gitignore vì trace có thể chứa dữ liệu/phiên tài khoản test. Không đưa token, connection string hoặc artifact đăng nhập lên GitHub.
- [Bằng chứng tổng hợp không chứa phiên đăng nhập](verification/2026-11-07-frontend-readiness.json). Các server riêng của lượt kiểm đã dừng; runner thoát mã 0 và tự dọn schema/media test. Không dừng server development chính của người dùng.

Chạy lại bản production local từ `front/`:

```powershell
$env:LIVE_FRONTEND_MODE = 'production'
npm.cmd run test:e2e
Remove-Item Env:LIVE_FRONTEND_MODE
```

Runner cần PostgreSQL development/test có quyền tạo schema và backend đã build. Không chạy bằng database production. Không suy ra đã deploy/nghiệm thu Nginx/AWS từ lượt kiểm này.
