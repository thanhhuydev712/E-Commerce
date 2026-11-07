# Bàn giao tích hợp database – API – frontend

Cập nhật 07/11/2026: hoàn tất phạm vi tích hợp yêu cầu, đã seed development và xoá fixture runtime frontend sau test thật.

- Database 104 bảng/4 migration/172 CHECK; VND, giữ dữ liệu gốc và legacy. Có 186 sản phẩm/188 SKU/27 danh mục/8 bài sau seed. Audit không có sai lệch ledger/tổng tiền. Các bảng giao dịch chỉ sinh lịch sử khi nghiệp vụ chạy.
- Frontend gọi backend cho catalog/tài khoản/giỏ/COD/lưu PC/yêu thích/support/preferences/serial/admin; chỉ compare lưu local. Đã sửa khôi phục phiên khi reload, trạng thái preference và giá so sánh theo SKU.
- Kiểm tra: 11 unit BE, 39 API E2E và 15 auth kiểm lại qua; 56 ca UI có kết quả đạt từ nhiều lượt, 5 unit compatibility qua. Build/lint/format qua. Không khẳng định đã có một lượt sạch cuối cho toàn bộ 61 ca FE.
- Backend development đang phục vụ cổng 3001; frontend localhost:3000 đã smoke 8 trang. Không dừng frontend của người dùng, không commit/push/deploy.
- Stripe test chưa bật do thiếu webhook/processor v2; chưa giao vận/thu hộ/refund/duyệt hậu mãi hoàn chỉnh hoặc email thực.

Chi tiết, kết quả và giới hạn: [PROJECT_STATUS](PROJECT_STATUS.md). Hướng dẫn chạy/test: [STOREFRONT_INTEGRATION](STOREFRONT_INTEGRATION.md). Bằng chứng tổng hợp không chứa token: [verification/2026-11-07-integration.json](verification/2026-11-07-integration.json).
