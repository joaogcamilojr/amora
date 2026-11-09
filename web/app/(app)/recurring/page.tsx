import type { Metadata } from "next";

import { PageTitle } from "@/components/ds/headers";
import { Kpi } from "@/components/ds/kpi";
import { Widget } from "@/components/ds/widget";
import { NewRecurring, RecurringTable } from "@/components/finance/recurring";
import { openInstallmentPlans } from "@/lib/finance/cards";
import { toBase } from "@/lib/finance/fx";
import { financeForPage } from "@/lib/finance/page";
import {
  monthlyEquivalent,
  nextDate,
  whenLabel,
} from "@/lib/finance/recurring";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.items.recurring") };
}

/** Moedas oferecidas no formulário além da moeda-base e das moedas das contas. */
const COMMON_CURRENCIES = ["USD", "EUR"];

export default async function RecurringPage() {
  const d = await financeForPage();
  const { t, fmt } = await getI18n();
  const { civilDate, money, percent } = fmt;
  const today = fmt.today();
  const base = d.baseCode;
  const rows = d.recurring
    .map((r) => ({
      ...r,
      monthlyBase: toBase(monthlyEquivalent(r), r.assetCode, d.fx),
      when: whenLabel(r, t, fmt),
      next: nextDate(r, today),
    }))
    // Ativas primeiro, na ordem da próxima data; sem data definida vão para o fim.
    .sort(
      (a, b) =>
        Number(b.active) - Number(a.active) ||
        (a.next ?? "9999").localeCompare(b.next ?? "9999") ||
        (b.monthlyBase ?? 0) - (a.monthlyBase ?? 0),
    );
  const sum = (kind: "INCOME" | "EXPENSE") =>
    rows
      .filter((r) => r.active && r.kind === kind)
      .reduce((s, r) => s + (r.monthlyBase ?? 0), 0);
  const income = sum("INCOME");
  const expenses = sum("EXPENSE");
  const plans = openInstallmentPlans(d.movements);
  const plansTotal = plans.reduce((s, p) => s + p.remainingAmount, 0);
  const accounts = d.accounts
    .filter((a) => a.status === "ACTIVE")
    .map((a) => ({ id: a.id, name: a.name }));
  const accountName = new Map(d.accounts.map((a) => [a.id, a.name]));
  const currencies = [
    ...new Set([
      base,
      ...COMMON_CURRENCIES,
      ...d.accounts.flatMap((a) => a.balances.map((b) => b.asset.code)),
    ]),
  ];

  return (
    <>
      <PageTitle
        eyebrow={t("nav.groups.track")}
        title={t("nav.items.recurring")}
        description={t("recurring.page.description")}
        actions={
          <NewRecurring
            accounts={accounts}
            categories={d.categories}
            currencies={currencies}
          />
        }
      />
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi
          label={t("recurring.kpi.fixedIncome")}
          value={money(income, base)}
          context={t("recurring.kpi.perMonthActive")}
        />
        <Kpi
          label={t("recurring.kpi.fixedExpenses")}
          value={money(expenses, base)}
          context={t("recurring.kpi.perMonthActive")}
        />
        <Kpi
          label={t("recurring.kpi.commitment")}
          value={
            income > 0 ? percent(expenses / income) : t("common.states.none")
          }
          context={t("recurring.kpi.leftover", {
            amount: money(income - expenses, base),
          })}
        />
      </div>
      <div className="flex flex-col gap-4">
        <Widget title={t("recurring.page.income")} flush>
          <RecurringTable
            rows={rows.filter((r) => r.kind === "INCOME")}
            accounts={accounts}
            categories={d.categories}
            baseCode={base}
          />
        </Widget>
        <Widget title={t("recurring.page.expenses")} flush>
          <RecurringTable
            rows={rows.filter((r) => r.kind === "EXPENSE")}
            accounts={accounts}
            categories={d.categories}
            baseCode={base}
          />
        </Widget>
        <Widget
          title={t("recurring.installments.title")}
          context={t("recurring.installments.context", {
            count: plans.length,
            amount: money(plansTotal, base),
          })}
          flush
        >
          {plans.length === 0 ? (
            <p className="px-5 pb-5 text-[13px] text-neutral-600">
              {t("recurring.installments.none")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13px] leading-[18px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-[12px] text-neutral-600">
                    <th className="px-5 py-2.5 font-medium">
                      {t("recurring.installments.purchase")}
                    </th>
                    <th className="px-3 py-2.5 font-medium">
                      {t("recurring.installments.purchaseDate")}
                    </th>
                    <th className="px-3 py-2.5 font-medium">
                      {t("recurring.installments.installment")}
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium">
                      {t("recurring.installments.installmentAmount")}
                    </th>
                    <th className="px-5 py-2.5 text-right font-medium">
                      {t("recurring.installments.remaining")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr
                      key={p.key}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      <td className="px-5 py-2.5">
                        <p className="text-neutral-950">{p.description}</p>
                        <p className="text-[12px] text-neutral-500">
                          {accountName.get(p.accountId) ??
                            t("recurring.installments.card")}
                        </p>
                      </td>
                      <td className="tabular px-3 py-2.5">
                        {civilDate(p.purchaseDate)}
                      </td>
                      <td className="tabular px-3 py-2.5">
                        {p.number}/{p.count}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right">
                        {money(p.installmentAmount, base)}
                      </td>
                      <td className="tabular px-5 py-2.5 text-right font-medium text-neutral-950">
                        {money(p.remainingAmount, base)}{" "}
                        <span className="text-neutral-500">
                          {t("recurring.installments.remainingCount", {
                            count: p.remaining,
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Widget>
      </div>
    </>
  );
}
