"use client";

import type { CategoryKind, RecurrenceFrequency } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Dialog } from "@/components/ds/dialog";
import { Field, Input, Select } from "@/components/ds/field";
import { IconPlus } from "@/components/ds/icons";
import { cx } from "@/lib/cx";
import { api, decimalInput } from "@/lib/finance/client";
import type { CategoryView, RecurringView } from "@/lib/finance/types";
import { useI18n } from "@/lib/i18n/client";

const FREQUENCIES: RecurrenceFrequency[] = [
  "MONTHLY",
  "BIMONTHLY",
  "QUARTERLY",
  "SEMIANNUAL",
  "YEARLY",
];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export interface RecurringRow extends RecurringView {
  monthlyBase: number | null;
  when: string;
  next: string | null;
}

export function RecurringTable({
  rows,
  accounts,
  categories,
  baseCode,
}: {
  rows: RecurringRow[];
  accounts: { id: string; name: string }[];
  categories: CategoryView[];
  baseCode: string;
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  async function toggle(r: RecurringRow) {
    setError(null);
    const result = await api(`/api/v1/recurring-items/${r.id}`, "PATCH", {
      active: !r.active,
    });
    if (!result.ok) setError(result.error);
    router.refresh();
  }

  if (rows.length === 0)
    return (
      <p className="px-5 pb-5 text-[13px] text-neutral-600">
        {t("recurring.table.empty")}
      </p>
    );

  return (
    <div className="overflow-x-auto">
      {error && (
        <p className="mx-5 mb-3 rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger">
          {error}
        </p>
      )}
      <table className="w-full min-w-[860px] text-[13px] leading-[18px]">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-[12px] text-neutral-600">
            <th className="px-5 py-2.5 font-medium">
              {t("common.fields.description")}
            </th>
            <th className="px-3 py-2.5 font-medium">
              {t("common.fields.category")}
            </th>
            <th className="px-3 py-2.5 font-medium">
              {t("recurring.table.frequency")}
            </th>
            <th className="px-3 py-2.5 font-medium">
              {t("recurring.table.when")}
            </th>
            <th className="px-3 py-2.5 font-medium">
              {t("recurring.table.next")}
            </th>
            <th className="px-3 py-2.5 text-right font-medium">
              {t("common.fields.amount")}
            </th>
            <th className="px-3 py-2.5 text-right font-medium">
              {t("recurring.table.perMonth", { currency: baseCode })}
            </th>
            <th className="px-5 py-2.5 font-medium">
              {t("common.fields.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className={cx(
                "border-b border-neutral-100 last:border-0 hover:bg-neutral-50",
                !r.active && "text-neutral-500",
              )}
            >
              <td className="px-5 py-2.5">
                <p className="text-neutral-950">{r.description}</p>
                <p className="text-[12px] text-neutral-500">
                  {r.accountId
                    ? accountName.get(r.accountId)
                    : t("recurring.table.noAccount")}
                </p>
              </td>
              <td className="px-3 py-2.5">
                {r.categoryId
                  ? (categoryName.get(r.categoryId) ?? t("common.states.none"))
                  : t("common.states.none")}
              </td>
              <td className="px-3 py-2.5">
                {t(`enums.frequency.${r.frequency}`)}
              </td>
              <td
                className={cx(
                  "px-3 py-2.5 whitespace-nowrap",
                  (r.variableDay || !r.dayOfMonth) && "text-neutral-500",
                )}
              >
                {r.when}
              </td>
              <td className="tabular px-3 py-2.5 whitespace-nowrap">
                {r.active && r.next
                  ? fmt.civilDate(r.next)
                  : t("common.states.none")}
              </td>
              <td className="tabular px-3 py-2.5 text-right">
                {fmt.money(r.amount, r.assetCode)}
              </td>
              <td className="tabular px-3 py-2.5 text-right font-medium">
                {r.monthlyBase === null
                  ? t("common.noRate")
                  : fmt.money(r.monthlyBase, baseCode)}
              </td>
              <td className="px-5 py-2.5">
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  title={
                    r.active
                      ? t("common.actions.pause")
                      : t("common.actions.unarchive")
                  }
                >
                  <Badge tone={r.active ? "success" : "neutral"}>
                    {r.active
                      ? t("recurring.table.active")
                      : t("recurring.table.paused")}
                  </Badge>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NewRecurring({
  accounts,
  categories,
  currencies,
}: {
  accounts: { id: string; name: string }[];
  categories: CategoryView[];
  currencies: string[];
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CategoryKind>("EXPENSE");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const amount = decimalInput(text("amount"));
    if (!amount) return setError(t("recurring.form.invalidAmount"));
    const day = text("day");
    const result = await api("/api/v1/recurring-items", "POST", {
      description: text("description"),
      kind,
      categoryId: text("categoryId") || null,
      accountId: text("accountId") || null,
      amount,
      assetId: text("currency"),
      frequency: text("frequency") as RecurrenceFrequency,
      dayOfMonth: day && day !== "variable" ? Number(day) : null,
      monthOfYear: text("month") ? Number(text("month")) : null,
      variableDay: day === "variable",
    });
    if (!result.ok) return setError(result.error);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <IconPlus size={16} /> {t("recurring.form.open")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("recurring.form.title")}
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Field label={t("common.fields.description")}>
              <Input
                name="description"
                required
                maxLength={120}
                placeholder={t("recurring.form.descriptionPlaceholder")}
              />
            </Field>
          </div>
          <Field label={t("common.fields.type")}>
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as CategoryKind)}
            >
              <option value="EXPENSE">{t("enums.categoryKind.EXPENSE")}</option>
              <option value="INCOME">{t("enums.categoryKind.INCOME")}</option>
            </Select>
          </Field>
          <Field label={t("common.fields.category")}>
            <Select name="categoryId">
              {categories
                .filter((c) => c.kind === kind)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label={t("common.fields.amount")}>
            <Input name="amount" inputMode="decimal" required />
          </Field>
          <Field label={t("common.fields.currency")}>
            <Select name="currency" defaultValue={fmt.baseCurrency}>
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("recurring.table.frequency")}>
            <Select name="frequency" defaultValue="MONTHLY">
              {FREQUENCIES.map((v) => (
                <option key={v} value={v}>
                  {t(`enums.frequency.${v}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("recurring.form.dayOfMonth")}>
            <Select name="day" defaultValue="">
              <option value="">{t("recurring.when.toBeDefined")}</option>
              <option value="variable">{t("recurring.when.variable")}</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={t("recurring.form.referenceMonth")}
            hint={t("recurring.form.referenceMonthHint")}
          >
            <Select name="month" defaultValue="">
              <option value="">{t("common.states.none")}</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {fmt.monthAbbr(m)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("common.fields.account")}>
            <Select name="accountId" defaultValue="">
              <option value="">{t("common.states.none")}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          {error && (
            <p className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit">{t("common.actions.save")}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
