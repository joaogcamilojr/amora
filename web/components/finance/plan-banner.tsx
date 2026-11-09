import Link from "next/link";

import type { getBillingStatus } from "@/lib/finance/billing";
import { getI18n } from "@/lib/i18n/server";

/** Aviso no topo do app: teste em curso, pagamento pendente ou somente leitura. Some com assinatura ativa. */
export async function PlanBanner({
  billing,
}: {
  billing: Awaited<ReturnType<typeof getBillingStatus>>;
}) {
  const { t } = await getI18n();
  const message =
    billing.accessState === "TRIAL"
      ? t("billing.banner.trial", { count: billing.trialDaysLeft })
      : billing.accessState === "EXPIRED"
        ? t("billing.banner.expired")
        : billing.accessState === "PAST_DUE"
          ? t("billing.banner.pastDue")
          : null;
  if (!message || billing.inheritedFromHousehold || billing.billingDisabled)
    return null;
  const urgent = billing.accessState !== "TRIAL";
  return (
    <p
      role="status"
      className={`mb-4 rounded-[var(--radius-control)] px-3 py-2 text-[13px] ${urgent ? "bg-warning-bg text-warning" : "bg-brand-50 text-brand-700"}`}
    >
      {message}{" "}
      <Link href="/settings#billing" className="font-medium underline">
        {t("billing.banner.link")}
      </Link>
    </p>
  );
}
