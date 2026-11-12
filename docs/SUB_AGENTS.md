# Sub-agent theo chức năng

Thiết kế ngày 12/11/2026 cho Codex trong repository này. Agent chính điều phối,
giữ yêu cầu và quyết định; agent con xử lý một nhiệm vụ hẹp rồi trả kết quả.

## Vai trò

| Tên | Phạm vi | Tài liệu đọc thêm khi liên quan |
| --- | --- | --- |
| `frontend` | UI, responsive, state, tích hợp API trong `front/` | `front/AGENTS.md`, hướng dẫn Next.js cục bộ, tài liệu feature |
| `backend` | NestJS và nghiệp vụ v2 trong `api/src/` | Contract identity/catalog/commerce/Stripe đúng nhiệm vụ |
| `database` | Schema, migration, constraint/index, transaction | `database/README.md`, schema và migration liên quan |
| `qa` | Review và kiểm thử có mục tiêu; mặc định không sửa | `QUALITY.md`, runner và test liên quan |
| `infra` | Docker, Nginx, CI/CD, AWS | `DEPLOYMENT_PLAN.md`, `DEVELOPMENT.md` |

Đây là vai trò chuyên môn, không phải năm tiến trình chạy thường trực. Các chức năng
auth/catalog/checkout vẫn là nhiệm vụ cụ thể của vai trò tương ứng; chưa cần tạo
một agent cho từng module. Agent chính sở hữu tài liệu trạng thái và file dùng chung.

## Chọn cách thực hiện để hạn chế token

- Mặc định agent chính tự làm tác vụ nhỏ, sửa một file hoặc trả lời giải thích.
- Giao một agent khi cần khảo sát tập trung hoặc công việc đủ lớn để tách rõ đầu ra.
- Cấu hình `.codex/config.toml` giới hạn **một agent con đồng thời**, ngoài agent chính.
  Có thể giao nhiều nhiệm vụ tuần tự; đây không phải trần token hoặc trần số lần gọi.
- Không gọi đủ năm vai trò cho mọi yêu cầu; không mở agent chỉ để xác nhận kết luận.
- Nếu công cụ hỗ trợ, dùng ngữ cảnh mới (`fork_turns="none"`) và giao bản tóm tắt
  tự đủ thông tin. Đây là lựa chọn lúc gọi công cụ, không phải khóa TOML.
- Agent chính đọc tài liệu nền theo AGENTS.md. Agent con dùng bản bàn giao đã có
  đường dẫn/bằng chứng; chỉ đọc lại mục cần xác minh, vẫn đọc quy tắc thư mục áp dụng.
- Tìm bằng `rg`, đọc đoạn cần thiết; loại `node_modules`, generated, cache, lockfile
  khỏi khảo sát rộng. Chỉ đọc chúng khi cần xác minh trực tiếp phiên bản/API/build.
- Không gửi toàn bộ lịch sử chat, code hoặc log vào prompt khi đã có đường dẫn.
- Tái sử dụng agent cùng nhiệm vụ để sửa tiếp; không duy trì thread đã lệch chủ đề.
- Báo cáo mục tiêu tối đa khoảng 250 từ, trừ khi lỗi/rủi ro cần giải thích thêm.
  Đây là hướng dẫn độ dài, không phải cơ chế giới hạn token cứng.

Theo [OpenAI Docs về sub-agents](https://learn.chatgpt.com/docs/agent-configuration/subagents),
mỗi agent tự tiêu thụ token cho model và công cụ; chạy nhiều agent có thể tốn tổng
token hơn một agent làm việc tương đương. Ngữ cảnh chính gọn hơn không đồng nghĩa
tổng token thấp hơn. Thiết kế này nhằm giảm đọc trùng và điều phối thừa; chưa có đo
lường để khẳng định tỷ lệ tiết kiệm.

## Hợp đồng giao việc

Agent chính gửi đủ các mục sau; agent con báo thiếu thông tin qua agent chính:

```text
Vai trò: backend
Mục tiêu: [một kết quả cụ thể]
Chế độ: chỉ đọc | được sửa
Được sửa: [danh sách file/thư mục hẹp]
Đầu vào: [đường dẫn, symbol, mục tài liệu, tóm tắt đã xác minh]
Ràng buộc: [contract, bảo mật, thay đổi sẵn có phải giữ]
Nghiệm thu: [hành vi và kiểm tra đủ để kết luận]
Tài nguyên kiểm thử: [runner/cổng/schema/cache nếu cần]
Đầu ra: kết luận; file; kiểm tra và kết quả thật; giới hạn; điểm cần phối hợp.
Không tạo agent con. Báo agent chính nếu cần sửa ngoài phạm vi.
```

Agent chính kiểm `git status`/diff trước khi phân công, ghi nhận thay đổi có sẵn;
không khôi phục chúng. Không giao hai tác vụ sửa cùng file. Chốt contract trước
khi nối frontend–backend; database bàn giao schema trước khi backend phụ thuộc nó.
Không chạy hai runner tranh cổng/schema/cache. Agent chính tích hợp diff, xem lại
bằng chứng, cập nhật tài liệu liên quan và PROJECT_STATUS khi trạng thái thay đổi.
Không chạy lại cùng kiểm tra đã đạt khi không có thay đổi hoặc nghi vấn mới.

## Cấu hình và cách dùng

Các vai trò nằm trong `.codex/agents/*.toml`, mỗi file có `name`, `description`
và `developer_instructions`. Không pin model hoặc reasoning trong thiết kế ban đầu:
kế thừa phiên cha để tránh chọn model tài khoản chưa có. Khi cần đổi, chọn model
đang khả dụng theo độ khó; tiết kiệm chi phí mỗi token khác với giảm số token.

Mở phiên Codex mới tại root dự án để kiểm tra khả năng nạp cấu hình. Tùy client,
project config có thể phụ thuộc trạng thái tin cậy của repository. Cấu hình không
thay đổi sandbox/quyền của phiên cha; chỉ dẫn `qa` chỉ đọc không phải sandbox riêng.

Ví dụ yêu cầu:

```text
Dùng sub-agent frontend kiểm tra lỗi menu mobile. Chỉ sửa header liên quan,
giữ API hiện tại và báo kết quả kiểm tra responsive.

Dùng sub-agent qa review ownership của luồng hủy đơn, chỉ đọc code.
Trả lỗi có bằng chứng file:dòng; chưa sửa hay chạy test ghi dữ liệu.

Tự xử lý thay đổi copy nhỏ này, không dùng sub-agent.
```

Nếu phiên không có khả năng chọn custom agent theo tên, agent chính truyền chỉ dẫn
của đúng file vai trò vào công cụ spawn đang có; không coi việc đặt tên thread là
bằng chứng cấu hình custom đã được nạp. Nếu không có spawn, xử lý bằng agent chính.

## Xác minh và đánh giá

- Kiểm cú pháp TOML, tên duy nhất, trường bắt buộc và đường dẫn nội bộ.
- Kiểm client có nhận đúng vai trò/cấu hình trong phiên mới trước khi dựa vào chúng.
- Ghi tổng token cả cha và con từ số liệu client nếu có; so sánh trên tác vụ tương
  đương, cùng model, mức reasoning và tiêu chí nghiệm thu. Ghi riêng thời gian và lỗi.
- Nếu client không cung cấp tổng usage, ghi chưa đo được; không suy ra tiết kiệm
  chỉ từ câu trả lời ngắn hoặc ít log ở thread chính.

Chưa chạy thử các vai trò hoặc đo token trong lượt tạo thiết kế này. Không thay đổi
runtime ứng dụng, database hay hạ tầng từ việc thêm bộ cấu hình.
