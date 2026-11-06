import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "soft" | "danger" | "link";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export type ButtonRounded = "md" | "lg" | "xl" | "full";

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "size" | "children"
> & {
  children: ReactNode;

  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRounded;

  fullWidth?: boolean;
  iconOnly?: boolean;

  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  loading?: boolean;
  loadingText?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  // Xanh lá - hành động chính
  primary: `
    border border-emerald-500
    bg-emerald-500 text-zinc-950
    shadow-sm
    hover:border-emerald-400 hover:bg-emerald-400
  `,

  // Đen - hành động quan trọng thứ hai
  secondary: `
    border border-zinc-900
    bg-zinc-900 text-white
    shadow-sm
    hover:border-zinc-800 hover:bg-zinc-800
  `,

  // Nền trắng, viền xám
  outline: `
    border border-zinc-300
    bg-white text-zinc-900
    hover:border-emerald-500
    hover:bg-emerald-50 hover:text-emerald-800
  `,

  // Nút tối giản
  ghost: `
    border border-transparent
    bg-transparent text-zinc-700
    shadow-none
    hover:bg-emerald-50 hover:text-emerald-800
  `,

  // Nền xanh nhạt
  soft: `
    border border-emerald-100
    bg-emerald-50 text-emerald-800
    hover:border-emerald-200 hover:bg-emerald-100
  `,

  // Xóa / nguy hiểm
  danger: `
    border border-red-600
    bg-red-600 text-white
    shadow-sm
    hover:border-red-700 hover:bg-red-700
  `,

  // Nút dạng text
  link: `
    border border-transparent
    bg-transparent text-emerald-700
    shadow-none
    underline-offset-4
    hover:text-emerald-800 hover:underline
  `,
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-xs",
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  xl: "h-12 px-6 text-base",
};

const iconSizes: Record<ButtonSize, string> = {
  xs: "h-8 w-8 p-0",
  sm: "h-9 w-9 p-0",
  md: "h-10 w-10 p-0",
  lg: "h-11 w-11 p-0",
  xl: "h-12 w-12 p-0",
};

const roundedStyles: Record<ButtonRounded, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export default function Button({
  children,

  variant = "primary",
  size = "md",
  rounded = "lg",

  fullWidth = false,
  iconOnly = false,

  leftIcon,
  rightIcon,

  loading = false,
  loadingText,

  disabled = false,
  type = "button",
  className = "",

  ...props
}: ButtonProps) {
  const buttonClassName = twMerge(
    [
      // Base styles
      "shrink-0 items-center justify-center",
      "gap-2 whitespace-nowrap select-none",
      "font-medium",
      "cursor-pointer",
      "transition-[color,background-color,border-color,box-shadow,opacity,scale] duration-200 ease-out",
      "motion-safe:enabled:active:scale-[0.98] motion-reduce:transition-none",
      "focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-emerald-500",
      "focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",

      // Variant
      variants[variant],

      // Size
      iconOnly ? iconSizes[size] : sizes[size],

      // Rounded
      roundedStyles[rounded],

      // Full width
      fullWidth ? "flex w-full" : "inline-flex",

      // Loading
      loading ? "cursor-wait" : "",

      // Custom class
      className,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName}
    >
      {/* Loading icon hoặc icon trái */}
      {loading ? (
        <LoaderCircle
          size={16}
          className="shrink-0 animate-spin"
          aria-hidden="true"
        />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}

      {/* Nội dung */}
      <span>{loading && loadingText ? loadingText : children}</span>

      {/* Icon phải */}
      {!loading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}
