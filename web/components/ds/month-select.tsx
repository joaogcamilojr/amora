"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cx } from "@/lib/cx";
import { useI18n } from "@/lib/i18n/client";

export function MonthSelect({
  months,
  current,
  dark,
}: {
  months: string[];
  current: string;
  dark?: boolean;
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-[12px] font-medium">
      <span className={dark ? "text-neutral-300" : "text-neutral-600"}>
        {t("ds.monthSelect.period")}
      </span>
      <select
        value={current}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("month", e.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
        className={cx(
          "h-9 rounded-[var(--radius-control)] px-3 text-sm capitalize",
          dark
            ? "border border-white/15 bg-white/5 text-white [&>option]:text-neutral-900"
            : "border border-neutral-200 bg-surface text-neutral-800",
        )}
      >
        {[...months].reverse().map((m) => (
          <option key={m} value={m}>
            {fmt.longMonth(m)}
          </option>
        ))}
      </select>
    </label>
  );
}
