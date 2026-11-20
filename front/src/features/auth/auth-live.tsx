"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { api } from "@/src/catalog/api-client";
import { BrandLogo } from "@/src/components/storefront/brand-logo";
import { useShop } from "@/src/providers/shop-provider";
import { authStyles as tw } from "./auth-styles";
import {
  authLink,
  safeAuthDestination,
  validateAuth,
  type AuthField,
  type AuthValues,
} from "./auth-validation";

export function AuthPage({ mode }: { mode: string }) {
  const query = useSearchParams();
  const { readOnlyPreview, interactiveDemo, passwordRecoveryEnabled } =
    useShop();
  const destination = safeAuthDestination(query.get("next"));
  const recovery = [
    "forgot-password",
    "reset-password",
    "verify-email",
  ].includes(mode);
  if (
    readOnlyPreview &&
    (!interactiveDemo ||
      (mode !== "login" &&
        !(
          passwordRecoveryEnabled &&
          ["forgot-password", "reset-password"].includes(mode)
        )))
  )
    return (
      <section className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="text-2xl font-semibold">Trải nghiệm cửa hàng</h1>
        <p className="mt-4">
          {interactiveDemo
            ? passwordRecoveryEnabled
              ? "Đăng nhập bằng tài khoản thử được cấp riêng. Đăng ký vẫn đóng; chưa nhận đơn hoặc thanh toán."
              : "Đăng nhập bằng tài khoản thử được cấp riêng. Đăng ký và khôi phục mật khẩu công khai chưa mở; chưa nhận đơn hoặc thanh toán."
            : "Bản công khai hiện giới thiệu sản phẩm và PC Studio. Tài khoản, đặt hàng và thanh toán đang tắt; bạn không cần nhập thông tin cá nhân."}
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-rf-accent px-5 py-3 text-white"
        >
          Khám phá sản phẩm
        </Link>
      </section>
    );
  return (
    <div className={tw.auth_shell}>
      <header className={tw.auth_topbar}>
        <div className="mx-auto flex h-full w-full max-w-320 items-center justify-between gap-4 px-5 lg:px-10">
          <BrandLogo />
          <span className="hidden text-rf-caption font-semibold tracking-[0.1em] text-slate-400 md:block">
            TÀI KHOẢN RIGFORGE
          </span>
          <Link
            href="/"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 text-rf-caption font-medium text-slate-600 hover:text-emerald-800 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <ArrowLeft size={15} aria-hidden="true" /> Quay lại cửa hàng
          </Link>
        </div>
      </header>
      <div className={tw.auth_main}>
        <div className={tw.auth_layout}>
          <AuthStory register={mode === "register"} />
          {recovery ? (
            <RecoveryForm key={mode} mode={mode} destination={destination} />
          ) : (
            <AccountForm
              key={mode}
              register={mode === "register"}
              destination={destination}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AuthStory({ register }: { register: boolean }) {
  return (
    <aside className={tw.auth_story} aria-label="Tài khoản Rigforge">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-32 size-96 rounded-full bg-emerald-300/10 blur-3xl"
      />
      <div className="relative z-10">
        <p className="flex items-center gap-2 text-rf-caption font-medium tracking-[0.2em] text-emerald-200">
          <span className="h-px w-6 bg-emerald-300" /> FORGED FOR YOU
        </p>
        <p className="mt-5 text-[35px] leading-[1.15] font-medium tracking-[-1.2px] xl:text-[39px]">
          {register ? "Cấu hình mới." : "Không gian riêng."}
          <br />
          <span className="text-emerald-200">
            {register ? "Dấu ấn riêng." : "Cảm hứng mới."}
          </span>
        </p>
        <p className="mt-3 max-w-78 text-rf-body leading-6 text-slate-300">
          {register
            ? "Lưu bộ máy bạn yêu thích. Sẵn sàng cho những ý tưởng tiếp theo."
            : "Cấu hình đã lưu, giỏ hàng và đơn hàng. Tất cả ở cùng một nơi."}
        </p>
      </div>
      <AuthPcArt />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-rf-caption font-medium tracking-[0.14em] text-slate-400">
        <span>RIGFORGE / PC STUDIO</span>
        <span className="text-emerald-200/70">BUILT BY YOU</span>
      </div>
    </aside>
  );
}

function AuthPcArt() {
  const layers = [
    ["case", 0, 0, 100, 100],
    ["mainboard", 12, 13, 48, 58],
    ["ram", 57, 19, 10, 33],
    ["ssd", 37, 51, 24, 6],
    ["psu", 9, 78, 30, 16],
    ["gpu", 7, 60, 69, 19],
    ["cooler", 25, 23, 29, 34],
  ] as const;
  return (
    <div
      className="relative mx-auto my-2 h-67 w-full max-w-80"
      aria-hidden="true"
    >
      <div className="absolute inset-x-5 bottom-0 h-10 rounded-[50%] bg-black/50 blur-xl" />
      <div className="absolute inset-x-0 top-0 mx-auto aspect-square w-65 [transform:perspective(900px)_rotateY(-14deg)_rotateX(3deg)_rotateZ(-4deg)] xl:w-70">
        {layers.map(([slot, x, y, w, h]) => (
          <div
            key={slot}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${w}%`,
              height: `${h}%`,
            }}
          >
            <Image
              src={`/images/pc-studio/${slot}.webp`}
              alt=""
              fill
              sizes="280px"
              className="object-fill"
              draggable={false}
            />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-[4%_13%_10%_4%] rounded-sm border border-emerald-100/15 bg-linear-to-br from-white/7 via-transparent to-emerald-300/4" />
        <div className="absolute top-[28%] right-[18%] h-[38%] w-0.5 bg-emerald-200/60 shadow-[0_0_12px_#6ee7b780]" />
      </div>
      <span className="absolute right-0 bottom-4 border-l border-emerald-200/40 pl-2 text-rf-caption leading-5 tracking-[0.12em] text-slate-400">
        YOUR NEXT
        <br />
        <span className="text-emerald-200">GREAT BUILD.</span>
      </span>
    </div>
  );
}

function BrandEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-rf-caption font-semibold tracking-[0.14em] text-emerald-700">
      {children}
    </p>
  );
}

function FormField({
  label,
  name,
  value,
  onValue,
  onTouch,
  error,
  hint,
  secretLabel,
  ...inputProps
}: {
  label: string;
  name: AuthField;
  value: string;
  onValue: (name: AuthField, value: string) => void;
  onTouch: (name: AuthField) => void;
  error?: string;
  hint?: string;
  secretLabel?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "value" | "onChange" | "onBlur"
>) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const descriptions =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={tw.field}>
      <label htmlFor={id} className={tw.label}>
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          name={name}
          value={value}
          type={
            secretLabel
              ? visible
                ? "text"
                : "password"
              : (inputProps.type ?? "text")
          }
          required
          className={`${tw.input}${secretLabel ? " pr-12" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptions}
          onChange={(event) => onValue(name, event.target.value)}
          onBlur={() => onTouch(name)}
        />
        {secretLabel && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 hover:text-emerald-800 aria-pressed:bg-emerald-100 aria-pressed:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            aria-label={`${visible ? "Ẩn" : "Hiện"} ${secretLabel}`}
            aria-controls={id}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className={tw.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={tw.field_error} aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

function useAuthFields(mode: string, token = "") {
  const [values, setValues] = useState<AuthValues>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    token,
  });
  const [touched, setTouched] = useState<Partial<Record<AuthField, boolean>>>(
    {},
  );
  const errors = validateAuth(values, mode);
  return {
    values,
    setValues,
    field: (name: AuthField) => ({
      name,
      value: values[name],
      error: touched[name] ? errors[name] : undefined,
      onValue: (field: AuthField, value: string) =>
        setValues((current) => ({ ...current, [field]: value })),
      onTouch: (field: AuthField) =>
        setTouched((current) => ({ ...current, [field]: true })),
    }),
    validate: (form: HTMLFormElement, fields: AuthField[]) => {
      setTouched(Object.fromEntries(fields.map((field) => [field, true])));
      const first = fields.find((field) => errors[field]);
      if (!first) return true;
      const input = form.elements.namedItem(first);
      if (input instanceof HTMLElement) input.focus();
      return false;
    },
  };
}

function ServerError({ message }: { message: string }) {
  return message ? (
    <div role="alert" className={tw.server_error}>
      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  ) : null;
}

function AccountForm({
  register = false,
  destination,
}: {
  register?: boolean;
  destination: string;
}) {
  const shop = useShop();
  const router = useRouter();
  const mode = register ? "register" : "login";
  const form = useAuthFields(mode);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  return (
    <section className={tw.auth_form_panel}>
      <BrandEyebrow>
        {register ? "THAM GIA RIGFORGE" : "CHÀO MỪNG TRỞ LẠI"}
      </BrandEyebrow>
      <h1 className={tw.heading}>
        {register ? "ĐĂNG KÝ THÀNH VIÊN MỚI" : "ĐĂNG NHẬP"}
      </h1>
      <p className="mt-2 text-rf-body leading-6 text-slate-500">
        {register
          ? "Một vài thông tin để tạo không gian của riêng bạn."
          : "Nhập thông tin để tiếp tục cùng Rigforge."}
      </p>
      <form
        className={tw.form}
        noValidate
        aria-busy={busy}
        onSubmit={async (event) => {
          event.preventDefault();
          if (inFlight.current) return;
          setError("");
          if (
            !form.validate(
              event.currentTarget,
              register
                ? ["name", "email", "password", "confirmPassword"]
                : ["email", "password"],
            )
          )
            return;
          inFlight.current = true;
          setBusy(true);
          try {
            await shop.login({
              email: form.values.email.trim().toLowerCase(),
              password: form.values.password,
              name: form.values.name.trim(),
              register,
            });
            router.push(destination);
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : register
                  ? "Không thể tạo tài khoản. Vui lòng thử lại."
                  : "Đăng nhập thất bại. Vui lòng thử lại.",
            );
          } finally {
            inFlight.current = false;
            setBusy(false);
          }
        }}
      >
        <fieldset
          disabled={busy}
          className="m-0 grid min-w-0 gap-3 border-0 p-0"
        >
          <legend className="sr-only">
            {register ? "Thông tin đăng ký" : "Thông tin đăng nhập"}
          </legend>
          {register && (
            <FormField
              {...form.field("name")}
              label="Tên hiển thị"
              autoComplete="name"
              placeholder="Tên của bạn"
            />
          )}
          <FormField
            {...form.field("email")}
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="ban@example.com"
          />
          <FormField
            {...form.field("password")}
            label="Mật khẩu"
            secretLabel="mật khẩu"
            autoComplete={register ? "new-password" : "current-password"}
            hint={register ? "Từ 12 ký tự, tối đa 72 byte UTF-8." : undefined}
          />
          {register && (
            <FormField
              {...form.field("confirmPassword")}
              label="Nhập lại mật khẩu"
              secretLabel="mật khẩu xác nhận"
              autoComplete="new-password"
            />
          )}
          {!register &&
            (!shop.interactiveDemo || shop.passwordRecoveryEnabled) && (
              <div className="flex justify-end">
                <Link
                  href={authLink("/forgot-password", destination)}
                  className={tw.text_link}
                >
                  Quên mật khẩu?
                </Link>
              </div>
            )}
          <ServerError message={error} />
          <button type="submit" className={tw.btn_full} disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle
                  size={17}
                  className="motion-safe:animate-spin"
                  aria-hidden="true"
                />{" "}
                Đang xử lý…
              </>
            ) : (
              <>
                {register ? "Tạo tài khoản" : "Đăng nhập"}
                <ArrowRight size={17} aria-hidden="true" />
              </>
            )}
          </button>
        </fieldset>
      </form>
      {(!shop.interactiveDemo || register) && (
        <p className={tw.switcher}>
          {register ? "Đã có tài khoản?" : "Bạn chưa có tài khoản?"}{" "}
          <Link
            href={authLink(register ? "/login" : "/register", destination)}
            className={tw.text_link}
          >
            {register ? "Đăng nhập" : "Đăng ký ngay"}
          </Link>
        </p>
      )}
    </section>
  );
}

function RecoveryForm({
  mode,
  destination,
}: {
  mode: string;
  destination: string;
}) {
  const query = useSearchParams();
  const { interactiveDemo, passwordRecoveryEnabled } = useShop();
  const form = useAuthFields(
    mode,
    mode === "reset-password" ? "" : (query.get("token") ?? ""),
  );
  const { setValues } = form;
  useEffect(() => {
    if (!["reset-password", "verify-email"].includes(mode)) return;
    const token = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (!token) return;
    setValues((current) => ({ ...current, token }));
    // Keep the token out of server requests and remove it from browser history.
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }, [mode, setValues]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const forgot = mode === "forgot-password";
  const reset = mode === "reset-password";
  return (
    <section className={tw.auth_form_panel}>
      <BrandEyebrow>TÀI KHOẢN RIGFORGE</BrandEyebrow>
      <h1 className={tw.heading}>
        {forgot
          ? "Khôi phục tài khoản"
          : reset
            ? "Đặt lại mật khẩu"
            : "Xác minh email"}
      </h1>
      <p className="mt-2 text-rf-body leading-6 text-slate-500">
        {forgot
          ? interactiveDemo && passwordRecoveryEnabled
            ? "Nhập email của tài khoản thử được cấp để yêu cầu liên kết đặt lại mật khẩu."
            : "Nhập email đã đăng ký để gửi yêu cầu khôi phục."
          : reset
            ? "Dùng mã trong email để tạo mật khẩu mới cho tài khoản."
            : "Nhập mã trong email để hoàn tất xác minh tài khoản."}
      </p>
      <form
        className={tw.form}
        noValidate
        aria-busy={busy}
        onSubmit={async (event) => {
          event.preventDefault();
          if (inFlight.current) return;
          setError("");
          setMessage("");
          if (
            !form.validate(
              event.currentTarget,
              forgot
                ? ["email"]
                : reset
                  ? ["token", "password", "confirmPassword"]
                  : ["token"],
            )
          )
            return;
          inFlight.current = true;
          setBusy(true);
          try {
            if (forgot) {
              await api("/auth/forgot-password", {
                method: "POST",
                body: { email: form.values.email.trim().toLowerCase() },
              });
              setMessage(
                "Nếu email đủ điều kiện, bạn sẽ nhận được liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư mục spam. Liên kết có hiệu lực 30 phút.",
              );
            } else if (reset) {
              await api("/auth/reset-password", {
                method: "POST",
                body: {
                  token: form.values.token.trim(),
                  newPassword: form.values.password,
                },
              });
              setMessage("Đã đổi mật khẩu. Vui lòng đăng nhập lại.");
            } else {
              await api("/auth/verification/confirm", {
                method: "POST",
                body: { token: form.values.token.trim() },
              });
              setMessage("Đã xác minh email.");
            }
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Thao tác không thành công. Vui lòng thử lại.",
            );
          } finally {
            inFlight.current = false;
            setBusy(false);
          }
        }}
        onChange={() => {
          setMessage("");
          setError("");
        }}
      >
        <fieldset
          disabled={busy}
          className="m-0 grid min-w-0 gap-3 border-0 p-0"
        >
          <legend className="sr-only">Thông tin khôi phục tài khoản</legend>
          {forgot ? (
            <FormField
              {...form.field("email")}
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="ban@example.com"
            />
          ) : (
            <FormField
              {...form.field("token")}
              label="Mã xác minh"
              autoComplete="one-time-code"
              autoCapitalize="none"
              spellCheck={false}
            />
          )}
          {reset && (
            <>
              <FormField
                {...form.field("password")}
                label="Mật khẩu mới"
                secretLabel="mật khẩu mới"
                autoComplete="new-password"
                hint="Từ 12 ký tự, tối đa 72 byte UTF-8."
              />
              <FormField
                {...form.field("confirmPassword")}
                label="Nhập lại mật khẩu"
                secretLabel="mật khẩu xác nhận"
                autoComplete="new-password"
              />
            </>
          )}
          {message && (
            <p role="status" className={tw.notice}>
              {message}
            </p>
          )}
          <ServerError message={error} />
          <button type="submit" className={tw.btn_full} disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle
                  size={17}
                  className="motion-safe:animate-spin"
                  aria-hidden="true"
                />{" "}
                Đang xử lý…
              </>
            ) : (
              <>
                Gửi yêu cầu
                <ArrowRight size={17} aria-hidden="true" />
              </>
            )}
          </button>
        </fieldset>
        <Link
          href={authLink("/login", destination)}
          className={`${tw.text_link} justify-center`}
        >
          <ArrowLeft size={15} aria-hidden="true" /> Quay lại đăng nhập
        </Link>
      </form>
    </section>
  );
}
