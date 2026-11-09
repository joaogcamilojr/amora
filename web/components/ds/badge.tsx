import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

export type Tone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "ai";

const tones: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-800",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  ai: "bg-ai-bg text-ai",
};

/** Badge de estado: preenchimento suave + texto semântico. */
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[12px] leading-4 font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
