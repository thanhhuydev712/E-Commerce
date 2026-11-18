export type AuthField =
  "name" | "email" | "password" | "confirmPassword" | "token";
export type AuthValues = Record<AuthField, string>;
export type AuthErrors = Partial<Record<AuthField, string>>;

export function validateEmail(value: string) {
  const email = value.trim();
  if (!email) return "Vui lòng nhập email.";
  if (email.length > 254) return "Email không được dài quá 254 ký tự.";
  const [local, domain, extra] = email.split("@");
  if (
    !local ||
    !domain ||
    extra !== undefined ||
    local.length > 64 ||
    /[\s<>(),:;"\\[\]]/u.test(local) ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    !domain.includes(".") ||
    !domain
      .split(".")
      .every((label) =>
        /^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u.test(label),
      ) ||
    /^\d+$/u.test(domain.split(".").at(-1) ?? "")
  )
    return "Email chưa đúng định dạng, ví dụ ban@example.com.";
  return undefined;
}

export function validatePassword(value: string, minimum = 12) {
  if (!value) return "Vui lòng nhập mật khẩu.";
  if ([...value].length < minimum)
    return `Mật khẩu cần ít nhất ${minimum} ký tự.`;
  if (new TextEncoder().encode(value).length > 72)
    return "Mật khẩu vượt quá 72 byte UTF-8. Ký tự có dấu hoặc emoji có thể chiếm nhiều byte.";
  return undefined;
}

export function validateAuth(values: AuthValues, mode: string): AuthErrors {
  const errors: AuthErrors = {};
  if (["login", "register", "forgot-password"].includes(mode))
    errors.email = validateEmail(values.email);
  if (mode === "register") {
    const length = [...values.name.trim()].length;
    if (length < 2)
      errors.name =
        "Tên hiển thị cần ít nhất 2 ký tự, không tính khoảng trắng ở hai đầu.";
    else if (length > 100)
      errors.name = "Tên hiển thị không được dài quá 100 ký tự.";
  }
  if (["login", "register", "reset-password"].includes(mode))
    errors.password = validatePassword(
      values.password,
      mode === "login" ? 1 : 12,
    );
  if (["register", "reset-password"].includes(mode)) {
    if (!values.confirmPassword)
      errors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
    else if (values.confirmPassword !== values.password)
      errors.confirmPassword = "Mật khẩu nhập lại chưa khớp.";
  }
  if (["reset-password", "verify-email"].includes(mode)) {
    const token = values.token.trim();
    if (!token) errors.token = "Vui lòng nhập mã xác minh.";
    else if ([...token].length < 32 || [...token].length > 256)
      errors.token =
        "Mã xác minh cần từ 32 đến 256 ký tự. Hãy kiểm tra lại mã trong email.";
  }
  return errors;
}

export function safeAuthDestination(candidate: string | null) {
  if (!candidate) return "/account";
  try {
    const decoded = decodeURIComponent(candidate);
    if (
      !candidate.startsWith("/") ||
      decoded.startsWith("//") ||
      /[\\\u0000-\u001f\u007f]/u.test(decoded)
    )
      return "/account";
    return candidate;
  } catch {
    return "/account";
  }
}

export function authLink(path: string, destination: string) {
  return destination === "/account"
    ? path
    : `${path}?next=${encodeURIComponent(destination)}`;
}
