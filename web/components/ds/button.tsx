import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "tertiary" | "danger";
type Size = "compact" | "default";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary:
    "bg-surface text-neutral-800 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50",
  tertiary: "text-brand-700 hover:bg-brand-50",
  danger: "bg-danger text-white hover:brightness-95",
};

const sizes: Record<Size, string> = {
  compact: "h-8 px-3 text-[13px]",
  default: "h-9 px-4 text-sm",
};

export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "default",
) {
  return cx(base, variants[variant], sizes[size]);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "default",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(buttonClasses(variant, size), className)}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "default",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, size)}>
      {children}
    </Link>
  );
}
