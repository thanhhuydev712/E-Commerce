# Test helper triển khai mà không chạm AWS/host thật

Suite chỉ dùng dữ liệu giả và Python stdlib. Parser tests chạy validator inline thực tế của hai shell script, không chép lại implementation. Integration tests thay AWS CLI, Docker CLI, curl và OpenSSL bằng mocks trong **container mới**, không gọi AWS hoặc Docker daemon từ bên trong.

Từ root repo, PowerShell:

```powershell
docker build -t rigforce-deploy-tests:local -f infra/tests/deploy/Dockerfile infra/tests/deploy
docker run --rm --network none `
  --mount "type=bind,source=$((Get-Location).Path),target=/repo,readonly" `
  rigforce-deploy-tests:local
```

Linux/GitHub runner:

```bash
docker build -t rigforce-deploy-tests:local -f infra/tests/deploy/Dockerfile infra/tests/deploy
docker run --rm --network none --mount "type=bind,src=$PWD,dst=/repo,readonly" rigforce-deploy-tests:local
```

Build cần mạng để tải test image/packages; lúc chạy suite network bị tắt. **Không mount Docker socket, `/opt`, AWS config/credentials hoặc env thật.** Repo mount read-only. Harness từ chối chạy khi không có marker container, đã có `/opt/rigforce`, hoặc tìm thấy Docker socket; nó chỉ tạo `/opt/rigforce` và cài mock executable bên trong container dùng một lần. Không chạy `integration.py` bằng root trên host.

Parser fixtures cũng chạy an toàn trực tiếp bằng `python infra/tests/deploy/parser_fixtures.py` trên host: chỉ tạo thư mục temp, không sửa `/opt`/repo, không network/AWS. Integration cần Bash/jq/flock/mode ownership Linux nên dùng container.

Các ca chính:

- 11 archive/manifest: valid, traversal/link/duplicate/secret-file, environment/repo/tag, schema type/commit/policy/source type.
- 8 env payload: valid, shell literal, role split, hai dialect TLS, HTTPS origin, unknown key và newline injection; không in connection string.
- 14 lượt helper: prepare không launch; deploy thành công; app lỗi → rollback và giữ current; schema state mới sống qua rollback; none với fingerprint cũ/label sai/dirty/traversal/maintenance bị chặn; retry giữ previous; migration lỗi giữ marker/chặn deploy sau, prepare vẫn kiểm được candidate; rollback lỗi giữ snapshot private nhưng xóa token. Kiểm mode 0600 và token config được dọn.

Kết quả JSON có số ca thực chạy và `realAwsCalls: 0`. Mock curl/OpenSSL không chứng minh TLS/certificate thực tế; mock Compose không kiểm schema Compose hay container app. Bộ production Docker check và AWS smoke/rollback/reboot/restore thật có phạm vi riêng.
