import { ButtonLink, buttonClasses } from "@/components/ds/button";
import { Field, Input, Select } from "@/components/ds/field";
import { HolderSelect } from "@/components/ds/holder-select";
import { PageTitle } from "@/components/ds/headers";
import { Widget } from "@/components/ds/widget";
import { NewTransaction } from "@/components/finance/new-transaction";
import { TransactionsTable } from "@/components/finance/transactions-table";
import { financeForPage, param, type PageProps } from "@/lib/finance/page";
import { pockets } from "@/lib/finance/pockets";
import { EDITABLE_TYPES } from "@/lib/finance/types";
import { filterMovements } from "@/lib/finance/views";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("transactions.metaTitle") };
}

const LIMIT = 500;

export default async function TransactionsPage({ searchParams }: PageProps) {
  const p = await searchParams;
  const d = await financeForPage(param(p.holder));
  const { t, fmt } = await getI18n();
  const filter = {
    month: param(p.month),
    accountId: param(p.accountId),
    type: param(p.type),
    categoryId: param(p.categoryId),
    tag: param(p.tag),
    q: param(p.q),
    pending: param(p.pending) === "true",
  };
  const rows = filterMovements(d.movements, filter);
  const inflow = rows
    .filter((m) => (m.baseAmount ?? 0) > 0)
    .reduce((s, m) => s + (m.baseAmount ?? 0), 0);
  const outflow = rows
    .filter((m) => (m.baseAmount ?? 0) < 0)
    .reduce((s, m) => s - (m.baseAmount ?? 0), 0);
  const hasFilter = Object.values(filter).some(Boolean);
  const tags = [...new Set(d.movements.flatMap((m) => m.tags))].sort();
  const accountOptions = d.accounts.map((a) => ({ id: a.id, name: a.name }));

  return (
    <>
      <PageTitle
        eyebrow={t("transactions.page.eyebrow")}
        title={t("transactions.page.title")}
        description={t("transactions.page.description")}
        actions={
          <>
            <HolderSelect holders={d.holders} current={d.holder} />
            <NewTransaction
              pockets={pockets(d.accounts)}
              categories={d.categories}
              baseCode={d.baseCode}
              openInitially={param(p.new) === "1"}
            />
          </>
        }
      />

      <form
        method="get"
        className="mb-4 grid grid-cols-2 gap-3 rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-4 md:grid-cols-3 xl:grid-cols-6"
      >
        <Field label={t("transactions.filters.period")}>
          <Select name="month" defaultValue={filter.month ?? ""}>
            <option value="">{t("transactions.filters.allMasculine")}</option>
            {[...d.months].reverse().map((m) => (
              <option key={m} value={m}>
                {fmt.longMonth(m)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.fields.account")}>
          <Select name="accountId" defaultValue={filter.accountId ?? ""}>
            <option value="">{t("transactions.filters.allFeminine")}</option>
            {accountOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.fields.type")}>
          <Select name="type" defaultValue={filter.type ?? ""}>
            <option value="">{t("transactions.filters.allMasculine")}</option>
            {[
              ...EDITABLE_TYPES,
              "CARD_PAYMENT" as const,
              "EXCHANGE" as const,
            ].map((type) => (
              <option key={type} value={type}>
                {t(`enums.transactionType.${type}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.fields.category")}>
          <Select name="categoryId" defaultValue={filter.categoryId ?? ""}>
            <option value="">{t("transactions.filters.allFeminine")}</option>
            <option value="_none">{t("common.noCategory")}</option>
            {d.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("transactions.filters.tag")}>
          <Select name="tag" defaultValue={filter.tag ?? ""}>
            <option value="">{t("transactions.filters.allFeminine")}</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.actions.search")}>
          <Input
            name="q"
            defaultValue={filter.q ?? ""}
            placeholder={t("common.fields.description")}
          />
        </Field>
        <label className="col-span-2 flex items-center gap-2 text-[13px] text-neutral-700 md:col-span-1">
          <input
            type="checkbox"
            name="pending"
            value="true"
            defaultChecked={filter.pending}
            className="accent-brand-600"
          />
          {t("transactions.filters.pendingOnly")}
        </label>
        <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-2 xl:col-span-5">
          {hasFilter && (
            <ButtonLink href="/transactions" variant="tertiary">
              {t("transactions.filters.clear")}
            </ButtonLink>
          )}
          <button type="submit" className={buttonClasses("secondary")}>
            {t("transactions.filters.apply")}
          </button>
        </div>
      </form>

      <Widget
        title={t("transactions.list.count", { count: rows.length })}
        context={t("transactions.list.totals", {
          inflow: fmt.money(inflow, d.baseCode),
          outflow: fmt.money(outflow, d.baseCode),
          currency: d.baseCode,
        })}
        flush
      >
        <TransactionsTable
          rows={rows.slice(0, LIMIT)}
          accounts={accountOptions}
          categories={d.categories}
          baseCode={d.baseCode}
        />
        {rows.length > LIMIT && (
          <p className="px-5 py-3 text-[12px] text-neutral-500">
            {t("transactions.list.truncated", {
              limit: LIMIT,
              total: rows.length,
            })}
          </p>
        )}
      </Widget>
    </>
  );
}
