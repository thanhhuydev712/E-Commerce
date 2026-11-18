import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

const target = new URL("../../.env.docker", import.meta.url);
const secret = () => randomBytes(32).toString("hex");
const content = [
  "# Chỉ dành cho Docker local; không commit hoặc dùng trên AWS.",
  "APP_PORT=8080",
  "POSTGRES_DB=rigforce_local",
  "POSTGRES_USER=rigforce",
  `POSTGRES_PASSWORD=${secret()}`,
  `JWT_SECRET=${secret()}`,
  `JWT_REFRESH_SECRET=${secret()}`,
  "",
].join("\n");

try {
  await writeFile(target, content, { flag: "wx", mode: 0o600 });
  console.log(
    "Đã tạo .env.docker với credential local riêng; không in secret.",
  );
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log(".env.docker đã tồn tại; giữ nguyên cấu hình của bạn.");
}
