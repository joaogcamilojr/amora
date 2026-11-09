import Link from "next/link";

import type { FinanceData } from "@/lib/finance/load";
import { getI18n } from "@/lib/i18n/server";

/**
 * Aviso de que os valores convertidos para a moeda-base são estimativas (visão calculada com a cotação mais recente).
 * Só aparece quando há alguma moeda diferente da base em uso.
 */
export async function FxNotice({
  data,
  className,
}: {
  data: FinanceData;
  className?: string;
}) {
  const foreign =
    data.accounts.some((a) =>
      a.balances.some((b) => b.asset.code !== data.baseCode),
    ) || data.holdings.some((h) => h.assetCode !== data.baseCode);
  if (!foreign) return null;
  const { t } = await getI18n();
  const stale = Object.values(data.fxSources).some((s) => s.stale);
  return (
    <p
      className={`rounded-[var(--radius-control)] border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] leading-4 text-neutral-600 ${className ?? ""}`}
    >
      <span aria-hidden="true">≈ </span>
      {t("accounts.rates.estimateNotice", { base: data.baseCode })}{" "}
      {stale && (
        <strong className="text-warning">{t("accounts.rates.stale")}. </strong>
      )}
      <Link
        href="/accounts#rates"
        className="font-medium text-brand-700 hover:underline"
      >
        {t("accounts.rates.estimateLink")}
      </Link>
    </p>
  );
}
