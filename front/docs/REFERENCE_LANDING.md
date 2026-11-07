# Landing theo ảnh tham khảo

Mốc triển khai: **06/11/2026**. Đầu vào là ảnh `tinhocngoisao.com_.png` người dùng cung cấp, kích thước gốc 1340 × 12863. Giữ trình tự và nhịp bố cục, chuyển màu chủ đạo sang xanh ngọc/xanh đen và giữ thương hiệu Rigforge. Toàn bộ section là HTML/CSS/component, không dùng ảnh chụp dài làm nền trang.

## Phân chia component

`LandingPage` ghép hero → dịch vụ → flash → campaign → 9 `CategoryShelf` → directory → thương hiệu → khuyến mãi → blog. Header, showroom và footer ở layout chung, nên thứ tự hiển thị trên landing vẫn kết thúc bằng showroom → footer. `ProductRail` phụ trách cuộn và nút trước/sau, `ProductCard` phụ trách hiển thị SKU/action. State tab, banner và tìm bài được giữ tại component tương tác tương ứng.

Khảo sát website trực tiếp và các template ngoài landing ngày 06/11/2026: [báo cáo](../../docs/REFERENCE_SITE_AUDIT.md), [ma trận 103 mục](../../docs/REFERENCE_SITE_TEST_MATRIX.csv). Kiểu dáng storefront hiện dùng utility Tailwind v4 ngay trong component; checkout một trang có header gọn và các vùng giỏ/coupon/tổng riêng. Chưa nghiệm thu toàn bộ fullstack hoặc khớp pixel với website nguồn.

Desktop dùng flash 5 card, campaign 6 card và shelf có banner dọc bên trái. Tablet giảm số cột; điện thoại hiển thị 2 card, chuyển banner dọc thành banner ngang, cho tab cuộn và xếp blog/footer thành ít cột hơn. Kích thước do CSS quyết định, không suy ra từ user-agent. Chuyển động cuộn tôn trọng `prefers-reduced-motion`.

Hover/press của control và link chuyển trong 200 ms; card nhấn nhẹ vào viền/shadow, ảnh sản phẩm phóng tối đa 4% trong khung đã clip. Dịch vụ, danh mục và thương hiệu có hover nhẹ; ảnh banner phụ/blog phóng khoảng 3,5%. Rail và phần blog vào mềm khi đổi tab; hiệu ứng dùng utility chung trong `components/ui/motion.ts`. Không animate kích thước section, giữ nguyên responsive và vị trí thanh quảng cáo fixed; reduced motion bỏ các chuyển động này. Hero vẫn giữ tự chuyển 3 giây và hiệu ứng trượt riêng.

## Hero carousel theo ảnh mới — 06/11/2026

Chiều rộng trang chủ dùng chung token `--rf-home-width: 1540px` trong `src/styles/tokens.css`, theo kích thước slide đang có trong workspace. Tất cả section bên dưới, showroom và phần nội dung footer thẳng mép với slide. Gutter hai bên là 64 px từ 1024 px để thanh quảng cáo đang thu không che nút chuyển slide, 16 px trên màn hình nhỏ hơn; chiều rộng thực tế bằng `min(viewport - 2 × gutter, --rf-home-width)`. Header vẫn full width với padding riêng 50 px trên desktop.

Theo yêu cầu tiếp theo ngày 06/11/2026, `StoreLayout` áp dụng cùng giới hạn và gutter cho toàn bộ các trang còn lại; catalog, checkout và minisite không còn khung 1220/1100 px riêng. Hero dùng `w-full` trong container chung. Marker route giữ vai trò điều khiển hiển thị theo URL, kể cả khi Next cache trang cũ. Card/rail, grid dịch vụ, thương hiệu, blog và footer giữ các breakpoint 2/3/4/5/6 cột phù hợp từng khối; rail và tab cuộn nội bộ trên màn hình nhỏ. Kiểm chứng chiều rộng, không tràn ngang và Link/Back tại `tests/e2e/landing-width.spec.ts`, gồm nhiều mẫu trang ở 360/390/768/1024/1920 px.

Nền showroom dùng pseudo-element `100vw` để phủ ngang trang. `StoreLayout` bọc vùng showroom trong khung toàn chiều rộng với `overflow-x-clip`, giới hạn nền theo vùng nội dung thực tế khi thanh cuộn dọc chiếm chỗ (Windows). Chỉ clip vùng showroom; trang và các rail vẫn giữ cơ chế cuộn riêng. Ca regression trong `landing-width.spec.ts` dùng `scrollbar-gutter: stable` và thử cuộn trang ngang tại 390/768/1024/1536/1920 px; cách chỉ so sánh `scrollWidth` với `clientWidth` trên headless mặc định từng bỏ sót lỗi này.

`src/features/landing/components/hero-section.tsx` dùng utility Tailwind CSS v4 để hiển thị banner nguyên vẹn theo tỷ lệ 3:1, không phủ thêm nội dung lên chữ có sẵn trong ảnh. Dữ liệu tại `data/banner-campaigns.ts` ghép đúng caption, alt và liên kết với đủ sáu ảnh `public/images/banners/banner-slider*.webp`; banner ASUS hiển thị đầu tiên. Các thông tin ưu đãi chỉ mô tả asset demo có sẵn, không xác nhận chương trình kinh doanh đang áp dụng.

Khung banner căn giữa và giới hạn bằng `max-w-[var(--rf-home-width)]`; `Image.sizes` khớp giới hạn 1540 px hiện tại. Theo đính chính của người dùng cùng ngày, mũi tên chuyển slide giữ kiểu cũ và luôn hiển thị trong khung ảnh. Hai banner quảng cáo dọc mới là phần khuất 50% ở hai mép màn hình; hover từng banner hoặc focus liên kết sẽ hiện đủ, rời đi sẽ thu lại. Khung ngoài `fixed` giữ vị trí khi cuộn, clip phần nằm ngoài màn hình để tránh tràn ngang. Hiện trên desktop/laptop từ 1024 px; dưới ngưỡng này ẩn để giữ không gian nội dung. Header chính, utility bar, hàng ưu đãi và mega menu dùng toàn bộ chiều ngang với padding hai bên 50 px trên desktop/tablet, 16 px trên mobile dưới 768 px.

Carousel tự chuyển mỗi 3 giây, lặp vòng; có mũi tên trước/sau, kéo chuột hoặc vuốt ngang và hàng nút caption. Nút active có chữ đậm và gạch đỏ theo mẫu. Trên điện thoại, hàng caption cuộn riêng để nút active nằm trong vùng nhìn; banner giữ đầy đủ nội dung. Kéo ngắn trả về slide hiện tại; thao tác kéo không kích hoạt link của banner và không chặn cuộn dọc.

Điều chỉnh độ mượt ngày 07/11/2026: track dùng `translate3d`, `will-change-transform` và transition Tailwind 700 ms với `cubic-bezier(0.22, 0.61, 0.36, 1)`. Hai bản sao đầu/cuối cho phép nối vòng chỉ trượt một chiều rộng ảnh; sau khi trượt xong, đổi sang bản gốc giống hệt không có transition. Clone luôn `inert`/`aria-hidden`, không có ID trùng và không thêm slide vào cây accessibility. Khi người dùng bắt đầu kéo giữa transition, lấy transform đang hiển thị làm điểm bắt đầu để không nhảy tới đích; kéo ngắn vẫn trả về mềm, kể cả ngay sau khi chuẩn hóa vòng lặp. Reduced motion bỏ chuyển động; nhịp tự chuyển vẫn là 3 giây. Hai ca mới trong `hero-carousel.spec.ts` lấy mẫu vị trí từng frame để kiểm bước nối vòng và kiểm giữ vị trí khi ngắt transition bằng kéo chuột.

Nút tạm dừng/bật lại giúp người dùng chủ động đọc ảnh; tự chuyển cũng dừng khi dùng bàn phím trong carousel hoặc bỏ qua tick khi tab trình duyệt bị ẩn. Chọn slide bằng chuột tiếp tục chu kỳ tự chuyển. Slide không active dùng `inert` và `aria-hidden` để tránh focus nhầm; `prefers-reduced-motion` loại bỏ hiệu ứng trượt. Toàn bộ CSS trình bày landing cũ đã chuyển vào utility Tailwind trong từng component, gồm các trạng thái và breakpoint; CSS toàn cục chỉ còn token, mặc định/accessibility và selector layout theo route.

Kiểm thử tương tác tại `tests/e2e/hero-carousel.spec.ts`; đồng hồ Playwright kiểm mốc 2.999/3.000 ms sau khi Next hoàn tất streaming/hydration. Script chụp ảnh `scripts/review-landing.mjs` đợi ảnh của slide active, bỏ qua clone ở đầu track. Kết quả và giới hạn kiểm chứng được ghi tại [PROJECT_STATUS.md](../../docs/PROJECT_STATUS.md).

## Dữ liệu và ảnh

- `src/mocks/reference-catalog.json`: 153 sản phẩm snapshot, 26 nhóm. `catalog.ts` ghép với 31 fixture gốc, giữ nguyên ID/giá của fixture gốc cho giỏ/build cũ.
- `public/images/catalog/`: 153 ảnh WebP được thu gọn tối đa 480 × 480; `SOURCES.json` ghi URL ảnh/trang nguồn. Banner tham khảo có sẵn tại `public/images/banners/`.
- `scripts/prepare-reference-assets.mjs`: tiện ích tải asset chạy thủ công qua Node và Sharp có trong cây dependency Next hiện tại. Không phải lifecycle script, không chạy trong dev/build/browser. Không cần chạy lại để xem hoặc build dự án. Chạy lại sẽ lấy snapshot khác và ghi đè fixture/ảnh, cần review diff.
- Giá gạch ngang, tồn kho, khuyến mãi và bảo hành là fixture. Không coi snapshot là giá hiện hành hoặc xác nhận phân phối chính hãng.
- Sản phẩm snapshot chưa có bộ thông số kỹ thuật để kiểm ráp PC, được đánh dấu `builderEligible=false`. PC Studio tiếp tục dùng các fixture kỹ thuật gốc.
- Timer flash sale là đồng hồ 2 giờ của phiên demo, không phải thời hạn chiến dịch server. Showroom chỉ minh họa bố cục, không sao chép hotline/địa chỉ doanh nghiệp khác.

## Đối chiếu sau từng phần

Đã đọc lại ảnh mẫu và chụp giao diện ở các mốc: header/hero/dịch vụ, flash/campaign, 9 shelf, phần cuối trang; sau đó tinh chỉnh và chụp lại. Ảnh đối chiếu nằm trong `.visual-review/`, được gitignore.

```powershell
# Chạy dev ở terminal riêng, từ front/
npm run dev
# Chụp full-page sau khi cuộn qua các section để tải đủ ảnh lazy
node scripts/review-landing.mjs review
# Hoặc chọn kích thước cụ thể
node scripts/review-landing.mjs tablet 768 1024
```

Script in chiều cao, trạng thái tràn ngang và pageerror; kiểm tra hình ảnh vẫn cần mở ảnh chụp để xem chữ, khoảng cách và bố cục. `.visual-review/reference-*.png` là các lát cắt dùng review local từ ảnh gốc, không được import vào ứng dụng.

## Giới hạn nghiệm thu

Playwright kiểm Chromium, dữ liệu local và dev server; không xác nhận Safari/Firefox/thiết bị vật lý hoặc kết nối FE–BE. 3D và checkout tiếp tục là demo. Chưa có deployment, thanh toán hoặc giao dịch thật. Kết quả chạy gần nhất nằm trong [PROJECT_STATUS.md](../../docs/PROJECT_STATUS.md).
