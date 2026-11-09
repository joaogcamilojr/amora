import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

import { cx } from "@/lib/cx";

const control =
  "h-10 w-full rounded-[var(--radius-control)] border border-neutral-200 bg-surface px-3 text-sm text-neutral-800 placeholder:text-neutral-500 hover:border-neutral-300 focus:border-brand-500 focus:outline-2 focus:outline-brand-500/30";

/** Label externa persistente — placeholder não substitui label. */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] leading-4 font-medium text-neutral-800">
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-[12px] leading-4 text-neutral-500">{hint}</span>
      )}
    </label>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(control, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(control, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}
