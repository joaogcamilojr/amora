"use client";

import type { LedgerTransactionType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge, type Tone } from "@/components/ds/badge";
import { ConfirmDialog } from "@/components/ds/dialog";
import { IconTrash } from "@/components/ds/icons";
import { EmptyBlock } from "@/components/ds/widget";
import { cx } from "@/lib/cx";
import { api } from "@/lib/finance/client";
import {
  EDITABLE_TYPES,
  type CategoryView,
  type Movement,
} from "@/lib/finance/types";
import { useI18n } from "@/lib/i18n/client";

const TYPE_TONE: Partial<Record<LedgerTransactionType, Tone>> = {
  INCOME: "success",
  INTEREST_INCOME: "success",
  REFUND: "success",
  EXPENSE: "neutral",
  FEE: "warning",
  TRANSFER: "info",
  CARD_PAYMENT: "info",
  EXCHANGE: "info",
  INVESTMENT: "brand",
  ADJUSTMENT: "warning",
  OPENING_BALANCE: "neutral",
};

const WITH_CATEGORY: LedgerTransactionType[] = [
  "INCOME",
  "EXPENSE",
  "REFUND",
  "FEE",
  "INTEREST_INCOME",
];
const GENERIC = ["sem-categoria", "outras-receitas"];

export interface AccountOption {
  id: string;
  name: string;
}

export function TransactionsTable({
  rows,
  accounts,
  categories,
  baseCode: baseCodeProp,
  readOnly,
}: {
  rows: Movement[];
  accounts: AccountOption[];
  categories: CategoryView[];
  baseCode?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const baseCode = baseCodeProp ?? fmt.baseCurrency;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Movement | null>(null);
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  async function patch(
    transactionId: string,
    changes: Record<string, unknown>,
  ) {
    setError(null);
    const result = await api(
      `/api/v1/transactions/${transactionId}`,
      "PATCH",
      changes,
    );
    if (!result.ok) setError(result.error);
    start(() => router.refresh());
  }

  async function remove(m: Movement) {
    setRemoving(null);
    const result = await api(
      `/api/v1/transactions/${m.transactionId}`,
      "DELETE",
    );
    if (!result.ok) setError(result.error);
    start(() => router.refresh());
  }

  if (rows.length === 0)
    return (
      <EmptyBlock title={t("transactions.table.emptyTitle")}>
        {t("transactions.table.emptyHint")}
      </EmptyBlock>
    );

  return (
    <div className={cx("overflow-x-auto", pending && "opacity-70")}>
      {error && (
        <p className="mx-5 mb-3 rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger">
          {error}
        </p>
      )}
      <table className="w-full min-w-[760px] text-[13px] leading-[18px]">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-[12px] text-neutral-600">
            <th className="px-5 py-2.5 font-medium">
              {t("common.fields.date")}
            </th>
            <th className="px-3 py-2.5 font-medium">
              {t("common.fields.description")}
            </th>
            <th className="px-3 py-2.5 font-medium">
              {t("common.fields.type")}
            </th>
            <th className="px-3 py-2.5 font-medium">
              {t("common.fields.category")}
            </th>
            <th className="px-5 py-2.5 text-right font-medium">
              {t("common.fields.amount")}
            </th>
            {!readOnly && (
              <th
                className="w-10 px-3 py-2.5"
                aria-label={t("transactions.table.actions")}
              />
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const category = m.categoryId
              ? categoryById.get(m.categoryId)
              : undefined;
            const generic = !category || GENERIC.includes(category.slug);
            const kind =
              m.type === "INCOME" || m.type === "INTEREST_INCOME"
                ? "INCOME"
                : "EXPENSE";
            const options = categories.filter(
              (c) => c.kind === kind || c.id === m.categoryId,
            );
            const locked =
              m.type === "OPENING_BALANCE" ||
              m.type === "CARD_PAYMENT" ||
              m.type === "EXCHANGE" ||
              Boolean(m.counterpartAccountId);
            return (
              <tr
                key={m.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="tabular px-5 py-2.5 whitespace-nowrap text-neutral-600">
                  {fmt.civilDate(m.date)}
                </td>
                <td className="max-w-[360px] px-3 py-2.5">
                  <p
                    className="truncate text-neutral-950"
                    title={m.originalDescription ?? m.description}
                  >
                    {m.description}
                    {m.status !== "POSTED" && (
                      <Badge tone="warning" className="ml-2">
                        {t(`enums.transactionStatus.${m.status}`)}
                      </Badge>
                    )}
                  </p>
                  <p className="text-[12px] text-neutral-500">
                    {accountName.get(m.accountId) ?? t("common.fields.account")}
                    {m.counterpartAccountId &&
                      ` ${m.amount < 0 ? "→" : "←"} ${accountName.get(m.counterpartAccountId) ?? t("transactions.table.otherAccount")}`}
                    {m.installment &&
                      ` · ${t("transactions.table.installment", { number: m.installment.number, total: m.installment.count })}`}
                    {m.tags.length > 0 &&
                      ` · ${m.tags.map((t) => `#${t}`).join(" ")}`}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  {readOnly || locked ? (
                    <Badge tone={TYPE_TONE[m.type] ?? "neutral"}>
                      {t(`enums.transactionType.${m.type}`)}
                    </Badge>
                  ) : (
                    <select
                      aria-label={t("common.fields.type")}
                      value={m.type}
                      onChange={(e) =>
                        patch(m.transactionId, { type: e.target.value })
                      }
                      className="h-8 rounded-[var(--radius-control)] border border-transparent bg-transparent px-1 hover:border-neutral-200"
                    >
                      {EDITABLE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t(`enums.transactionType.${type}`)}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {!WITH_CATEGORY.includes(m.type) ? (
                    <span className="text-neutral-500">—</span>
                  ) : readOnly ? (
                    <span className={generic ? "text-warning" : ""}>
                      {category?.name ?? t("common.noCategory")}
                    </span>
                  ) : (
                    <select
                      aria-label={t("common.fields.category")}
                      value={m.categoryId ?? ""}
                      onChange={(e) =>
                        patch(m.transactionId, {
                          categoryId: e.target.value || null,
                        })
                      }
                      className={cx(
                        "h-8 max-w-[200px] rounded-[var(--radius-control)] border px-1",
                        generic
                          ? "border-warning/40 bg-warning-bg text-warning"
                          : "border-transparent bg-transparent hover:border-neutral-200",
                      )}
                    >
                      {!m.categoryId && (
                        <option value="">{t("common.noCategory")}</option>
                      )}
                      {options.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="tabular px-5 py-2.5 text-right whitespace-nowrap">
                  <span
                    className={cx(
                      "font-medium",
                      m.amount > 0 ? "text-success" : "text-neutral-950",
                    )}
                  >
                    {fmt.money(m.amount, m.assetCode)}
                  </span>
                  {m.assetCode !== baseCode && (
                    <span className="block text-[12px] text-neutral-500">
                      {m.baseAmount == null
                        ? t("common.noRate")
                        : `≈ ${fmt.money(m.baseAmount, baseCode)}`}
                    </span>
                  )}
                </td>
                {!readOnly && (
                  <td className="px-3 py-2.5">
                    {m.type !== "OPENING_BALANCE" && (
                      <button
                        type="button"
                        onClick={() => setRemoving(m)}
                        aria-label={t("transactions.table.deleteAria", {
                          description: m.description,
                        })}
                        title={t("common.actions.delete")}
                        className="grid h-8 w-8 place-items-center rounded-[var(--radius-control)] text-neutral-500 hover:bg-danger-bg hover:text-danger"
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove(removing)}
        title={t("transactions.table.confirmTitle")}
        description={
          removing
            ? [
                t("transactions.table.confirmDescription", {
                  description: removing.description,
                  date: fmt.civilDate(removing.date),
                }),
                removing.counterpartAccountId
                  ? t("transactions.table.confirmTransfer")
                  : "",
              ]
                .filter(Boolean)
                .join(" ")
            : ""
        }
      />
    </div>
  );
}
