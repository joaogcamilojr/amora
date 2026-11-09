import { HorizontalBars } from "@/components/ds/charts/horizontal-bars";
import { HolderSelect } from "@/components/ds/holder-select";
import { PageTitle } from "@/components/ds/headers";
import { Kpi } from "@/components/ds/kpi";
import { EmptyBlock, Widget } from "@/components/ds/widget";
import { FxNotice } from "@/components/finance/fx-notice";
import { HoldingsTable, NewHolding } from "@/components/finance/holdings";
import { getCountryLabel } from "@/lib/countries";
import { netWorth } from "@/lib/finance/analysis";
import { financeForPage, param, type PageProps } from "@/lib/finance/page";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("holdings.page.metadataTitle") };
}

/** Sugestões além da moeda-base do usuário e das moedas das contas dele. */
const SUGGESTED_CURRENCIES = ["USD", "EUR", "BTC", "ETH", "USDT"];

export default async function HoldingsPage({ searchParams }: PageProps) {
  const d = await financeForPage(param((await searchParams).holder));
  const { t, fmt, locale } = await getI18n();
  const base = d.baseCode;
  const worth = netWorth(d.accounts, d.holdings);
  const holdings = [...d.holdings].sort(
    (a, b) => (b.base ?? 0) - (a.base ?? 0),
  );

  const byClass = new Map<string, number>();
  byClass.set(t("holdings.page.cashClass"), worth.accountsBase);
  for (const h of holdings) {
    const label = t(`enums.holdingClass.${h.class}`);
    byClass.set(label, (byClass.get(label) ?? 0) + (h.base ?? 0));
  }
  const home = d.homeCountry;
  const abroad =
    holdings
      .filter((h) => h.countryCode && h.countryCode !== home)
      .reduce((s, h) => s + (h.base ?? 0), 0) +
    d.accounts
      .filter(
        (a) => a.status === "ACTIVE" && a.countryCode && a.countryCode !== home,
      )
      .flatMap((a) => a.balances)
      .reduce((s, b) => s + Math.max(0, b.base ?? 0), 0);
  const gross = worth.accountsBase + worth.holdingsBase;
  const currencies = [
    ...new Set([
      d.baseCode,
      ...SUGGESTED_CURRENCIES,
      ...d.accounts.flatMap((a) => a.balances.map((b) => b.asset.code)),
    ]),
  ];

  return (
    <>
      <PageTitle
        eyebrow={t("holdings.page.eyebrow")}
        title={t("holdings.page.title")}
        description={t("holdings.page.description")}
        actions={
          <>
            <HolderSelect holders={d.holders} current={d.holder} />
            <NewHolding currencies={currencies} homeCountry={home} />
          </>
        }
      />
      <FxNotice data={d} className="mb-4" />
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label={t("holdings.kpi.netWorth")}
          value={fmt.money(worth.totalBase, base)}
          context={t("holdings.kpi.netWorthContext", { base })}
        />
        <Kpi
          label={t("holdings.kpi.holdings")}
          value={fmt.money(worth.holdingsBase, base)}
          context={t("holdings.kpi.holdingsContext", {
            count: holdings.length,
          })}
        />
        <Kpi
          label={t("holdings.kpi.cash")}
          value={fmt.money(worth.accountsBase, base)}
          context={t("holdings.kpi.cashContext", {
            amount: fmt.money(worth.debtsBase, base),
          })}
        />
        <Kpi
          label={t("holdings.kpi.abroad", {
            country: home ? getCountryLabel(home, locale) : "—",
          })}
          value={home ? fmt.money(abroad, base) : "—"}
          context={
            !home
              ? t("holdings.kpi.abroadNoCountry")
              : gross > 0
                ? t("holdings.kpi.abroadContext", {
                    share: fmt.percent(abroad / gross),
                  })
                : t("common.states.none")
          }
        />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Widget
          className="xl:col-span-4"
          title={t("holdings.composition.title")}
          context={t("holdings.composition.context", { base })}
        >
          <HorizontalBars
            items={[...byClass.entries()]
              .filter(([, v]) => v > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value]) => ({ id: label, label, value }))}
          />
        </Widget>
        <Widget
          className="xl:col-span-8"
          title={t("holdings.list.title")}
          context={t("holdings.list.context")}
          flush
        >
          {holdings.length ? (
            <HoldingsTable
              rows={holdings}
              currencies={currencies}
              baseCode={base}
              homeCountry={home}
            />
          ) : (
            <EmptyBlock title={t("holdings.list.emptyTitle")}>
              {t("holdings.list.emptyBody")}
            </EmptyBlock>
          )}
        </Widget>
      </div>
    </>
  );
}
