# Khảo sát, kiểm thử và đối chiếu Tin Học Ngôi Sao

Ngày khảo sát: **06/11/2026**, múi giờ Việt Nam. Đối tượng: website công khai [tinhocngoisao.com](https://tinhocngoisao.com/). Mục tiêu: dùng cấu trúc, thứ tự vùng nội dung, bố cục và thao tác của cửa hàng tham khảo làm baseline cho storefront Rigforge.

## Phạm vi và cách hiểu kết quả

Đã dùng Chromium qua Playwright để mở 15 trang đại diện, chụp desktop 1340 px/mobile 390 px, đọc DOM và thực hiện 15 ca khảo sát thao tác/đo responsive. Checkout khách được mở thêm từ giỏ có hàng, không gửi đơn. Danh mục được đo thêm ở 768 px. Đây là khảo sát theo **template và luồng công khai**, không phải chứng nhận đã kiểm thử mọi sản phẩm, mọi tổ hợp bộ lọc, trang quản trị hoặc toàn bộ backend của doanh nghiệp.

- `PASS`: thao tác/điều kiện ghi trong ca đã có assertion kiểm tra.
- `OBSERVED`: nhìn thấy và lưu bằng chứng, chưa đủ xác nhận toàn bộ hành vi. Đặc biệt không coi click sắp xếp hoặc mở modal là chứng minh thuật toán đã đúng.
- `FAIL`: số đo/hành vi không đáp ứng tiêu chí của ca tại lượt chạy.
- `NOT_RUN`: chưa thực hiện, thiếu phiên đăng nhập, dữ liệu hoặc vượt giới hạn khảo sát công khai.

Nguồn kết quả máy đọc được: [manifest bằng chứng](audits/tinhocngoisao-2026-11-06.json). Ảnh/DOM gốc lưu local tại `front/.visual-review/reference-audit/`, được gitignore. Manifest giữ tên, kích thước và SHA-256 của ảnh, không đưa nội dung phiên checkout vào Git. Kế hoạch chi tiết từng thành phần: [ma trận kiểm thử](REFERENCE_SITE_TEST_MATRIX.csv). Các dòng trong ma trận là tiêu chí/coverage, không phải tất cả đều là test tự động đã chạy.

## Các trang đã mở

| Nhóm | URL nguồn | Quan sát chính |
| --- | --- | --- |
| Trang chủ | [/](https://tinhocngoisao.com/) | Header ba lớp, hero/tab, dịch vụ, flash sale, chiến dịch, 9 dải danh mục, directory, brand, tin, showroom, footer |
| Danh mục | [/collections/pc-gaming](https://tinhocngoisao.com/collections/pc-gaming) | Banner ngang, tiêu đề/số lượng, chip nhóm/brand, bộ lọc ngang, nút sort, grid 5 cột, xem thêm, bài tư vấn |
| Tìm kiếm | [/search?type=product&q=rtx](https://tinhocngoisao.com/search?type=product&q=rtx) | Gợi ý Ajax; submit thực tế chuyển từ khóa sang biểu thức tìm kiếm riêng của website |
| Chi tiết | [Bàn phím Rapoo mẫu khảo sát](https://tinhocngoisao.com/products/ban-phim-co-gaming-khong-day-rapoo-v500-pro-87-multi-mode-wireless-3-mode-brown-switch-led-6-mau) | Gallery trái, thông tin/giá/khuyến mãi phải, số lượng, mua/thêm giỏ, mô tả/thông số, đánh giá, đã xem |
| Giỏ | [/cart](https://tinhocngoisao.com/cart) | Rỗng/có hàng, số lượng, xóa, tổng tiền, đi checkout |
| Checkout | Mở từ nút checkout trong giỏ khách | Form người nhận/địa chỉ, lựa chọn giao hàng/thanh toán; chỉ đọc UI |
| Tài khoản | [/account/login](https://tinhocngoisao.com/account/login) | Hai cột đăng nhập và đăng ký; social login phía trên; quên mật khẩu |
| Builder | [/pages/xay-dung-cau-hinh](https://tinhocngoisao.com/pages/xay-dung-cau-hinh) | Banner chính/phụ, chi phí dự tính, thêm giỏ/reset, các dòng chọn linh kiện và modal |
| So sánh | [/pages/so-sanh-san-pham](https://tinhocngoisao.com/pages/so-sanh-san-pham) | Bảng theo hình/giá/tình trạng/loại/biến thể/nhà cung cấp/mô tả |
| Khuyến mãi | [/pages/tong-hop-khuyen-mai](https://tinhocngoisao.com/pages/tong-hop-khuyen-mai) | Trang chiến dịch có header riêng, hero lớn, neo Máy bộ/Laptop/Màn hình/Gear, từng vùng ưu đãi |
| Tin tức | [/blogs/all](https://tinhocngoisao.com/blogs/all) | Search, bài nổi bật bên trái, danh sách quan tâm bên phải, các bài theo hàng phía dưới |
| Showroom | [/pages/he-thong-showroom-1](https://tinhocngoisao.com/pages/he-thong-showroom-1) | Header riêng, hero chữ, ba select, danh sách trái/bản đồ phải, điểm đang chọn |
| Liên hệ | [/pages/thong-tin-lien-he](https://tinhocngoisao.com/pages/thong-tin-lien-he) | Nội dung hỗ trợ, hotline theo mục đích; không gọi điện/gửi yêu cầu |
| Bảo hành | [/pages/tra-cuu-bao-hanh](https://tinhocngoisao.com/pages/tra-cuu-bao-hanh) | Chọn loại tra cứu, từ khóa và nút kiểm tra; không gửi thông tin khách hàng thật |
| Trả góp | [/pages/tra-gop](https://tinhocngoisao.com/pages/tra-gop) | Banner và thông tin theo nhà cung cấp; không đăng ký dịch vụ |
| Chính sách | [/pages/chinh-sach-giao-nhan-hang-va-kiem-hang](https://tinhocngoisao.com/pages/chinh-sach-giao-nhan-hang-va-kiem-hang) | Breadcrumb, tiêu đề, nội dung nhiều mục, showroom/footer dùng chung |

## Kiểm kê UI từ phần tử nhỏ đến bố cục lớn

### Thành phần dùng chung

| Cấp | Thành phần cần ghi nhận | Trạng thái/chi tiết |
| --- | --- | --- |
| Nhỏ | Icon, caret, badge số giỏ, ribbon giảm giá, giá gạch, đơn vị ₫ | Vị trí sát nội dung; phân biệt badge số lượng và tỷ lệ giảm |
| Nhỏ | Button/link/select/input/radio/checkbox | Focus, hover, disabled, nhãn truy cập, bàn phím; tránh button không tên |
| Nhỏ | Giá sản phẩm, khoảng giá, số lượng | Giá hiển thị khác giá gốc; min/max, giá sai định dạng, tồn/giới hạn khuyến mãi |
| Cụm | Header utility | 5 liên kết: khuyến mãi, trả góp, showroom, builder, hỗ trợ |
| Cụm | Header chính | Logo → danh mục → search → tài khoản → giỏ; responsive xuống dòng tìm kiếm |
| Cụm | Mega menu | 11 nhóm cha; panel nhiều cột theo hãng/nhu cầu/giá/thông số; thay panel theo nhóm |
| Cụm | Search | Input, submit, danh sách gợi ý, ảnh/tên/giá, xem thêm; tách gợi ý khỏi sản phẩm ở body |
| Cụm | Dải ưu đãi | 5 pill liên kết; có thể cuộn ngang khi thiếu chiều rộng |
| Cụm | Product card | Ảnh, ribbon, tên nhiều dòng, giá hiện tại/gốc, thông số, thêm giỏ và mua ngay |
| Cụm | Showroom footer | Grid desktop 4×2, số thứ tự, tiêu đề, địa chỉ, tư vấn/giờ/bảo hành |
| Lớn | Footer | 4 nhóm thông tin, dải cam kết, pháp nhân/chứng nhận, liên hệ nổi, lên đầu trang |
| Lớn | Overlay | Popup chiến dịch đầu vào, cookie settings, modal chọn linh kiện, hộp giỏ/so sánh |

Rigforge giữ tên/logo và tông xanh hiện có. Không dùng hotline, địa chỉ pháp nhân, chứng nhận, điều khoản tín dụng hoặc đánh giá khách hàng của doanh nghiệp tham khảo làm thông tin kinh doanh của dự án. Popup marketing/cookie đo lường không tự thêm vào ứng dụng khi chưa có dịch vụ tương ứng.

### Trang chủ

Thứ tự vùng: header/pill → hero ảnh/tab → 4 banner dịch vụ → flash sale → campaign theo nhóm → 9 shelf danh mục → directory 20 nhóm → brand → tổng hợp ưu đãi → blog → 8 showroom → footer. Mỗi shelf có tab đầu, liên kết xem tất cả, banner cạnh trái và rail card bên phải; mobile đổi banner thành vùng ngang và rail cuộn. Kiểm riêng state từng vùng để thay tab blog không đổi tab campaign; nút rail dựa vào chiều rộng card.

### Danh mục/tìm kiếm

Breadcrumb → banner danh mục → tiêu đề/số lượng → chip nhóm → brand → bộ lọc ngang → sort → grid 5 cột → tải thêm/phân trang → bài tư vấn/FAQ. Bộ lọc của nguồn có giá, nhu cầu, hãng, CPU/dòng CPU, RAM/dung lượng RAM, SSD, VGA, mainboard; không mặc định mọi danh mục có cùng facet. Cần có empty, xóa từng điều kiện, xóa tất cả, kết hợp điều kiện và giữ URL khi refresh/Back.

### Chi tiết sản phẩm

Hai vùng trên: gallery/shortcut/chính sách bên trái, tiêu đề/SKU/đánh giá/giá/ưu đãi/phiên bản/số lượng/hành động bên phải. Phần dưới có mô tả và thông số theo hai cột, đánh giá/hỏi đáp, sản phẩm liên quan/đã xem. Gallery nhiều ảnh chỉ có thể nghiệm thu với dữ liệu nhiều ảnh; không tạo thumbnail giả bằng cách lặp một hình. Mọi mua ngay/thêm giỏ phải đi qua cùng quy tắc tồn/giới hạn số lượng.

### Giỏ, checkout và tài khoản

Giỏ phân biệt rỗng/có hàng, từng dòng ảnh/tên/biến thể/giá/quantity/xóa, cột tổng và CTA checkout. Checkout nguồn có thể mở dưới phiên khách; có form họ tên, điện thoại, email tùy chọn, địa chỉ, vùng hành chính, vận chuyển/thanh toán. Rigforge đã chuyển checkout sang một trang với header logo gọn, form trái và giỏ/coupon/tổng bên phải; khách có thể xem form, sửa giỏ và áp mã. Tạo đơn mẫu vẫn cần phiên demo, chưa hỗ trợ đặt đơn vãng lai thật. COD mẫu mặc định `pending`, không tự ghi đã thu tiền. Auth nguồn có hai form cạnh nhau và social login; auth demo của dự án chưa có password/OAuth/backend nên không xem là auth thật đã hoàn tất.

### Builder, showroom, tin và các trang nội dung

Builder nguồn có 15 nhóm chọn, chi phí dự tính phía trên và danh sách dòng; chỉ thử mở picker CPU. Rigforge chuyển sang danh sách rộng phía trên, giữ 8 nhóm linh kiện có dữ liệu tương thích, thêm chi phí/actions và banner đầu. Studio 2D/3D, ngân sách và kiểm tra tương thích nằm phía dưới. Chưa có 15 nhóm, nhiều cấu hình song song hoặc chứng minh tương thích phần cứng thực tế.

Showroom có 3 bộ lọc phụ thuộc, danh sách cuộn và vùng vị trí theo điểm chọn. Tin có lead + sidebar và danh sách hàng; bài chi tiết có sidebar liên quan. Trang campaign có hero/neo/nhóm ưu đãi, tách khỏi template catalog. Chính sách/liên hệ/trả góp của Rigforge giữ nội dung demo và liên kết nội bộ có đích.

## Kết quả thao tác trên nguồn

**15 ca: 11 PASS, 3 OBSERVED, 1 FAIL** theo manifest cuối. Số ca này không bao gồm 15 lần mở/chụp trang theo template.

| Mã | Thao tác/tiêu chí | Kết quả |
| --- | --- | --- |
| REF-01 | Gõ `rtx` bằng bàn phím, gợi ý Ajax xuất hiện | PASS; thấy 10 link sản phẩm trong đúng vùng gợi ý |
| REF-02 | Enter ở search | PASS; chuyển sang `/search` có query riêng của nguồn |
| REF-03 | Bộ lọc công khai | OBSERVED; kiểm kê control, chưa chạy mọi tổ hợp |
| REF-04 | Tăng rồi giảm số lượng chi tiết | PASS; 1 → 2 → 1 |
| REF-05 | Thêm sản phẩm vào giỏ khách | PASS; tên sản phẩm xuất hiện trong giỏ |
| REF-06 | Mở bộ chọn CPU | OBSERVED; modal hiển thị; chưa xây toàn bộ cấu hình nguồn |
| REF-07 | Chọn tỉnh showroom rồi reset | PASS; select đổi về tất cả; chưa thử chỉ đường ngoài website |
| REF-08-390/768 | Danh mục không tràn ngang | PASS tại 390/768 px |
| REF-08-1340 | Danh mục không tràn ngang | FAIL; content 1457 px > viewport 1340 px trong lượt đo |
| REF-09 | Bấm tăng giá và chờ danh sách đổi | OBSERVED; giá hiển thị không tăng đều tại một số cặp; chưa xác minh nguồn sắp theo giá gốc hay giá sau ưu đãi |
| REF-10 | Mở/đóng cookie settings | PASS; không chấp nhận tracking bổ sung |
| REF-11 | Nhập quantity 2 cho hàng khuyến mãi giới hạn 1 | PASS; sau reload về 1; có `data-buyone=True` và điều kiện một chiếc/đơn trên chi tiết |
| REF-12 | Checkout từ giỏ khách | PASS ở mức mở trang; đọc 23 control, không điền/gửi đơn |
| REF-13 | Xóa sản phẩm giỏ khách | PASS; không còn dòng hàng |

Lỗi console quan sát được: `starbapSetting is not defined` ở một số template; `Cannot read properties of undefined (reading 'includes')` ở danh mục; `Cannot set properties of null (setting 'sortby')` ở trang search được mở trực tiếp. Đây là lỗi của phiên khảo sát nguồn, có thể phụ thuộc tài nguyên bên ngoài/trạng thái tải; không kết luận mọi người dùng đều gặp hoặc toàn bộ luồng bị hỏng. Không sao chép các lỗi này vào Rigforge.

## Phần đã áp dụng vào dự án

| Hạng mục | Cài đặt và kiểm chứng |
| --- | --- |
| Header | Menu 11 nhóm có link con, utility/pill 5 mục, gợi ý search local theo tiếng Việt không dấu; mũi tên/Enter/Escape |
| Catalog | Banner, chip, brand, lọc ngang min/max/CPU/RAM/SSD/VGA, chip bỏ lọc, sort theo giá hiển thị, grid 5 cột, 20 sản phẩm/trang; giữ context route category/brand |
| Chi tiết | Gallery trái, phóng to bằng dialog, khuyến mãi nét đứt bên phải, shortcut neo, mô tả và cột thông số dưới |
| Builder | Banner chính/phụ, thanh chi phí/actions, danh sách linh kiện trước vùng studio; giữ kiểm tra tương thích và 3D hiện có |
| Campaign | `/promotions` là trang riêng có hero và 4 neo, banner từng nhóm, card mua/thêm giỏ |
| Tin tức | `/articles` có tìm/lọc, bài lead + danh sách quan tâm + các hàng bài; chi tiết có liên quan |
| Auth | Hai form demo cạnh nhau; đăng ký yêu cầu đồng ý; chưa có password/OAuth/API |
| Showroom | Lọc vùng/tỉnh/điểm, chọn item, reset, vùng vị trí cập nhật; dùng điểm mẫu, bản đồ placeholder |
| Bảo hành | `/warranty` có tra theo serial/số điện thoại mẫu, validation, có kết quả/rỗng; chưa tra cứu hệ thống thật |
| So sánh | Thêm hàng tình trạng, loại và biến thể, giữ so sánh/xóa/lưu local |
| Checkout | Form một trang, header gọn, thay số lượng/xóa hàng/áp mã tại chỗ, validation, snapshot phí/discount; COD mẫu chờ xác nhận |
| Toàn trang | Showroom footer dùng chung; campaign/showroom có header điều hướng gọn riêng; không lặp grid showroom ở trang showroom; responsive và liên kết nội bộ |

## Kiểm tra Rigforge và tiêu chí nghiệm thu còn lại

Suite ở `front/tests/e2e/` kiểm tra tương tác và responsive trên fixture/dev server. Kết quả cuối lint/format/build/test nằm ở [PROJECT_STATUS](PROJECT_STATUS.md). Bộ kiểm tra gồm **39 ca: 21 ca bổ sung cho 18 ca có sẵn**; mỗi ca responsive storefront đi qua 9 template, checkout có kiểm riêng 390/768/1340 px. Có regression đi bằng Link/Back từ campaign → catalog và checkout → cart để kiểm header của URL hiện tại khi Next giữ trang cũ ẩn trong DOM. Landing còn có kiểm tra riêng 360/390/768/1024/1340/1920 px. Không suy ra FE–BE, OAuth, payment hoặc deployment đã qua từ suite này.

Suite local chạy tuần tự `workers: 1`, `retries: 0` sau khi trace của một lượt chạy song song trỏ lỗi JSON tới bộ đọc manifest Next dev trên Windows. Kết quả cuối **39/39 qua**, lint/format/build qua, build sinh 253 trang. Smoke trên artifact với `next start --port 3100` qua 8 trang/2 luồng Link/Back, không pageerror, không request API nghiệp vụ. Script `smoke-storefront-production.mjs` ghi kết quả tại `.visual-review/production-smoke.json`; không phải full production E2E, kiểm FE–BE hoặc qua Nginx.

Smoke đầu đã phát hiện header bị ẩn sai khi từ campaign sang catalog: trang campaign cũ còn trong DOM. Đã sửa bằng marker URL trong layout, giữ SSR/hydration đầu nhất quán rồi áp URL hiện tại. Regression kiểm điều hướng thật và cảnh báo hydration; không dùng reload để né lỗi. Header chuyên biệt cần hydration trước khi hiển thị; chưa đo hiệu ứng chuyển bố cục trên mạng chậm.

**Chưa nghiệm thu bố cục giống hoàn toàn:** gallery nhiều ảnh thật; toàn bộ facet theo từng danh mục; tải thêm dạng nguồn; 15 nhóm builder; social login; review/hỏi đáp/đã xem đầy đủ; bản đồ/chỉ đường thật; nội dung và ảnh chính xác từng SKU. Checkout đã cùng cấu trúc một trang nhưng chưa có địa chỉ hành chính đầy đủ, nhà cung cấp payment và đặt đơn vãng lai thật. Tông màu/nhận diện Rigforge tiếp tục được giữ theo dự án. Chưa có đo sai khác pixel hoặc kiểm tra Safari/Firefox/thiết bị vật lý.

**Chưa nghiệm thu fullstack:** frontend vẫn fixture/localStorage; cần nối Auth/Accounts/Catalog v2 theo contract hiện có, triển khai cart/checkout/order/payment v2, giá/stock từ server, guest cart/merge, idempotency, webhook, ownership và xử lý lỗi thật. Chỉ khi có dữ liệu/test riêng mới kiểm được đơn/hoàn tiền/bảo hành thực tế. Không dùng code Stripe legacy làm bằng chứng runtime v2.

Việc tiếp theo theo thứ tự phụ thuộc: chốt contract khách/vãng lai → dữ liệu catalog/ảnh/facet thật → nối đọc catalog/auth → cart/checkout/order/payment v2 với test nghiệp vụ → nghiệm thu FE–BE → hạ tầng theo DEPLOYMENT_PLAN. Báo cáo này không đánh dấu các bước đó hoàn tất và không tự commit/push/deploy.

## Chạy lại

Từ `front/`, với Playwright/dependencies đã cài:

```powershell
node scripts/audit-reference.mjs
node scripts/audit-reference.mjs https://tinhocngoisao.com/collections/pc-gaming catalog
node scripts/audit-reference-interactions.mjs
node scripts/audit-reference-commerce.mjs
node scripts/summarize-reference-audit.mjs
npm run test:e2e
npm run lint
npm run format:check
npm run build
```

`audit-reference.mjs` nhận URL và tên artifact; lặp cho các URL trong bảng nếu muốn dựng lại toàn bộ snapshot. Script tương tác chỉ dùng giỏ khách tạm thời và đóng context sau chạy; không đăng ký, gửi email/liên hệ hoặc đặt hàng. Chạy có chủ đích, không gắn các script khảo sát website bên ngoài vào build/CI/runtime. Chạy build sau khi server dev dừng vì hiện dev/build dùng chung `.next-local`.

Để smoke artifact local, sau build mở terminal riêng chạy `npm run start -- --port 3100`, rồi chạy `node scripts/smoke-storefront-production.mjs` trong `front/`. Dừng server smoke khi xong. Script chỉ nhận origin localhost/127.0.0.1, không mở checkout của doanh nghiệp tham khảo.
