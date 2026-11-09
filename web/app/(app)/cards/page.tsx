import type { Metadata } from "next";
import Link from "next/link";

import { Badge, type Tone } from "@/components/ds/badge";
import { HolderSelect } from "@/components/ds/holder-select";
import { PageTitle } from "@/components/ds/headers";
import { IconCard } from "@/components/ds/icons";
import { EmptyBlock, Widget } from "@/components/ds/widget";
import { CardSettings } from "@/components/finance/card-settings";
import { StatementForm } from "@/components/finance/statement-form";
import { cx } from "@/lib/cx";
import type { Statement, StatementStatus } from "@/lib/finance/cards";
import { financeForPage, param, type PageProps } from "@/lib/finance/page";
import { cardSummaries } from "@/lib/finance/views";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.items.cards") };
}

const STATUS_TONE: Record<StatementStatus, Tone> = {
  paid: "success",
  closed: "warning",
  overdue: "danger",
  open: "info",
  future: "neutral",
};

const statementValue = (s: Statement) => s.officialTotal ?? s.itemsTotal;

export default async function CardsPage({ searchParams }: PageProps) {
  const p = await searchParams;
  const d = await financeForPage(param(p.holder));
  const { t, fmt } = await getI18n();
  const { civilDate, longMonth, percent, shortMonth } = fmt;
  const today = fmt.today();
  const statusLabel = (s: StatementStatus) => t(`enums.statementStatus.${s}`);
  const summaries = cardSummaries(d, today);
  const archived = d.accounts.filter(
    (a) => a.type === "CREDIT_CARD" && a.status !== "ACTIVE",
  );

  if (summaries.length === 0)
    return (
      <>
        <PageTitle
          eyebrow={t("nav.groups.track")}
          title={t("nav.items.cards")}
        />
        <Widget>
          <EmptyBlock title={t("cards.page.emptyTitle")}>
            {t("cards.page.emptyBody")}
          </EmptyBlock>
        </Widget>
      </>
    );

  const r =
    summaries.find((s) => s.account.id === param(p.card)) ?? summaries[0];
  const card = r.account;
  const code = card.balances[0]?.asset.code ?? d.baseCode;
  const m = (v: number) => fmt.money(v, code);
  const selected =
    r.statements.find((s) => s.month === param(p.statement)) ??
    r.current ??
    r.statements.at(-1);
  const categoryName = new Map(d.categories.map((c) => [c.id, c.name]));
  const accountName = new Map(d.accounts.map((a) => [a.id, a.name]));
  const future = r.statements.filter((s) => s.status === "future");
  const usedPct = r.limit > 0 ? Math.min(1, r.used / r.limit) : 0;
  const owedPct = r.limit > 0 ? Math.min(1, r.outstanding / r.limit) : 0;
  const unpaid = r.statements.filter(
    (s) => s.status === "overdue" || s.status === "closed",
  );
  const cashbackRate = card.card?.cashbackRate ?? 0;
  const cashbackYear = r.statements
    .filter((s) => s.month.startsWith(today.slice(0, 4)))
    .reduce((s, x) => s + x.expectedCashback, 0);
  const href = (month: string) => `/cards?card=${card.id}&statement=${month}`;
  const payers = d.accounts
    .filter((a) => a.type !== "CREDIT_CARD" && a.status === "ACTIVE")
    .map((a) => ({ id: a.id, name: a.name }));
  const lines = selected
    ? [
        ...selected.items.map((item) => ({
          kind: "item" as const,
          date: item.date,
          item,
        })),
        ...selected.payments.map((payment) => ({
          kind: "payment" as const,
          date: payment.date,
          payment,
        })),
      ].sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <>
      <PageTitle
        eyebrow={t("nav.groups.track")}
        title={t("nav.items.cards")}
        description={t("cards.page.description")}
        actions={
          <>
            <HolderSelect holders={d.holders} current={d.holder} />
            <CardSettings
              card={card}
              payers={payers}
              defaultLimitAssetId={card.balances[0]?.asset.id ?? null}
            />
          </>
        }
      >
        {summaries.length > 1 && (
          <nav
            aria-label={t("nav.items.cards")}
            className="flex flex-wrap gap-2"
          >
            {summaries.map((s) => (
              <Link
                key={s.account.id}
                href={`/cards?card=${s.account.id}`}
                aria-current={s.account.id === card.id ? "page" : undefined}
                className={cx(
                  "inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] border px-3 text-sm",
                  s.account.id === card.id
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-neutral-200 bg-surface",
                )}
              >
                <IconCard size={16} /> {s.account.name}
              </Link>
            ))}
          </nav>
        )}
      </PageTitle>

      {unpaid.length > 0 && (
        <p
          role="alert"
          className="mb-4 rounded-[var(--radius-card)] border border-warning/30 bg-warning-bg p-4 text-[13px] text-warning"
        >
          {unpaid
            .map((s) =>
              t("cards.page.unpaidAlert", {
                month: longMonth(s.month),
                amount: m(statementValue(s) - s.paidTotal),
                due: civilDate(s.dueDate),
              }),
            )
            .join(" · ")}
        </p>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-5 xl:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium text-neutral-600">
                {t("cards.limit.available")}
              </p>
              <p className="tabular mt-1 text-[28px] leading-[34px] font-semibold text-neutral-950">
                {m(r.available)}
              </p>
              <p className="text-[12px] text-neutral-500">
                {t("cards.limit.ofTotal", {
                  limit: m(r.limit),
                  percent: percent(usedPct),
                })}
              </p>
            </div>
            <div className="text-right text-[12px] text-neutral-600">
              <p>
                {t("cards.limit.schedule", {
                  closing: card.card?.closingDay ?? t("common.states.none"),
                  due: card.card?.dueDay ?? t("common.states.none"),
                })}
              </p>
              <p>
                {card.institutionName}
                {card.card?.lastFour &&
                  ` · ${t("cards.limit.lastFour", { digits: card.card.lastFour })}`}
              </p>
            </div>
          </div>
          <div
            className="mt-4 flex h-3 overflow-hidden rounded-full bg-neutral-100"
            role="img"
            aria-label={t("cards.limit.barLabel", {
              posted: m(r.outstanding),
              future: m(r.futureInstallments),
              available: m(r.available),
            })}
          >
            <div
              className="bg-brand-600"
              style={{ width: `${owedPct * 100}%` }}
            />
            <div
              className="bg-brand-300"
              style={{ width: `${Math.max(0, usedPct - owedPct) * 100}%` }}
            />
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
            <Legend
              color="bg-brand-600"
              label={t("cards.limit.posted")}
              value={m(r.outstanding)}
            />
            <Legend
              color="bg-brand-300"
              label={t("cards.limit.futureInstallments")}
              value={m(r.futureInstallments)}
            />
            <Legend
              color="bg-neutral-100"
              label={t("cards.limit.availableShort")}
              value={m(r.available)}
            />
          </dl>
          {(card.notes || cashbackRate > 0) && (
            <p className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 text-[12px] leading-4 text-neutral-600">
              {cashbackRate > 0 && (
                <Badge tone="success">
                  {t("cards.limit.cashbackBadge", {
                    rate: percent(cashbackRate),
                    amount: m(cashbackYear),
                    year: today.slice(0, 4),
                  })}
                </Badge>
              )}
              {card.notes}
            </p>
          )}
        </section>

        <section className="rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-5 xl:col-span-5">
          <p className="text-[12px] font-medium text-neutral-600">
            {t("cards.current.title")}
          </p>
          {r.current ? (
            <>
              <p className="tabular mt-1 text-[28px] leading-[34px] font-semibold text-neutral-950">
                {m(r.current.itemsTotal)}
              </p>
              <p className="text-[12px] text-neutral-500">
                {t("cards.current.dates", {
                  month: longMonth(r.current.month),
                  closing: civilDate(r.current.closingDate),
                  due: civilDate(r.current.dueDate),
                })}
              </p>
              <p className="mt-3 text-[12px] leading-4 text-neutral-600">
                {t("cards.current.partialNote")}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-neutral-600">
              {t("cards.current.none")}
            </p>
          )}
          {future.length > 0 && (
            <p className="mt-3 border-t border-neutral-100 pt-3 text-[12px] text-neutral-600">
              {t("cards.current.committed", { count: future.length })}{" "}
              <span className="tabular font-semibold text-neutral-950">
                {m(future.reduce((s, f) => s + f.itemsTotal, 0))}
              </span>
            </p>
          )}
        </section>
      </div>

      <Widget
        title={t("cards.statements.title")}
        context={t("cards.statements.context")}
        className="mb-4"
      >
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {r.statements.map((s) => {
            const active = s.month === selected?.month;
            return (
              <li key={s.month} className="shrink-0">
                <Link
                  href={href(s.month)}
                  aria-current={active ? "true" : undefined}
                  className={cx(
                    "flex w-[132px] flex-col gap-1 rounded-[var(--radius-control)] border p-3 transition-colors duration-150",
                    active
                      ? "border-brand-500 bg-brand-50"
                      : "border-neutral-200 hover:border-neutral-300",
                    s.status === "future" && !active && "border-dashed",
                  )}
                >
                  <span className="text-[12px] font-medium text-neutral-600 capitalize">
                    {shortMonth(s.month)}
                  </span>
                  <span className="tabular text-sm font-semibold text-neutral-950">
                    {m(statementValue(s))}
                  </span>
                  {s.expectedCashback > 0 && (
                    <span className="tabular text-[11px] text-success">
                      {t("cards.statements.cashback", {
                        amount: m(s.expectedCashback),
                      })}
                    </span>
                  )}
                  <Badge tone={STATUS_TONE[s.status]}>
                    {statusLabel(s.status)}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ol>
      </Widget>

      {selected && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Widget
            className="xl:col-span-8"
            title={t("cards.detail.title", {
              month: longMonth(selected.month),
            })}
            context={t("cards.detail.context", {
              closing: civilDate(selected.closingDate),
              due: civilDate(selected.dueDate),
              count: selected.items.length,
            })}
            action={
              <div className="flex items-center gap-2">
                <StatementForm
                  accountId={card.id}
                  month={selected.month}
                  closingDate={selected.closingDate}
                  dueDate={selected.dueDate}
                  total={selected.officialTotal}
                />
                <Badge tone={STATUS_TONE[selected.status]}>
                  {statusLabel(selected.status)}
                </Badge>
              </div>
            }
            flush
          >
            <dl className="grid grid-cols-2 gap-4 border-b border-neutral-100 px-5 pb-4 md:grid-cols-5">
              <Metric
                label={t("cards.detail.purchases")}
                value={m(
                  selected.items
                    .filter((i) => i.amount > 0)
                    .reduce((s, i) => s + i.amount, 0),
                )}
              />
              <Metric
                label={t("cards.detail.credits")}
                value={m(
                  -selected.items
                    .filter((i) => i.amount < 0)
                    .reduce((s, i) => s + i.amount, 0),
                )}
              />
              <Metric
                label={
                  selected.officialTotal !== null
                    ? t("cards.detail.issuerTotal")
                    : t("cards.detail.expectedTotal")
                }
                value={m(statementValue(selected))}
              />
              <Metric
                label={t("cards.detail.paid")}
                value={m(selected.paidTotal)}
              />
              {cashbackRate > 0 && (
                <Metric
                  label={t("cards.detail.expectedCashback", {
                    rate: percent(cashbackRate),
                  })}
                  value={`≈ ${m(selected.expectedCashback)}`}
                  highlight
                />
              )}
            </dl>
            {selected.officialTotal !== null &&
              Math.abs(selected.officialTotal - selected.itemsTotal) > 0.01 && (
                <p className="mx-5 mt-3 text-[12px] text-neutral-500">
                  {t("cards.detail.differenceNote", {
                    amount: m(selected.itemsTotal),
                  })}
                </p>
              )}
            {lines.length === 0 ? (
              <EmptyBlock title={t("cards.detail.emptyTitle")}>
                {t("cards.detail.emptyBody")}
              </EmptyBlock>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-[13px] leading-[18px]">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-[12px] text-neutral-600">
                      <th className="px-5 py-2.5 font-medium">
                        {t("common.fields.date")}
                      </th>
                      <th className="px-3 py-2.5 font-medium">
                        {t("common.fields.description")}
                      </th>
                      <th className="px-3 py-2.5 font-medium">
                        {t("common.fields.category")}
                      </th>
                      <th className="px-5 py-2.5 text-right font-medium">
                        {t("common.fields.amount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) =>
                      line.kind === "payment" ? (
                        <tr
                          key={`p-${line.payment.id}`}
                          className="border-b border-neutral-100 bg-success-bg/40 last:border-0"
                        >
                          <td className="tabular px-5 py-2.5 whitespace-nowrap">
                            {civilDate(line.payment.date)}
                          </td>
                          <td className="px-3 py-2.5" colSpan={2}>
                            <span className="font-medium text-success">
                              {t("cards.detail.payment")}
                            </span>
                            {line.payment.sourceAccountId ? (
                              <Link
                                href={`/transactions?accountId=${line.payment.sourceAccountId}&month=${line.payment.date.slice(0, 7)}`}
                                className="ml-1 text-brand-700 hover:underline"
                              >
                                {t("cards.detail.via", {
                                  account:
                                    accountName.get(
                                      line.payment.sourceAccountId,
                                    ) ?? t("cards.detail.otherAccount"),
                                })}
                              </Link>
                            ) : (
                              <span className="ml-1 text-neutral-500">
                                {t("cards.detail.unknownSource")}
                              </span>
                            )}
                            {line.payment.pending && (
                              <span className="ml-2">
                                <Badge tone="warning">
                                  {t("cards.detail.toConfirm")}
                                </Badge>
                              </span>
                            )}
                          </td>
                          <td className="tabular px-5 py-2.5 text-right font-medium text-success">
                            − {m(line.payment.amount)}
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={`i-${line.item.id}`}
                          className={cx(
                            "border-b border-neutral-100 last:border-0",
                            line.item.projected && "text-neutral-500",
                          )}
                        >
                          <td className="tabular px-5 py-2.5 whitespace-nowrap">
                            {civilDate(line.item.date)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={
                                line.item.projected ? "" : "text-neutral-950"
                              }
                            >
                              {line.item.description}
                            </span>
                            <span className="ml-2 inline-flex gap-1">
                              {line.item.installment && (
                                <Badge tone="brand">
                                  {line.item.installment.number}/
                                  {line.item.installment.count}
                                </Badge>
                              )}
                              {line.item.projected && (
                                <Badge>{t("cards.detail.projected")}</Badge>
                              )}
                              {line.item.pending && (
                                <Badge tone="warning">
                                  {t("cards.detail.toConfirm")}
                                </Badge>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            {categoryName.get(line.item.categoryId ?? "") ??
                              t("common.states.none")}
                          </td>
                          <td
                            className={cx(
                              "tabular px-5 py-2.5 text-right font-medium",
                              line.item.amount < 0
                                ? "text-success"
                                : !line.item.projected && "text-neutral-950",
                            )}
                          >
                            {m(line.item.amount)}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Widget>

          <div className="flex flex-col gap-4 xl:col-span-4">
            <Widget
              title={t("cards.payments.title")}
              context={t("cards.payments.context")}
            >
              {selected.payments.length === 0 ? (
                <p className="text-[13px] text-neutral-600">
                  {t("cards.payments.none")}
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-neutral-100 text-[13px]">
                  {selected.payments.map((pay) => (
                    <li
                      key={pay.id}
                      className="flex items-center justify-between py-2"
                    >
                      <span>
                        <span className="tabular text-neutral-600">
                          {civilDate(pay.date)}
                        </span>{" "}
                        ·{" "}
                        {pay.sourceAccountId ? (
                          <Link
                            href={`/transactions?accountId=${pay.sourceAccountId}&month=${pay.date.slice(0, 7)}`}
                            className="text-brand-700 hover:underline"
                          >
                            {accountName.get(pay.sourceAccountId) ??
                              t("cards.detail.otherAccount")}
                          </Link>
                        ) : (
                          pay.description
                        )}
                        {pay.pending && (
                          <span className="ml-1 text-[12px] text-warning">
                            {t("cards.detail.toConfirmInline")}
                          </span>
                        )}
                      </span>
                      <span className="tabular font-medium text-success">
                        {m(pay.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Widget>

            <Widget
              title={t("cards.upcoming.title")}
              context={t("cards.upcoming.context")}
            >
              {future.length === 0 ? (
                <p className="text-[13px] text-neutral-600">
                  {t("cards.upcoming.none")}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {future.map((f) => {
                    const max = Math.max(...future.map((x) => x.itemsTotal), 1);
                    return (
                      <li key={f.month}>
                        <Link
                          href={href(f.month)}
                          className="block rounded-[6px] hover:bg-neutral-50"
                        >
                          <div className="mb-1 flex justify-between text-[13px]">
                            <span className="capitalize">
                              {shortMonth(f.month)}
                            </span>
                            <span className="tabular font-medium text-neutral-950">
                              {m(f.itemsTotal)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-neutral-100">
                            <div
                              className="h-2 rounded-full bg-brand-500"
                              style={{
                                width: `${(f.itemsTotal / max) * 100}%`,
                              }}
                            />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Widget>

            {archived.length > 0 && (
              <Widget title={t("cards.archived.title")}>
                <ul className="flex flex-col gap-2 text-[13px]">
                  {archived.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between"
                    >
                      {a.name}
                      <Badge>{t("cards.archived.badge")}</Badge>
                    </li>
                  ))}
                </ul>
              </Widget>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-neutral-600">
        <span className={cx("h-2.5 w-2.5 rounded-[3px]", color)} />
        {label}
      </dt>
      <dd className="tabular mt-0.5 font-semibold text-neutral-950">{value}</dd>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[12px] text-neutral-600">{label}</dt>
      <dd
        className={cx(
          "tabular mt-0.5 text-base font-semibold",
          highlight ? "text-success" : "text-neutral-950",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
