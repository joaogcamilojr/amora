"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cx } from "@/lib/cx";
import { useI18n } from "@/lib/i18n/client";

/** Filtro por titular (membro do grupo familiar). Some quando o usuário não tem grupo com membros. */
export function HolderSelect({
  holders,
  current,
  dark,
}: {
  holders: { id: string; name: string | null }[];
  current: string | null;
  dark?: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const pathname = usePathname();
  const params = useSearchParams();
  if (holders.length === 0) return null;
  return (
    <label className="flex items-center gap-2 text-[12px] font-medium">
      <span className={dark ? "text-neutral-300" : "text-neutral-600"}>
        {t("ds.holderSelect.label")}
      </span>
      <select
        value={current ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value) next.set("holder", e.target.value);
          else next.delete("holder");
          router.push(`${pathname}?${next.toString()}`);
        }}
        className={cx(
          "h-9 rounded-[var(--radius-control)] px-3 text-sm",
          dark
            ? "border border-white/15 bg-white/5 text-white [&>option]:text-neutral-900"
            : "border border-neutral-200 bg-surface text-neutral-800",
        )}
      >
        <option value="">{t("ds.holderSelect.all")}</option>
        <option value="none">{t("ds.holderSelect.none")}</option>
        {holders.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name ?? t("ds.holderSelect.unnamed")}
          </option>
        ))}
      </select>
    </label>
  );
}
