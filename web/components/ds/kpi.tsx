import { cx } from "@/lib/cx";

import { IconArrowDown, IconArrowUp } from "./icons";

/** KPI: o número é protagonista; sempre com rótulo e contexto temporal. */
export function Kpi({
  label,
  value,
  context,
  delta,
  dark,
}: {
  label: string;
  value: string;
  context: string;
  delta?: { text: string; good: boolean; up: boolean };
  dark?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-[var(--radius-card)] p-5",
        dark
          ? "border border-white/10 bg-white/5"
          : "border border-neutral-200 bg-surface",
      )}
    >
      <p
        className={cx(
          "text-[12px] leading-4 font-medium",
          dark ? "text-neutral-300" : "text-neutral-600",
        )}
      >
        {label}
      </p>
      <p
        className={cx(
          "tabular mt-2 text-[28px] leading-[34px] font-semibold",
          dark ? "text-white" : "text-neutral-950",
        )}
      >
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] leading-4">
        {delta && (
          <span
            className={cx(
              "inline-flex items-center gap-0.5 rounded-[6px] px-1.5 py-0.5 font-medium",
              delta.good
                ? "bg-success-bg text-success"
                : "bg-danger-bg text-danger",
            )}
          >
            {delta.up ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />}
            {delta.text}
          </span>
        )}
        <span className={dark ? "text-neutral-300" : "text-neutral-500"}>
          {context}
        </span>
      </div>
    </div>
  );
}
