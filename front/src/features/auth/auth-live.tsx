"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { api } from "@/src/catalog/api-client";
import { useShop } from "@/src/providers/shop-provider";
import { authStyles as tw } from "./auth-styles";
export function AuthPage({ mode }: { mode: string }) {
  const query = useSearchParams();
  const next = query.get("next");
  const destination =
    next?.startsWith("/") &&
    !next.startsWith("//") &&
    !/[\\\u0000-\u001f]/.test(next)
      ? next
      : "/account";
  if (["forgot-password", "reset-password", "verify-email"].includes(mode))
    return <RecoveryForm mode={mode} />;
  return (
    <div className={tw.auth_reference}>
      <header>
        <h1>Tài khoản Rigforge</h1>
        <p>Đăng nhập để đồng bộ giỏ hàng, cấu hình và đơn hàng của bạn.</p>
      </header>
      <div className={tw.auth_columns}>
        <AccountForm destination={destination} />
        <AccountForm register destination={destination} />
      </div>
    </div>
  );
}
function AccountForm({
  register = false,
  destination,
}: {
  register?: boolean;
  destination: string;
}) {
  const shop = useShop(),
    router = useRouter();
  const passwordId = useId();
  const [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className={tw.panel}>
      <h2>{register ? "ĐĂNG KÝ THÀNH VIÊN MỚI" : "ĐĂNG NHẬP"}</h2>
      <form
        className={tw.form}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            await shop.login({ email, password, name, register });
            router.push(destination);
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : "Đăng nhập thất bại",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {register && (
          <label>
            Tên hiển thị
            <input
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="given-name"
            />
          </label>
        )}
        <label>
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <div className="grid gap-1.75">
          <label htmlFor={passwordId} className="text-xs font-semibold">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id={passwordId}
              required
              type={showPassword ? "text" : "password"}
              className="pr-12!"
              minLength={register ? 12 : 1}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={register ? "new-password" : "current-password"}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-[5px] text-rf-muted transition-colors duration-200 hover:text-rf-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rf-green motion-reduce:transition-none"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-controls={passwordId}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {register && (
          <p className="text-xs text-rf-muted">
            Mật khẩu mới ít nhất 12 ký tự, tối đa 72 byte UTF-8.
          </p>
        )}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <button className={tw.btn_full} disabled={busy}>
          {busy ? "Đang xử lý…" : register ? "Tạo tài khoản" : "Đăng nhập"}
          <ArrowRight size={16} />
        </button>
      </form>
      {!register && (
        <Link href="/forgot-password" className={tw.text_link}>
          Quên mật khẩu?
        </Link>
      )}
    </section>
  );
}
function RecoveryForm({ mode }: { mode: string }) {
  const query = useSearchParams();
  const [email, setEmail] = useState(""),
    [token, setToken] = useState(query.get("token") ?? ""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className={`${tw.panel} rf-auth-layout w-full`}>
      <h1>
        {mode === "forgot-password"
          ? "Khôi phục tài khoản"
          : mode === "reset-password"
            ? "Đặt lại mật khẩu"
            : "Xác minh email"}
      </h1>
      <form
        className={tw.form}
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            if (mode === "forgot-password") {
              await api("/auth/forgot-password", {
                method: "POST",
                body: { email },
              });
              setMessage(
                "Yêu cầu đã được tiếp nhận. Môi trường local chưa gửi email thật.",
              );
            } else if (mode === "reset-password") {
              await api("/auth/reset-password", {
                method: "POST",
                body: { token, newPassword: password },
              });
              setMessage("Đã đổi mật khẩu. Vui lòng đăng nhập lại.");
            } else {
              await api("/auth/verification/confirm", {
                method: "POST",
                body: { token },
              });
              setMessage("Đã xác minh email.");
            }
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Thao tác không thành công",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {mode === "forgot-password" ? (
          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
        ) : (
          <label>
            Mã xác minh
            <input
              required
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </label>
        )}
        {mode === "reset-password" && (
          <label>
            Mật khẩu mới
            <input
              required
              minLength={12}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        )}
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
        <button className={tw.btn_full} disabled={busy}>
          {busy ? "Đang xử lý…" : "Gửi yêu cầu"}
        </button>
        <Link href="/login">Quay lại đăng nhập</Link>
      </form>
    </section>
  );
}
