import Link from "next/link";

import { Badge } from "@/components/ds/badge";
import { HorizontalBars } from "@/components/ds/charts/horizontal-bars";
import { MonthlyBars } from "@/components/ds/charts/monthly-bars";
import { HolderSelect } from "@/components/ds/holder-select";
import { DarkHero } from "@/components/ds/headers";
import { IconAlert, IconImport, IconPlus } from "@/components/ds/icons";
import { Kpi } from "@/components/ds/kpi";
import { MonthSelect } from "@/components/ds/month-select";
import { EmptyBlock, Widget } from "@/components/ds/widget";
import { FxNotice } from "@/components/finance/fx-notice";
import { TransactionsTable } from "@/components/finance/transactions-table";
import {
  averageOfLast,
  expensesByCategory,
  monthlySummary,
  netWorth,
} from "@/lib/finance/analysis";
import { financeForPage, param, type PageProps } from "@/lib/finance/page";
import { monthlyEquivalent } from "@/lib/finance/recurring";
import { toBase } from "@/lib/finance/fx";
import { pendingReview, staleAccounts } from "@/lib/finance/views";
import type { Formatter } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("dashboard.metaTitle") };
}

const STALE_DAYS = 45;

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const d = await financeForPage(param(sp.holder));
  const { t, fmt } = await getI18n();
  const month = param(sp.month) ?? d.months.at(-1) ?? fmt.currentMonth();
  const base = d.baseCode;
  const money = (value: number, code: string = base) => fmt.money(value, code);

  const summary = monthlySummary(d.movements);
  const current = summary.find((s) => s.month === month) ?? {
    month,
    income: 0,
    expenses: 0,
    result: 0,
  };
  const previous = summary.filter((s) => s.month < month).at(-1);
  const window = summary.filter((s) => s.month <= month).slice(-12);
  const avg3 = averageOfLast(
    summary.filter((s) => s.month <= month),
    3,
  );
  const worth = netWorth(d.accounts, d.holdings);
  const review = pendingReview(d);

  const categories = expensesByCategory(d.movements, d.categories, (m) =>
    m.date.startsWith(month),
  );
  const generic = new Set(
    d.categories.filter((c) => c.slug === "sem-categoria").map((c) => c.id),
  );
  const uncategorizedMonth = d.movements.filter(
    (m) =>
      m.date.startsWith(month) &&
      (m.type === "EXPENSE" || m.type === "INCOME") &&
      (!m.categoryId || generic.has(m.categoryId)),
  ).length;

  const fixed = (kind: "INCOME" | "EXPENSE") =>
    d.recurring
      .filter((r) => r.active && r.kind === kind)
      .reduce(
        (s, r) => s + (toBase(monthlyEquivalent(r), r.assetCode, d.fx) ?? 0),
        0,
      );

  const stale = staleAccounts(d, STALE_DAYS);

  const vsContext = previous
    ? t("dashboard.kpi.vsMonth", { month: fmt.shortMonth(previous.month) })
    : fmt.longMonth(month);
  const reviewLabel = t("dashboard.attention.review");
  const okLabel = t("dashboard.attention.ok");

  const latest = d.movements
    .filter((m) => m.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <>
      <DarkHero
        eyebrow={t("dashboard.hero.eyebrow")}
        title={t("dashboard.hero.title")}
        description={t("dashboard.hero.description")}
        actions={
          <>
            <MonthSelect months={d.months} current={month} dark />
            <HolderSelect holders={d.holders} current={d.holder} dark />
            <Link
              href="/import"
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] border border-white/15 px-4 text-sm font-medium text-white hover:bg-white/10"
            >
              <IconImport size={16} /> {t("dashboard.hero.importStatement")}
            </Link>
            <Link
              href="/transactions?new=1"
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-500"
            >
              <IconPlus size={16} /> {t("dashboard.hero.newTransaction")}
            </Link>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            dark
            label={t("dashboard.kpi.income")}
            value={money(current.income)}
            context={vsContext}
            delta={delta(fmt, current.income, previous?.income, true)}
          />
          <Kpi
            dark
            label={t("dashboard.kpi.expenses")}
            value={money(current.expenses)}
            context={vsContext}
            delta={delta(fmt, current.expenses, previous?.expenses, false)}
          />
          <Kpi
            dark
            label={t("dashboard.kpi.result")}
            value={money(current.result)}
            context={
              current.income > 0
                ? t("dashboard.kpi.shareOfIncome", {
                    percent: fmt.percent(current.result / current.income),
                  })
                : fmt.longMonth(month)
            }
          />
          <Kpi
            dark
            label={t("dashboard.kpi.netWorth")}
            value={money(worth.totalBase)}
            context={t("dashboard.kpi.netWorthContext", { currency: base })}
          />
        </div>
      </DarkHero>

      <FxNotice data={d} className="mb-4" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Widget
          className="xl:col-span-8"
          title={t("dashboard.incomeVsExpenses.title")}
          context={t("dashboard.incomeVsExpenses.context", {
            count: window.length,
            month: fmt.longMonth(month),
          })}
        >
          {window.length ? (
            <MonthlyBars data={window} />
          ) : (
            <EmptyBlock title={t("dashboard.incomeVsExpenses.empty")} />
          )}
        </Widget>

        <Widget
          className="xl:col-span-4"
          title={t("dashboard.byCategory.title")}
          context={fmt.longMonth(month)}
          action={
            <Link
              href={`/transactions?month=${month}&type=EXPENSE`}
              className="text-[13px] font-medium text-brand-700 hover:underline"
            >
              {t("dashboard.byCategory.seeAll")}
            </Link>
          }
        >
          {categories.length ? (
            <HorizontalBars
              items={categories.map((c) => ({
                id: c.categoryId,
                label: c.name ?? t("common.noCategory"),
                value: c.total,
                href: `/transactions?month=${month}&type=EXPENSE&categoryId=${c.categoryId === "_uncategorized" ? "_none" : c.categoryId}`,
              }))}
            />
          ) : (
            <EmptyBlock title={t("dashboard.byCategory.empty")} />
          )}
        </Widget>

        <Widget
          className="xl:col-span-4"
          title={t("dashboard.attention.title")}
          context={t("dashboard.attention.context")}
        >
          <ul className="flex flex-col divide-y divide-neutral-100 text-[13px] leading-[18px]">
            <AttentionItem
              active={uncategorizedMonth > 0}
              text={t("dashboard.attention.uncategorized", {
                count: uncategorizedMonth,
                month: fmt.shortMonth(month),
              })}
              href={`/transactions?month=${month}&categoryId=${[...generic][0] ?? "_none"}`}
              ok={t("dashboard.attention.uncategorizedOk")}
              reviewLabel={reviewLabel}
              okLabel={okLabel}
            />
            <AttentionItem
              active={review.pending > 0}
              text={t("dashboard.attention.pending", { count: review.pending })}
              href="/transactions?pending=true"
              ok={t("dashboard.attention.pendingOk")}
              reviewLabel={reviewLabel}
              okLabel={okLabel}
            />
            <AttentionItem
              active={stale.length > 0}
              text={t("dashboard.attention.stale", {
                count: stale.length,
                days: STALE_DAYS,
              })}
              href="/import"
              ok={t("dashboard.attention.staleOk")}
              reviewLabel={reviewLabel}
              okLabel={okLabel}
            />
            <AttentionItem
              active={worth.missingRates.length > 0}
              text={t("dashboard.attention.missingRates", {
                codes: worth.missingRates.join(", "),
              })}
              href="/accounts#rates"
              ok={t("dashboard.attention.missingRatesOk")}
              reviewLabel={reviewLabel}
              okLabel={okLabel}
            />
          </ul>
        </Widget>

        <Widget
          className="xl:col-span-4"
          title={t("dashboard.pace.title")}
          context={t("dashboard.pace.context")}
        >
          <dl className="grid grid-cols-2 gap-4">
            <Metric
              label={t("dashboard.pace.avgIncome")}
              value={money(avg3.income)}
            />
            <Metric
              label={t("dashboard.pace.avgExpenses")}
              value={money(avg3.expenses)}
            />
            <Metric
              label={t("dashboard.pace.fixedIncome")}
              value={money(fixed("INCOME"))}
            />
            <Metric
              label={t("dashboard.pace.fixedExpenses")}
              value={money(fixed("EXPENSE"))}
            />
          </dl>
          {avg3.expenses > avg3.income && (
            <p className="mt-4 flex gap-2 rounded-[var(--radius-control)] bg-warning-bg p-3 text-[13px] leading-[18px] text-warning">
              <IconAlert size={16} className="mt-0.5 shrink-0" />
              {t("dashboard.pace.overspending", {
                amount: money(avg3.expenses - avg3.income),
              })}
            </p>
          )}
        </Widget>

        <Widget
          className="xl:col-span-4"
          title={t("dashboard.balances.title")}
          context={t("dashboard.balances.context")}
          action={
            <Link
              href="/accounts"
              className="text-[13px] font-medium text-brand-700 hover:underline"
            >
              {t("dashboard.balances.accountsLink")}
            </Link>
          }
        >
          <ul className="flex flex-col divide-y divide-neutral-100">
            {worth.byAsset.map((a) => (
              <li
                key={a.assetCode}
                className="flex items-center justify-between py-2.5 text-[13px]"
              >
                <span className="font-medium text-neutral-800">
                  {a.assetCode}
                </span>
                <span className="tabular text-right">
                  <span className="block text-neutral-950">
                    {money(a.amount, a.assetCode)}
                  </span>
                  {a.assetCode !== base && (
                    <span className="block text-[12px] text-neutral-500">
                      {a.base === null
                        ? t("common.noRate")
                        : `≈ ${money(a.base)}`}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-neutral-500">
            {t("dashboard.balances.countries")}{" "}
            {[...new Set(d.accounts.map((a) => a.countryCode).filter(Boolean))]
              .map((c) => fmt.countryFlag(c as string) || c)
              .join(" ")}
          </p>
        </Widget>

        <Widget
          className="xl:col-span-12"
          title={t("dashboard.recent.title")}
          context={fmt.longMonth(month)}
          flush
          action={
            <Link
              href={`/transactions?month=${month}`}
              className="text-[13px] font-medium text-brand-700 hover:underline"
            >
              {t("dashboard.recent.open")}
            </Link>
          }
        >
          <TransactionsTable
            rows={latest}
            accounts={d.accounts.map((a) => ({ id: a.id, name: a.name }))}
            categories={d.categories}
            baseCode={base}
            readOnly
          />
        </Widget>
      </div>
    </>
  );
}

function delta(
  fmt: Formatter,
  value: number,
  previous: number | undefined,
  upIsGood: boolean,
) {
  if (!previous) return undefined;
  const change = (value - previous) / previous;
  const up = change >= 0;
  return { text: fmt.percent(Math.abs(change)), up, good: up === upIsGood };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] leading-4 text-neutral-600">{label}</dt>
      <dd className="tabular mt-1 text-lg leading-6 font-semibold text-neutral-950">
        {value}
      </dd>
    </div>
  );
}

function AttentionItem({
  active,
  text,
  href,
  ok,
  reviewLabel,
  okLabel,
}: {
  active: boolean;
  text: string;
  href: string;
  ok: string;
  reviewLabel: string;
  okLabel: string;
}) {
  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      {active ? (
        <Link
          href={href}
          className="flex items-center justify-between gap-3 hover:text-brand-700"
        >
          <span>{text}</span>
          <Badge tone="warning">{reviewLabel}</Badge>
        </Link>
      ) : (
        <span className="flex items-center justify-between gap-3 text-neutral-600">
          {ok}
          <Badge tone="success">{okLabel}</Badge>
        </span>
      )}
    </li>
  );
}
