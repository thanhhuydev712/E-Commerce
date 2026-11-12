# Tốc độ storefront — 12/11/2026

Theo yêu cầu người dùng, agent chính xử lý đường dữ liệu và một sub-agent frontend
khảo sát/sửa trang chủ. Không thêm dependency hoặc cache giá/tồn.

## Nguyên nhân và thay đổi

- Root layout chờ `getStorefront()` trước khi hiển thị cửa hàng. Backend trước đây
  lần lượt đọc catalog, presentation, banner, collection, danh mục, bài và trang.
  `StorefrontService.snapshot()` nay dùng `Promise.all` cho các nhóm độc lập;
  giữ nguyên SQL, bộ lọc public, response và đọc dữ liệu mới cho từng request.
- `ShopProvider.placeOrder/cancelOrder` trước đây chờ tải lại toàn snapshot sau
  khi server đã xác nhận thao tác. Cập nhật catalog nay chạy nền, có xử lý lỗi
  bằng thông báo riêng xác nhận đơn đã tạo/hủy thành công;
  kết quả đặt/hủy dùng response nghiệp vụ. CatalogProvider chỉ nhận kết quả của
  lần refresh mới nhất để response cũ không ghi đè lần refresh sau.
- Banner đang ẩn dùng native lazy loading; slide hiện hành dùng eager và ảnh đầu
  giữ mức ưu tiên cao. Trình duyệt vẫn có thể tải trước ảnh gần viewport.
- LandingPage chuyển về Server Component, tách CategoryShelves dùng context thành
  Client Component. Các vùng tĩnh không còn bị kéo vào client từ component cha.

Giá/tồn hiển thị có thể còn là snapshot trước trong lúc cập nhật nền hoặc khi
refresh lỗi; backend vẫn xác minh giá/tồn khi báo giá và đặt đơn. Không dùng
snapshot frontend làm nguồn quyết định số tiền hoặc bảo đảm hàng còn sẵn.

## Đo trước/sau

Chạy trên stack development đang mở ở localhost:3000/3001, PostgreSQL development
hiện có; chỉ GET công khai, không ghi dữ liệu. Đo tuần tự bằng Node fetch và
Chromium headless 1440 × 900, không giả lập mạng/CPU. So sánh API bỏ mẫu đầu vì
có khởi động pool; trang chủ dùng đủ ba điều hướng trong cùng browser context.

| Chỉ số | Trước sửa, ba mẫu (ms) | Sau sửa, ba mẫu (ms) | Trung vị |
| --- | --- | --- | --- |
| GET storefront, đọc xong body | 3215 / 3216 / 3174 | 948 / 1233 / 999 | 3215 → 999, giảm khoảng 69% |
| Trang chủ: goto(load) và header hiện | 3852 / 3802 / 3753 | 2017 / 1527 / 1830 | 3802 → 1830, giảm khoảng 52% |

Ba mẫu trang chủ gồm cả lần đầu của browser context; hai lần tải lại sau đó
lần lượt là 3802/3753 ms trước và 1527/1830 ms sau. Mẫu API đầu tiên là
6972 ms trước và 4554 ms sau. Payload cả hai vẫn 148949 byte, có 125 thẻ ảnh;
không suy ra giảm payload từ thay đổi ranh giới server/client.

Đây là phép đo nhỏ trên development, không phải benchmark production hay LCP
(thời điểm nội dung lớn nhất hiện ra). FCP có thể chỉ là dòng loading nên không
dùng để khẳng định nội dung cửa hàng đã sẵn sàng. Không chạy tải đồng thời hoặc
đo trên điện thoại/đường truyền thực. Số liệu sau lưu tại
`front/.visual-review/performance-2026-11-12-after.json` (gitignore).

## Phần còn cần đo nếu vẫn chậm

- Trang sản phẩm vẫn dùng snapshot toàn catalog; cần cân nhắc API riêng theo slug
  và phân trang khi dữ liệu tăng.
- Khôi phục phiên vẫn đợi tài khoản, giỏ, đơn, wishlist và cấu hình trước khi
  `ready=true`; cần tách trạng thái tải nếu đo thấy nhóm không liên quan chặn UI.
- Checkout lấy preview quote rồi xin quote khi submit; giảm truy vấn này cần
  giữ kiểm tra giỏ/địa chỉ, hạn quote và xử lý xung đột từ server.
- Truy vấn song song giảm thời gian chờ một request nhưng tăng sử dụng pool tức
  thời; cần kiểm tải/pool với topology triển khai thật trước khi điều chỉnh thêm.

Ca hồi quy `front/tests/live/performance.spec.ts` giữ request cập nhật catalog
đến sau khi trang kết quả COD hiện, rồi trả 503; kiểm tra đơn vẫn thành công,
thông báo lỗi cập nhật riêng và hủy đơn vẫn có kết quả đúng. Chạy ca này bằng
runner fullstack với schema riêng, không chạy test tạo tài khoản/đơn trên server
development đang mở.

Kết quả kiểm tra build/lint/unit và hành trình browser của lượt này được ghi ở
[PROJECT_STATUS.md](PROJECT_STATUS.md).
