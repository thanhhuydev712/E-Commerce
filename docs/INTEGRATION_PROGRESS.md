# Tiến độ nối database – API – frontend

Cập nhật 07/11/2026. Yêu cầu: hoàn thiện DB, seed dữ liệu liên kết, nối FE–BE và chỉ xoá fixture frontend sau test thật thành công. Chọn COD; Stripe test chỉ khi đủ cấu hình. Không commit/push/deploy.

Đã làm:
- Migration `20261106010000_storefront_saved_builds` đã áp dụng development: 104 bảng, 4 migration, 172 CHECK. Bổ sung SavedPcBuild và SavedPcBuildComponent có FK owner/product và slot duy nhất.
- Đã seed public: thêm 183 product/185 SKU/26 category/8 article cùng media, giá VND, tồn + OPENING ledger, options, attributes, banner/collection/content/settings/coupon. ID cố định, giữ dữ liệu cũ; editor LOCKED, không tự cấp ADMIN.
- Tổng public sau seed: 186 product/188 SKU/27 category; stock 2328; 2 user gồm editor, 1 role assignment cũ. Public order/payment 0; legacy giữ 1 order + 1 payment. Hash tài khoản và giá/tồn cũ còn nguyên. Audit 104 bảng: ledger/reservation/order/payment mismatch 0; 32 bảng có dữ liệu, 72 bảng nghiệp vụ chưa phát sinh hợp lệ. Báo cáo docs/database/DATABASE_AUDIT.json.
- Backend Storefront + Commerce đã nạp. Catalog/articles/pages/layout từ DB; media có visibility SQL. Cart/wishlist/build/support/notifications/preferences/reviews/quote/COD/cancel, admin aggregate có guard. Reserve/release + ledger + money snapshot + audit/idempotency nguyên tử; chống oversell/coupon lặp/stale quote.
- Frontend dùng CatalogProvider + ShopProvider/API, runtime server fetch và rewrite /api/v1. Auth/profile/address/cart/order/build/wishlist/support/prefs/serial/admin gọi backend. Compare là tuỳ chọn local. Không fallback fake khi API lỗi.
- Sau fullstack 2/2 qua ở report `codex_live_test_96e22b450a1141aaaaf87ff4ea877fab`, đã xoá mocks/catalog.ts, reference-catalog.json, provider demo, data module cứng và storage adapter cũ. Nội dung storefront chuyển seed-data backend. Giữ ảnh public và attribution. Đã bỏ đánh giá giả, countdown giả và coupon tính áp dụng giả; checkout nhận quote/coupon từ server.
- API 37/37 và unit 11/11 đã qua; suite storefront cuối 9/9 có validation null/coupon/stock race. Frontend lint/format/typecheck/build qua; build 30 shell route có nội dung runtime.

Đang xác minh cuối:
- Lượt UI rộng 54 ca: 47 qua, 7 lỗi. Đã sửa tên ảnh test từ local sang API; khôi phục marker form recovery; crawl link chạy 2 request đồng thời và timeout phù hợp DB thật.
- Hai ca mất đăng nhập do hard navigation huỷ refresh đang rotate: đã bổ sung POST /auth/session chỉ đọc, kiểm token hiện hành, neo access iat/exp vào cửa sổ cũ; chỉ gọi rotate khi hết cửa sổ. Không kéo dài TTL và không bỏ chính sách revoke khi reuse /auth/refresh. Có hai E2E mới cho restore/expiry; backend hiện chạy lại 39 ca.
- Checkbox preference đã cập nhật trạng thái chờ, gửi API, hoàn nguyên khi lỗi. Test promotion đợi cart POST hoàn tất trước hard reload.
- Đang chạy lại 7 ca từng lỗi + hành trình COD (8 ca), schema/cổng/cache riêng; chưa ghi là pass trước khi có report. Các report đều trong front/.visual-review/codex_live_test_*; không công khai trace vì có token test.

Còn làm: đọc kết quả cuối, sửa nếu còn fail; cập nhật PROJECT_STATUS bằng kết quả thật; khởi động lại backend development do mình tạo để nhận /auth/session; kiểm proxy/API và giao diện chính, hướng dẫn người dùng vào test.

Giới hạn: có Stripe sk_test nhưng thiếu webhook secret/processor v2, UI chỉ COD và API STRIPE trả 503, không gọi Stripe trong lượt này. Chưa giao vận/thu hộ, invoice/refund/approval hậu mãi đầy đủ. Form hậu mãi tạo support ticket. Recovery chưa gửi email thật; local media chưa có storage vận hành. Không Docker/Nginx/AWS deployment trong nhiệm vụ này.
