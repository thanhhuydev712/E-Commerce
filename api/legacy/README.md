# Mã backend v1 lưu đối chiếu

Các module chưa chuyển database v2 được đưa ra khỏi src/runtime/build ngày 06/11/2026 theo giai đoạn 0–1 đã duyệt. Đây là mã lịch sử, không phải ứng dụng chạy độc lập; đường import cũ giữ nguyên để đối chiếu. Không trỏ chúng tới public v2 hoặc legacy_v1 để tiếp tục ghi.

Các route catalog, carts, orders, payments chưa được đăng ký. Generated client cũ trong src/generated không được mã hoạt động import và được loại khỏi build; không sửa generated code bằng tay.
