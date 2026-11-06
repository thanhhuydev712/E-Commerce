# Kế hoạch UI/UX Rigforge

Ngày: **05/11/2026**. Trạng thái: **đề xuất triển khai frontend bằng dữ liệu mẫu**.

**Cập nhật sau triển khai landing:** các quan sát và phần “chưa làm” bên dưới là baseline lúc lập kế hoạch. Cấu trúc/mức hoàn thành mới nhất xem [kiến trúc frontend](FRONTEND_ARCHITECTURE.md) và [hiện trạng dự án](../../docs/PROJECT_STATUS.md). Website tham khảo được người dùng bổ sung sau đó: [Tin Học Ngôi Sao](https://tinhocngoisao.com/).

Người dùng chưa có website tham khảo; ý tưởng nền tảng là cửa hàng công nghệ có trải nghiệm ráp PC sinh động như thật. Đây là kế hoạch, chưa phải các trang đã cài đặt. Chưa kết nối API, database, Stripe, email hoặc dịch vụ vận chuyển.

## 1. Mục tiêu và căn cứ

Xây dựng trải nghiệm liền mạch từ khám phá sản phẩm → chọn SKU → ráp PC hoặc thêm giỏ → đặt hàng mô phỏng → theo dõi và hậu mãi. Có bản đồ quản trị tương ứng database v2 để phát triển sau, không biến 102 bảng thành 102 màn hình CRUD rời rạc.

Căn cứ đã đọc:

- [README dự án](../../README.md), [bối cảnh](../../docs/PROJECT_CONTEXT.md), [hiện trạng](../../docs/PROJECT_STATUS.md), [nghiệp vụ](../../docs/REQUIREMENTS.md), [kiến trúc](../../docs/ARCHITECTURE.md), [chất lượng](../../docs/QUALITY.md).
- [Database v2](../../docs/database/README.md) và [Prisma schema](../../api/prisma/schema.prisma): 102 model đích; backend còn dùng client v1, chưa coi nghiệp vụ v2 là đã chạy.
- [Route trang chủ hiện tại](<../src/app/(store)/page.tsx>), Header, ProductCard, globals.css, dữ liệu mẫu, package.json, tsconfig.json và hướng dẫn Next.js cục bộ. Các file UI cũ đã được thay trong lượt hoàn thiện landing.

Quan sát mã nguồn: có trang chủ, banner, khuyến mãi, nhóm sản phẩm, header/footer và ảnh tĩnh. Header có liên kết login/cart/search nhưng chưa thấy trang tương ứng trong `src/app`. Nhiều top link cùng trỏ `/`; badge giỏ hiển thị số cố định. Card hiện dùng `price: number`, thông số dạng chuỗi và một số nhóm lặp ID; cần chuẩn hóa mock trước khi dùng chung. Chưa chạy giao diện để đánh giá hình thức hoặc kết luận lỗi responsive.

## 2. Hướng thiết kế

**Rigforge: cửa hàng dễ mua + xưởng ráp máy có chiều sâu.** Giữ logo hiện có làm nhận diện tạm thời; ngành hàng demo là PC, linh kiện và gaming gear theo yêu cầu, chưa chốt ngành kinh doanh lâu dài.

| Khu vực | Hướng trình bày | Mục đích |
| --- | --- | --- |
| Storefront | Nền xám sáng, card trắng, chữ tối, khoảng trống rõ | Đọc giá và so sánh thông số nhanh |
| Nhận diện | Xanh emerald cho hành động chính, đỏ cho giá ưu đãi/lỗi, amber cho cảnh báo | Thống nhất ý nghĩa màu; không dùng màu làm tín hiệu duy nhất |
| PC Studio | Nền graphite, ánh sáng có kiểm soát, vật liệu kim loại/kính | Tập trung vào máy đang lắp; panel chữ vẫn có độ tương phản tốt |
| Tài khoản | Gọn, ưu tiên tiến độ đơn và việc cần làm | Tìm đơn, thanh toán lại, yêu cầu hỗ trợ dễ dàng |
| Admin | Layout phục vụ công việc, bảng rõ, bộ lọc và lịch sử cạnh nhau | Giảm sai thao tác vận hành |

Đề xuất token ban đầu: nền `#F5F6F8`, surface `#FFFFFF`, chữ `#111827`, primary `#047857`, sale `#B91C1C`, studio `#10141B`; kiểm tra tương phản ở từng tổ hợp khi triển khai. Spacing theo bội số 4px; bo góc 8/12/16px; cỡ chữ nội dung 14–16px, không thu nhỏ bảng thông số quá mức. Rà font hiện tại với dấu tiếng Việt trước khi giữ hoặc thay.

Desktop dùng khung nội dung khoảng 1280–1440px; banner có thể rộng hơn. Mobile thiết kế từ 360px, danh sách sản phẩm hai cột khi đủ chỗ; bộ lọc dạng drawer; nút mua và tổng tiền có thanh cố định tránh che nội dung. Studio mobile ưu tiên danh sách linh kiện, xem 3D theo yêu cầu. Admin có sidebar thu gọn; bảng rộng cuộn trong vùng bảng, không làm tràn cả trang.

## 3. Bản đồ toàn bộ trang

Đường dẫn dưới đây là đề xuất URL. `[id]`, `[slug]` biểu thị trang động; thao tác tạo/sửa có thể là trang con hoặc drawer tùy độ dài form. P1–P6 là thứ tự trong mục 10, không phải trạng thái hoàn thành.

### 3.1 Cửa hàng và nội dung

| Trang / URL | Thành phần và tương tác chính | Dữ liệu làm căn cứ | Đợt |
| --- | --- | --- | --- |
| `/` | Header, mega menu, tìm kiếm, hero, danh mục, ưu đãi, sản phẩm, CTA ráp PC, bài viết, footer | Banner, Category, Collection, Product, Promotion, Article | P1 |
| `/products` | Grid/list, lọc thuộc tính/giá/thương hiệu/tồn, sắp xếp, phân trang | Product, ProductVariant, Brand, AttributeDefinition, VariantPrice | P2 |
| `/categories/[slug]` | Breadcrumb cây danh mục, nhóm con, filter theo ngành hàng | Category, ProductCategory, CategoryAttribute | P2 |
| `/search?q=...` | Gợi ý, kết quả, truy vấn rỗng, không tìm thấy, xóa bộ lọc | Catalog; lịch sử tìm kiếm chỉ local | P2 |
| `/products/[slug]` | Gallery/zoom, chọn SKU, giá/tồn, bảo hành, thông số, review, so sánh, thêm giỏ | ProductMedia, MediaAsset, ProductOption/Value, VariantOptionValue, VariantAttributeValue, Review, WarrantyPolicy | P2 |
| `/brands`, `/brands/[slug]` | Danh sách hãng, giới thiệu, sản phẩm lọc theo hãng | Brand, Product | P2 |
| `/collections/[slug]` | Landing bộ sưu tập/cấu hình mẫu, lọc sản phẩm | Collection, CollectionProduct | P2 |
| `/promotions`, `/promotions/[id]` | Ưu đãi, điều kiện, mã giảm giá, sản phẩm áp dụng, hết hạn | Promotion, Coupon, PromotionProduct, PromotionCategory | P2 |
| `/compare` | Chọn tối đa 4 sản phẩm, nhóm thông số, chỉ hiện khác biệt, bỏ mục | Thuộc tính catalog; danh sách chọn local, chưa có model riêng | P2 |
| `/pc-builder` | Chọn linh kiện, kiểm tra tương thích, tổng tiền, cấu hình đề xuất | Catalog + dữ liệu builder bổ sung, xem mục 6 | P3 |
| `/pc-builder/saved`, `/pc-builder/saved/[id]` | Danh sách cấu hình lưu, mở lại, nhân bản, xóa, in bảng kê | Lưu local trong demo; chưa có model PC build | P3 |
| `/articles`, `/articles/[slug]` | Tin/hướng dẫn, phân trang, nội dung, bài liên quan | Article | P5 |
| `/pages/[slug]` | Giới thiệu, liên hệ, chính sách giao/đổi trả/bảo hành, riêng tư, điều khoản | ContentPage; nội dung demo ghi rõ tính minh họa | P5 |
| `/showrooms` | Địa điểm, giờ mở cửa, chỉ dẫn dạng link | Nội dung CMS mẫu; Warehouse không mặc định là cửa hàng công khai | P5 |
| `/support` | Trung tâm trợ giúp, FAQ, lối vào ticket, giải thích hậu mãi | ContentPage, SupportTicket | P5 |

Trả góp nếu đưa lên menu sẽ là nội dung giải thích mô phỏng, chưa có tích hợp tài chính hoặc bảng hợp đồng trả góp. Không hiển thị lời hứa dịch vụ mà chưa có chính sách.

### 3.2 Auth, giỏ hàng, checkout

| Trang / URL | Thành phần và trạng thái | Dữ liệu làm căn cứ | Đợt |
| --- | --- | --- | --- |
| `/login`, `/register` | Form, validation, hiện mật khẩu, thông báo, quay lại bước trước | User, AuthSession; phiên demo local | P4 |
| `/forgot-password`, `/reset-password`, `/verify-email` | Nhập email/mã mẫu, hết hạn, dùng lại mã, gửi lại mô phỏng | AuthChallenge; chưa gửi email thật | P4 |
| `/cart` | Dòng SKU, số lượng, xóa/undo, mã giảm giá, ước tính tổng, hết hàng | Cart, CartItem, VariantPrice, InventoryBalance, Coupon | P4 |
| `/checkout` | Form một trang: thông tin/giao hàng/thanh toán trái; giỏ/coupon/tổng phải; validation và phản hồi thay đổi giá | CheckoutSession, Address, ShippingMethod/Zone/Rate, TaxClass/Rate | P4 |
| `/checkout/payment` | Chọn kịch bản thành công/thất bại/đang xử lý, retry mô phỏng | Payment, PaymentAttempt | P4 |
| `/checkout/result/[id]` | Kết quả theo dữ liệu mock, mã đơn, bước tiếp theo, xem đơn | Order, Payment, OrderStatusHistory | P4 |

Giỏ khách được lưu local; demo hợp nhất theo variant và giới hạn số lượng khi đăng nhập. Theo thiết kế v2, tạo đơn yêu cầu tài khoản. Sau khảo sát 06/11/2026, khách xem được form checkout một trang, sửa giỏ và coupon; tạo đơn vẫn dẫn tới login rồi quay lại checkout, chưa có guest order. Toàn bộ thanh toán có nhãn **mô phỏng**, không thu thập thông tin thẻ thật; COD mẫu giữ `pending`, URL kết quả không tự quyết định trạng thái trả tiền. Xem [báo cáo đối chiếu](../../docs/REFERENCE_SITE_AUDIT.md) cho phạm vi đã kiểm và phần chưa thực hiện.

### 3.3 Tài khoản và hậu mãi

| Trang / URL | Thành phần và hành động chính | Model | Đợt |
| --- | --- | --- | --- |
| `/account` | Tổng quan, đơn gần đây, thông báo, lối tắt | User, Order, Notification | P5 |
| `/account/profile` | Hồ sơ, validation, lưu/hoàn tác | User | P5 |
| `/account/security`, `/account/sessions` | Đổi mật khẩu, danh sách thiết bị, thu hồi phiên mô phỏng | AuthSession, AuthChallenge | P5 |
| `/account/addresses` | Thêm/sửa, mặc định, form địa chỉ có cấu trúc | Address | P5 |
| `/account/orders`, `/account/orders/[id]` | Lọc đơn, snapshot hàng/địa chỉ, tổng tiền, timeline, hủy có điều kiện | Order, OrderItem, OrderAddress, OrderItemTax, OrderDiscount, OrderStatusHistory | P5 |
| `/account/orders/[id]/tracking` | Nhiều kiện, sản phẩm từng kiện, sự kiện giao hàng | Shipment, ShipmentItem, ShipmentEvent | P5 |
| `/account/orders/[id]/payment` | Các lần thanh toán, tiền đã thu/đã hoàn, thử lại hợp lệ | Payment, PaymentAttempt, PaymentTransaction, Refund | P5 |
| `/account/orders/[id]/documents` | Bản xem/in chứng từ demo, điều chỉnh | Invoice, InvoiceLine, CreditNote | P5 |
| `/account/returns`, `/account/returns/new?order=...`, `/account/returns/[id]` | Chọn dòng/số lượng, lý do, ảnh mẫu, tiến độ, kết quả kiểm tra/hoàn | ReturnRequest/Item/Inspection/Receipt, RefundAllocation, OrderLink | P5 |
| `/account/warranties`, `/account/warranties/[id]` | Serial hàng đã mua, chính sách, tạo yêu cầu, timeline bảo hành | SerialUnit, WarrantyPolicy, WarrantyClaim, WarrantyEvent | P5 |
| `/account/wishlist` | Sản phẩm yêu thích, đổi SKU, thêm giỏ | Wishlist, WishlistItem | P5 |
| `/account/reviews` | Đơn đủ điều kiện, viết/sửa đánh giá, ảnh, trạng thái duyệt | Review, ReviewMedia, ReviewVote | P5 |
| `/account/notifications`, `/account/preferences` | Đọc/chưa đọc, loại thông báo và lựa chọn nhận | Notification, NotificationPreference | P5 |
| `/account/support`, `/account/support/new`, `/account/support/[id]` | Tạo ticket, hội thoại, file mẫu, đóng/mở theo kịch bản | SupportTicket, SupportMessage, SupportAttachment | P5 |

Trạng thái đơn, tiền và giao hàng dùng badge riêng. Đơn đã thanh toán có thể chưa giao; hủy đơn chưa đồng nghĩa đã hoàn tiền. Chính sách hủy/đổi/bảo hành là giả định demo cần ghi rõ, chưa được xem là chính sách bán hàng đã chốt.

### 3.4 Quản trị và vận hành

Admin có shell riêng, menu theo nhóm công việc. Danh sách có tìm kiếm, lọc, phân trang, chọn dòng khi phù hợp; chi tiết có lịch sử và hành động có điều kiện. Quyền trong mock chỉ phục vụ trình diễn UI.

| Nhóm / URL đề xuất | Màn hình và thành phần | Model | Đợt |
| --- | --- | --- | --- |
| `/admin` | Tổng quan đơn, doanh thu mẫu, hàng sắp hết, việc cần xử lý; định nghĩa chỉ số rõ | Tổng hợp order/payment/inventory | P6 |
| `/admin/products`, `/admin/products/new`, `/admin/products/[id]` | Editor tab nội dung/SKU/option/thông số/giá/media/bảo hành, preview | Product, ProductVariant, ProductOption/Value, VariantOptionValue, ProductAttributeValue, VariantAttributeValue, VariantPrice, ProductMedia | P6 |
| `/admin/categories`, `/admin/brands`, `/admin/attributes`, `/admin/media` | Cây danh mục, hãng, thuộc tính/đơn vị, thư viện ảnh mẫu | Category, ProductCategory, Brand, AttributeDefinition, CategoryAttribute, MediaAsset | P6 |
| `/admin/orders`, `/admin/orders/[id]` | Workbench đơn, snapshot, timeline, ghi chú nội bộ, giao từng phần, đơn thay thế | Order và các bảng con, OrderNote, OrderLink | P6 |
| `/admin/payments`, `/admin/payments/[id]`, `/admin/refunds` | Attempt/transaction, số thu/hoàn, phân bổ hoàn, hành động theo số dư | Payment, PaymentAttempt, PaymentTransaction, Refund, RefundAllocation | P6 |
| `/admin/reconciliation`, `/admin/reconciliation/[id]` | Phiên đối soát, chênh lệch, chi tiết bằng chứng mẫu | ReconciliationRun, ReconciliationIssue, ProviderEvent | P6 |
| `/admin/inventory`, `/admin/inventory/movements`, `/admin/inventory/reservations` | Số dư theo kho/SKU, available/reserved/unavailable, lịch sử giữ/giải phóng | InventoryBalance, InventoryMovement, StockReservation | P6 |
| `/admin/warehouses`, `/admin/suppliers`, `/admin/suppliers/[id]` | Kho, nhà cung cấp, SKU cung ứng, giá/lead time mẫu | Warehouse, Supplier, SupplierVariant | P6 |
| `/admin/purchases`, `/admin/purchases/[id]`, `/admin/receipts`, `/admin/receipts/[id]` | Đơn mua, nhập từng phần, kiểm tra dòng hàng và số lượng | PurchaseOrder/Item, GoodsReceipt/Item | P6 |
| `/admin/transfers`, `/admin/transfers/[id]`, `/admin/stock-counts`, `/admin/stock-counts/[id]` | Chuyển kho, kiểm đếm, chênh lệch, lý do điều chỉnh | StockTransfer/Item, StockCount/Item | P6 |
| `/admin/shipping`, `/admin/shipments`, `/admin/shipments/[id]` | Phương thức/vùng/phí, đóng gói, nhiều kiện, tracking | ShippingMethod/Zone/Rate, Shipment/Item/Event | P6 |
| `/admin/returns`, `/admin/returns/[id]` | Tiếp nhận, kiểm tra, kết quả nhập lại/cách ly, đề nghị hoàn | ReturnRequest/Item/Inspection/Receipt | P6 |
| `/admin/serials`, `/admin/serials/[id]`, `/admin/warranties`, `/admin/warranties/[id]`, `/admin/warranty-policies` | Vòng đời serial, yêu cầu và lịch sử bảo hành | SerialUnit, SerialUnitEvent, WarrantyClaim, WarrantyEvent, WarrantyPolicy | P6 |
| `/admin/promotions`, `/admin/promotions/[id]`, `/admin/coupons` | Điều kiện, phạm vi, thời hạn, giới hạn lượt, lịch sử dùng | Promotion/Product/Category, Coupon, PromotionRedemption | P6 |
| `/admin/customers`, `/admin/customers/[id]`, `/admin/roles` | Hồ sơ, phiên, đơn/ticket liên quan, ma trận quyền | User, Address, AuthSession, Role, Permission, UserRole, RolePermission | P6 |
| `/admin/content/pages`, `/admin/content/articles`, `/admin/content/banners`, `/admin/content/collections` | Danh sách/editor/preview, lịch xuất bản mẫu | ContentPage, Article, Banner, Collection, CollectionProduct | P6 |
| `/admin/reviews`, `/admin/support`, `/admin/support/[id]` | Kiểm duyệt, hàng đợi hỗ trợ, hội thoại, tệp mẫu | Review/Media/Vote, SupportTicket/Message/Attachment | P6 |
| `/admin/documents`, `/admin/documents/[id]` | Tra cứu chứng từ, xem/in, credit note | Invoice, InvoiceLine, CreditNote | P6 |
| `/admin/settings`, `/admin/settings/taxes`, `/admin/settings/notifications` | Thiết lập cửa hàng, currency, thuế, mẫu tùy chọn/thông báo | StoreSetting, Currency, TaxClass, TaxRate, NotificationPreference/Delivery | P6 |
| `/admin/audit`, `/admin/operations` | Nhật ký chỉ đọc, sự kiện lỗi mẫu, retry mô phỏng có điều kiện | AuditLog, ProviderEvent, OutboxEvent, IdempotencyKey, NotificationDelivery | P6 |

Các bảng nối không cần trang riêng. Challenge/token/idempotency payload không đưa thành form sửa tùy ý hoặc hiển thị secret. Supplier là nguồn nhập hàng của cửa hàng, chưa có cổng seller. Đồ thị doanh thu là dữ liệu tổng hợp demo, chưa có hệ thống analytics độc lập. Chưa thêm loyalty, ví, marketplace hoặc AI gợi ý.

### 3.5 Trang và trạng thái hệ thống

Có `not-found`, lỗi có nút thử lại, loading skeleton, danh sách rỗng, không có quyền demo, phiên hết hạn, SKU ngừng bán, đơn không tồn tại, tài nguyên mất ảnh. Mỗi trang động phải có đường quay lại hợp lý. Bộ chọn kịch bản dành cho phát triển có thể đặt ở `/dev/scenarios`; chỉ bật ở chế độ demo/dev, không trộn công cụ này vào trải nghiệm khách hàng chính.

## 4. Thành phần dùng chung

| Nhóm | Thành phần cần có |
| --- | --- |
| Nền UI | Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Badge, Tooltip, Tabs, Accordion |
| Overlay | Dialog xác nhận, Drawer/Sheet, Popover; focus trap, Escape, trả focus về nút mở |
| Phản hồi | Toast, Alert, Skeleton, EmptyState, ErrorState, LoadingButton, thông báo screen reader |
| Điều hướng | StoreHeader, MegaMenu, SearchBox, Breadcrumb, Footer, AccountNav, AdminSidebar, Pagination |
| Catalog | ProductCard, ProductGrid, ProductGallery, VariantPicker, Price, Availability, SpecTable, FilterPanel, CompareTray, ReviewSummary |
| Giao dịch | QuantityInput, CartLine, CouponForm, AddressForm, ShippingOption, OrderSummary, StatusBadge, Timeline, PaymentHistory |
| Quản trị | DataTable, FilterBar, DetailPanel, FormSection, MoneyInput, MediaPicker mẫu, PermissionMatrix, AuditTimeline |
| Builder | ComponentSlot, ComponentPicker, CompatibilityPanel, BudgetMeter, BuildSummary, StudioViewport, SceneControls, AssemblyProgress |

Hợp nhất card và định dạng giá trước; tái sử dụng section trang chủ khi phù hợp. Header/Footer đưa về layout storefront để trang con dùng chung. Không chuyển toàn bộ cây ứng dụng thành Client Component chỉ để quản lý giỏ.

## 5. Các luồng UX phải hoàn chỉnh

1. **Mua lẻ:** danh mục/tìm → chi tiết → chọn SKU hợp lệ → thêm giỏ → đổi số lượng → checkout → kết quả demo → đơn.
2. **Ráp PC:** chọn nhu cầu/ngân sách hoặc bắt đầu trống → chọn linh kiện → giải quyết xung đột → xem lắp ráp → lưu/in → thêm các SKU vào giỏ.
3. **Sau mua:** chi tiết đơn → xem từng kiện → chọn sản phẩm cần trả/bảo hành → tạo yêu cầu → timeline → hoàn tiền/chứng từ mẫu.
4. **Vận hành:** đơn mới → kiểm tra tiền/tồn → tạo kiện → theo dõi → hoàn tất; đường trả hàng đi qua kiểm tra rồi mới quyết định nhập kho và hoàn tiền.

Mỗi luồng có cả đường thành công và đường thất bại. Khi đổi CPU làm mainboard không phù hợp, giữ lựa chọn cũ và chỉ rõ xung đột; người dùng quyết định thay thế. Khi đổi SKU hoặc số lượng, phần tóm tắt cập nhật đồng bộ. Không tự xóa sản phẩm hoặc thay giá âm thầm.

## 6. PC Builder và PC Studio

### 6.1 Bố cục và thao tác

Desktop: cột trái là danh sách CPU, mainboard, RAM, GPU, lưu trữ, PSU, case, tản nhiệt và fan; giữa là viewport; bên phải là ngân sách/tổng tiền/tương thích. Màn hình vừa gộp tổng kết thành panel; mobile dùng tab **Linh kiện / Xem máy / Tổng kết** và drawer chọn sản phẩm. Màn hình, chuột, bàn phím là phụ kiện tùy chọn, không tính là bộ phận trong case.

- Có preset theo nhu cầu và ngân sách bằng quy tắc mẫu, không gắn nhãn AI.
- Picker hiển thị SKU, thông số liên quan, giá, tồn, mức tương thích và lý do; cho xem cả lựa chọn không tương thích kèm giải thích.
- Hỗ trợ chọn bằng click/bàn phím; kéo thả là thao tác bổ sung. Có thay thế, bỏ linh kiện, undo/redo, reset có xác nhận, lưu tên cấu hình.
- Khi thêm giỏ, chuyển thành các dòng SKU thông thường. Tên nhóm cấu hình chỉ là metadata local trong demo; chưa giả định CartItem hỗ trợ bundle hoặc dịch vụ lắp đặt.
- Lưu cấu hình bằng localStorage có phiên bản. In bảng kê qua print stylesheet; chia sẻ bằng file JSON có validate khi nhập. Link public đồng bộ nhiều thiết bị để giai đoạn sau vì chưa có lưu trữ build ở server.

### 6.2 Kiểm tra tương thích

Mỗi kết quả có ba mức: **phù hợp theo dữ liệu mẫu / xung đột / chưa đủ dữ liệu**, kèm lý do và linh kiện liên quan. Không dùng một badge xanh đại diện cho mọi kiểm tra chưa thực hiện.

| Kiểm tra | Dữ liệu cần | Phản hồi |
| --- | --- | --- |
| CPU ↔ mainboard | Socket, chipset hỗ trợ, phiên bản BIOS tối thiểu | Lệch socket là lỗi; BIOS chưa rõ là cần xác minh |
| RAM ↔ mainboard/CPU | DDR generation, số khe, dung lượng tối đa, kit và tốc độ hỗ trợ | Lệch DDR là lỗi; cấu hình tốc độ chưa chắc là cảnh báo |
| Mainboard ↔ case | Form factor và danh sách case hỗ trợ | Sai kích thước là lỗi |
| GPU ↔ case/PSU | Chiều dài, độ dày, khoảng trống thực tế, đầu cấp điện | Vướng kích thước/thiếu đầu nguồn là lỗi |
| Cooler ↔ CPU/case/RAM | Mount/socket, chiều cao, radiator support, clearance | Thiếu dữ liệu khe hở là chưa xác minh |
| Storage ↔ mainboard | SATA/M.2, NVMe/key/size, số cổng, chia sẻ lane | Vượt cổng là lỗi; lane chưa rõ là chưa xác minh |
| PSU ↔ toàn bộ máy | Công suất ước tính, headroom cấu hình, đầu nguồn, form factor | Hiện mức ước tính và giả định, không bảo đảm điện/nhiệt thực tế |
| Khả năng xuất hình | iGPU/CPU và GPU rời, cổng màn hình | CPU không iGPU mà thiếu GPU phải giải thích rõ |
| Hoàn thành cấu hình | Bộ phận bắt buộc theo preset, số lượng và available | Chặn thêm cả cấu hình khi thiếu phần bắt buộc/xung đột chắc chắn |

Schema có thuộc tính tổng quát (`AttributeDefinition`, `ProductAttributeValue`, `VariantAttributeValue`) làm nền tảng lưu thông số, **chưa có** PCBuild/BuildItem, bộ quy tắc tương thích, vị trí gắn 3D hoặc catalog model 3D chuyên biệt. Cần bộ thuộc tính có đơn vị/giá trị chuẩn và quy tắc riêng; không so khớp chuỗi tên sản phẩm. Không sửa schema trong nhiệm vụ lập kế hoạch này.

Demo dùng `builder-specs`, `compatibility-rules`, `build-presets`, `scene-manifest` riêng. Sau này đánh giá các entity PCBuild/PCBuildItem, version quy tắc và liên kết asset khi cần lưu/chia sẻ thật. Collection chỉ là nhóm sản phẩm, không thay thế cấu hình có slot/số lượng.

### 6.3 Kịch bản animation chân thực

| Sự kiện | Hình ảnh mong muốn | Điều khiển và giới hạn |
| --- | --- | --- |
| Vào Studio | Case trên bàn, ánh sáng studio, góc nhìn ba phần tư | Hiện ảnh preview trước, người dùng bật 3D |
| Chuẩn bị lắp | Mở panel hông, đánh dấu vị trí linh kiện | Có bỏ qua/chạy lại, không ép xem mỗi lần |
| Chọn mainboard | Board đi theo đường lắp vào tray, cố định đúng vị trí | Transform dựa trên anchor và kích thước chuẩn |
| Lắp CPU/RAM/SSD | Camera tiến gần socket/khe, linh kiện đi vào vị trí | Nhấn chọn thay cho kéo chính xác; chuyển động ngắn |
| Lắp cooler/GPU/PSU | Chuyển động theo hướng lắp, hiện khoảng hở | Tách lắp cụm ngoài case khi cần; không xuyên hình học |
| Xem cấu trúc | Exploded view tách các bộ phận có nhãn, quay/zoom | Có nút reset camera và chuyển về lắp hoàn chỉnh |
| Thay linh kiện | Tháo bộ phận cũ rồi lắp mới, cập nhật cảnh báo | Chọn liên tiếp thì hủy animation cũ, đồng bộ về lựa chọn mới nhất |
| Hoàn thành | Đóng panel, bấm bật máy, quạt/RGB sáng dần | Chỉ mô phỏng; không giả lập POST, benchmark hay kiểm định thực tế |
| Lưu cấu hình | Tạo ảnh xem trước nếu khả thi, thông báo lưu | Ảnh lỗi vẫn lưu danh sách SKU; không chặn thao tác |

Animation không được quyết định dữ liệu. Build state là nguồn trạng thái; scene chỉ thể hiện trạng thái đó. Thiết kế state riêng cho `idle/loading/assembling/ready/error`, có skip/cancel; chuyển tab, undo, xóa hoặc đổi SKU giữa animation đều phải đưa scene về đúng cấu hình cuối.

### 6.4 Công nghệ, asset và trade-off

Đề xuất thử nghiệm Three.js + React Three Fiber cho cảnh 3D có tương tác trong React. Đây là dependency mới cho nhu cầu cụ thể: camera, model có chiều sâu, vật liệu và chuyển động lắp ráp. Tài liệu chính thức xác định Fiber là renderer của Three.js và yêu cầu ghép major với React; cần chọn bản phù hợp React 19 trong manifest khi thực hiện, chưa cài hoặc khóa phiên bản ở lượt này. [Nguồn](https://r3f.docs.pmnd.rs/getting-started/introduction).

UI thông thường dùng CSS transition/keyframes trước. Chỉ cân nhắc thêm thư viện timeline nếu thử nghiệm lắp ráp cho thấy cần điều phối phức tạp; không mặc định cài đồng thời nhiều animation engine.

**Độ chân thực đến từ asset:** cần model có tỷ lệ thật, pivot đúng, anchor lắp, vật liệu kính/kim loại/nhựa, texture và ánh sáng. Mỗi asset có nguồn/license, SKU áp dụng, kích thước, mesh, vị trí socket/khe, mức chi tiết và ảnh fallback. Chưa có asset 3D trong `front/public` đã khảo sát; ảnh banner hoặc sản phẩm không tự trở thành model 3D.

Bắt đầu một case, một form factor mainboard, một hệ CPU, một kit RAM, một GPU, PSU, SSD và cooler được dựng kỹ. Cho phép SKU chưa có model dùng hình đại diện hoặc model chung có nhãn minh họa; không ngụ ý mô hình đúng từng chi tiết. Mở rộng thư viện chỉ sau khi pipeline asset và đo hiệu năng đạt yêu cầu. Cáp và va chạm hình học đầy đủ có chi phí lớn; đợt đầu dùng đường đi định trước và số cáp minh họa hạn chế.

### 6.5 Hiệu năng và khả năng tiếp cận

- Lazy-load renderer trong Client Component của builder; storefront không tải thư viện 3D. `ssr: false` nếu cần chỉ khai báo từ Client Component, theo guide Next.js cục bộ.
- Có tiến độ tải, retry, ảnh preview và chế độ danh sách/2D nếu WebGL không hỗ trợ, context bị mất hoặc asset lỗi. 3D lỗi không làm mất cấu hình hoặc chặn thêm giỏ.
- Ưu tiên render theo nhu cầu khi cảnh đứng yên, giảm chất lượng theo thiết bị và dừng loop khi tab ẩn. Khi bật quạt/RGB liên tục phải có cơ chế chạy/dừng và invalidate phù hợp. [Hướng dẫn hiệu năng Fiber](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
- Tôn trọng tùy chọn giảm chuyển động của hệ điều hành; bỏ camera bay/auto-rotate, dùng đổi trạng thái tức thì hoặc fade nhẹ, vẫn giữ đủ thông tin. Có công tắc tắt animation; âm thanh nếu thêm thì mặc định tắt. [MDN về prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).
- Cảnh 3D có bản tóm tắt DOM và nút điều khiển có nhãn; không yêu cầu thị giác/kéo chuột để hoàn tất build. Vùng chạm mục tiêu 44px; keyboard focus rõ; carousel có dừng tự động.
- Ngân sách đề xuất để thử nghiệm, chưa đo: asset cảnh ban đầu tải nén ≤ 8 MB, trì hoãn asset khác đến khi chọn; mục tiêu 60 FPS desktop và ≥ 30 FPS mobile ở mức phù hợp. Ghi thiết bị/trình duyệt/kết nối thực đo trước khi nghiệm thu, điều chỉnh chất lượng hoặc chuyển 2D khi không đạt.

## 7. Kiến trúc frontend và mock

Cấu trúc dự kiến, tạo dần theo từng đợt:

```text
front/
  docs/UI_UX_PLAN.md
  src/app/
    layout.tsx
    (store)/                 # Trang công khai + layout Header/Footer
    (auth)/                  # Auth layout gọn
    (customer)/account/      # Layout tài khoản
    (checkout)/checkout/     # Layout tập trung checkout
    (admin)/admin/           # Layout quản trị
    dev/scenarios/           # Công cụ demo khi bật chế độ phát triển
  src/components/            # UI primitives và layout dùng chung
  src/features/
    catalog/ cart/ checkout/ account/ orders/ pc-builder/ admin/
  src/mocks/
    fixtures/                # Catalog, người dùng giả, đơn, thanh toán...
    scenarios/               # Loading, lỗi, hết hàng, refund một phần...
    repositories/            # Đọc/ghi dữ liệu giả qua interface
  src/lib/                   # Money, format, storage, validation dùng chung
  public/models/             # Asset được tối ưu + nguồn/license
```

Chuyển `(landing)` sang `(store)` khi làm shell; chỉ giữ một route `/`, tránh hai route group cùng định nghĩa trang chủ. Alias hiện là `@/*` → `./*`, nên import từ `src` dùng `@/src/...`; không tự chuyển thành `@/features` khi chưa sửa cấu hình có chủ đích.

Page/layout tĩnh giữ Server Components; catalog mock có thể render ở server. Picker, form, giỏ local và scene là Client Components ở phạm vi cần tương tác. Không import Prisma hoặc generated client backend vào frontend.

Luồng dữ liệu: **fixture → mock repository → view model → component → action/reducer → mock repository/local storage → UI mới**. Interface đủ theo use case, ví dụ đọc catalog/chọn variant/cập nhật giỏ/tạo đơn demo; sau này adapter API thay repository, không buộc component biết shape Prisma.

- ID dạng chuỗi, duy nhất xuyên fixture; cart item trỏ variant, không chỉ product.
- `Money` gồm `amountMinor: string` + `currency: string`; mock VND exponent 0 là giả định demo. Không đổi USD thành VND bằng đổi nhãn; không dùng floating point tính tổng. Chuyển chuỗi sang BigInt trong utility khi tính và trở lại chuỗi ở dữ liệu lưu/truyền.
- Dùng một format/rounding policy nhất quán; giá/tổng demo từ catalog và quy tắc mock. Khi nối API, server sẽ tính lại toàn bộ.
- Lưu local có version, kiểm tra dữ liệu lỗi, reset được; chỉ lưu thông tin giả và trạng thái demo, không password/token/thẻ thật.
- Đơn mẫu có snapshot độc lập: đổi giá hoặc địa chỉ catalog/tài khoản không làm thay đổi đơn cũ.
- Fixture có thời gian cố định hoặc clock được truyền vào; không ngẫu nhiên trong render gây khác biệt server/client. Countdown ưu đãi dùng mốc demo có thể reset và có trạng thái kết thúc.
- Repository mô phỏng chờ/lỗi có thể điều khiển; không gọi backend hay dùng Next API route làm backend tạm. Upload chỉ preview tệp local, không gửi đi.

## 8. Bộ dữ liệu và trạng thái nghiệm thu

Đề xuất bộ đầu: 40–60 sản phẩm đủ nhóm linh kiện/peripheral, một số sản phẩm nhiều SKU; ảnh riêng cho nhóm chính; 3 preset PC; 2 kho giả; 3 hồ sơ giả; 8–12 đơn phủ trạng thái khác nhau; ưu đãi/coupon; bài viết/ticket/review minh họa. Số lượng là mục tiêu đủ phủ giao diện, không phải dữ liệu đã tồn tại.

| Miền | Kịch bản bắt buộc |
| --- | --- |
| Catalog | Có dữ liệu, đang tải, lỗi + retry, rỗng, không kết quả, thiếu ảnh, SKU ngừng bán, hết hàng |
| Builder | Đủ/thiếu linh kiện, xung đột socket/DDR/kích thước, thiếu thông số, BIOS chưa rõ, vượt ngân sách, asset lỗi, mất WebGL, đổi nhanh, undo |
| Giỏ/checkout | Giỏ rỗng, vượt tồn giả, coupon sai/hết hạn, đổi giá giả, địa chỉ thiếu, khu vực chưa hỗ trợ, báo giá hết hạn, nhấn đặt hai lần |
| Payment | Pending, thành công, thất bại, retry, thu một lần qua nhiều attempt mẫu; không tạo hai đơn khi nhấn lặp |
| Đơn/hậu mãi | Chưa giao, nhiều kiện, hủy đủ/không đủ điều kiện, trả một phần, hoàn pending/failed/succeeded, serial không thuộc đơn mẫu |
| Admin | Thiếu quyền demo, form sai, thay đổi chưa lưu, hành động không phù hợp trạng thái, xác nhận thao tác, lịch sử |

Các bộ tính tồn/tổng/trạng thái trong mock cần nhất quán để trình diễn đáng tin, nhưng không được coi là kiểm thử bảo mật/backend. UI ẩn nút theo quyền không thay được guard và ownership phía API sau này.

## 9. Tiêu chí hoàn thành UI

- Tất cả đường dẫn của đợt đang thực hiện có trang đích; không còn CTA cùng trỏ về `/` hoặc nút làm như thành công nhưng không đổi trạng thái.
- Có điều hướng tới/lui, deep link, query filter và trạng thái lỗi/rỗng theo ma trận; thao tác local vẫn hoạt động sau refresh trong phạm vi đã cam kết lưu.
- Mua lẻ và builder đi được tới đơn mô phỏng; số tiền, SKU, số lượng và snapshot nhất quán; mọi màn thanh toán ghi rõ mô phỏng.
- Kiểm tra viewport 360, 390, 768, 1024 và 1440px; không tràn ngang ngoài bảng có vùng cuộn chủ đích; thanh cố định không che form.
- Dùng bàn phím hoàn tất chọn SKU/ráp PC/checkout; overlay quản lý focus; label và lỗi gắn đúng input; badge không chỉ có màu.
- Chế độ giảm chuyển động và 2D vẫn hoàn tất builder; asset lỗi/đổi nhanh/undo không làm scene lệch build state.
- Khi có code, chạy `npm run lint` và `npm run build` trong `front`; ghi kết quả thật. Chỉ thêm test tự động cho quy tắc có giá trị như tương thích, tổng tiền, số lượng và chống tạo đơn demo lặp khi triển khai; hiện chưa có script test frontend.
- Kiểm tra Network xác nhận không gọi API nghiệp vụ/Stripe. Tài liệu này chưa thực hiện kiểm tra runtime đó.

## 10. Thứ tự triển khai và đầu ra

| Đợt | Công việc | Điều kiện kết thúc |
| --- | --- | --- |
| P1 — Nền thiết kế | Token, UI dùng chung, route shell, Header/Footer, chuẩn mock, nâng trang chủ | Layout desktop/mobile nhất quán; header có đường dẫn thật trong phạm vi đợt hoặc ghi trạng thái chưa có |
| P2 — Catalog | Danh sách, danh mục, search, chi tiết/SKU, compare, brand/collection/promotion | Tìm → lọc → chọn SKU → thêm giỏ được; hỗ trợ mọi trạng thái catalog |
| P3a — Builder hoạt động | Slot, picker, quy tắc tương thích, ngân sách, preset, lưu local, view 2D, chuyển SKU sang giỏ | Luồng ráp hoàn chỉnh, xử lý xung đột và chưa đủ dữ liệu rõ |
| P3b — Thử nghiệm 3D | Một bộ asset đại diện, anchor, một chuỗi lắp, điều khiển camera, đo hiệu năng/fallback | Chứng minh độ chân thực và tải đủ nhẹ trước khi mở rộng |
| P3c — Studio hoàn thiện | Mở panel, lắp/tháo, exploded view, quạt/RGB, cancel/undo, ảnh preview khi khả thi | Cảnh luôn khớp cấu hình; danh sách/2D đủ chức năng |
| P4 — Luồng mua mô phỏng | Auth giả, giỏ, checkout, coupon/phí/thuế giả, payment/result | Tạo một đơn demo nhất quán từ mua lẻ hoặc builder |
| P5 — Tài khoản và nội dung | Hồ sơ, phiên, địa chỉ, đơn/tracking, review, wishlist, hậu mãi, support, CMS pages | Đi hết luồng sau mua và các trang công khai còn lại |
| P6 — Quản trị | Catalog/đơn/tồn trước; tiếp theo cung ứng, tiền, giao, hậu mãi, CMS/quyền/audit | Mỗi nhóm có fixture, workflow và trạng thái hợp lý; không làm bảng CRUD máy móc |

Cuối mỗi đợt: ghi file đã đổi, ảnh/screen recording nếu công cụ cho phép, lint/build và kiểm tra tương tác thực tế; cập nhật [hiện trạng](../../docs/PROJECT_STATUS.md). Chưa ước lượng thời gian trước khi hoàn thành thử nghiệm asset 3D vì đây là phần bất định lớn nhất.

**Bước triển khai đầu tiên được đề xuất:** P1, P2 và P3a để chốt trải nghiệm; P3b kiểm chứng cảnh 3D trước khi đầu tư dựng toàn bộ linh kiện. Chưa cài thư viện, tạo trang, sửa API/schema, migration hoặc triển khai hosting trong lượt lập kế hoạch này.
