"use client";

import type { LedgerTransactionType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ds/badge";
import { Button, ButtonLink } from "@/components/ds/button";
import { Field, Select } from "@/components/ds/field";
import { Widget } from "@/components/ds/widget";
import { cx } from "@/lib/cx";
import { api } from "@/lib/finance/client";
import { splitPocket, type Pocket } from "@/lib/finance/pockets";
import { xlsxToCsv } from "@/lib/finance/xlsx";
import { EDITABLE_TYPES, type CategoryView } from "@/lib/finance/types";
import { useI18n } from "@/lib/i18n/client";

interface PreviewRow {
  index: number;
  date: string;
  description: string;
  originalDescription: string;
  amount: string;
  externalId: string | null;
  type: LedgerTransactionType;
  categoryId: string | null;
  tags: string[];
  duplicate: boolean;
}
type Row = PreviewRow & { include: boolean };

const WITH_CATEGORY: LedgerTransactionType[] = [
  "INCOME",
  "EXPENSE",
  "REFUND",
  "FEE",
  "INTEREST_INCOME",
];
const MAX_BYTES = 5_000_000;

/** Texto do arquivo para a API. XLSX é lido aqui, no navegador, e vira o mesmo CSV que o servidor já interpreta. */
async function readContent(
  file: File,
): Promise<
  { content: string } | { error: "xlsxLegacy" | "xlsxUnreadable" | "tooLarge" }
> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xls")) return { error: "xlsxLegacy" };
  if (!name.endsWith(".xlsx")) return { content: await file.text() };
  try {
    const { default: readXlsxFile } = await import("read-excel-file/universal");
    const content = xlsxToCsv(await readXlsxFile(file));
    if (content.length > MAX_BYTES) return { error: "tooLarge" };
    return content ? { content } : { error: "xlsxUnreadable" };
  } catch {
    return { error: "xlsxUnreadable" };
  }
}

export function Importer({
  pockets,
  categories,
}: {
  pockets: Pocket[];
  categories: CategoryView[];
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const [pocketKey, setPocketKey] = useState(pockets[0]?.key ?? "");
  const [fileName, setFileName] = useState("");
  const [format, setFormat] = useState<"ofx" | "csv">("csv");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const pocket = pockets.find((p) => p.key === pocketKey);
  const fallback = (kind: "INCOME" | "EXPENSE") =>
    categories.find(
      (c) =>
        c.slug === (kind === "INCOME" ? "outras-receitas" : "sem-categoria"),
    )?.id ?? null;

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(null);
    const file = new FormData(event.currentTarget).get("file");
    if (!(file instanceof File) || file.size === 0)
      return setError(t("imports.importer.fileStep.chooseFile"));
    if (file.size > MAX_BYTES)
      return setError(t("imports.importer.fileStep.tooLarge"));
    const { accountId, assetId } = splitPocket(pocketKey);
    setBusy(true);
    const read = await readContent(file);
    if ("error" in read) {
      setBusy(false);
      return setError(t(`imports.importer.fileStep.${read.error}`));
    }
    const result = await api<{
      format: "ofx" | "csv";
      rows: PreviewRow[];
      warnings: string[];
    }>("/api/v1/imports/preview", "POST", {
      accountId,
      assetId,
      fileName: file.name,
      content: read.content,
    });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setFileName(file.name);
    setFormat(result.data.format);
    setWarnings(result.data.warnings);
    setRows(result.data.rows.map((r) => ({ ...r, include: !r.duplicate })));
  }

  function change(index: number, changes: Partial<Row>) {
    setRows(
      (current) =>
        current &&
        current.map((r, i) => (i === index ? { ...r, ...changes } : r)),
    );
  }

  async function confirm() {
    if (!rows) return;
    const { accountId, assetId } = splitPocket(pocketKey);
    setBusy(true);
    const result = await api<{ imported: number }>(
      "/api/v1/imports/confirm",
      "POST",
      {
        accountId,
        assetId,
        fileName,
        format,
        rows: rows
          .filter((r) => r.include)
          .map(
            ({
              date,
              description,
              originalDescription,
              amount,
              externalId,
              type,
              categoryId,
              tags,
            }) => ({
              date,
              description,
              originalDescription,
              amount,
              externalId,
              type,
              categoryId,
              tags,
            }),
          ),
      },
    );
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSaved(result.data.imported);
    setRows(null);
    router.refresh();
  }

  const selected = rows?.filter((r) => r.include) ?? [];
  const duplicates = rows?.filter((r) => r.duplicate).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <Widget
        title={t("imports.importer.fileStep.title")}
        context={t("imports.importer.fileStep.context")}
      >
        <form
          onSubmit={analyze}
          className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_1fr_auto]"
        >
          <Field label={t("imports.importer.fileStep.account")}>
            <Select
              value={pocketKey}
              onChange={(e) => setPocketKey(e.target.value)}
            >
              {pockets.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("imports.importer.fileStep.file")}>
            <input
              type="file"
              name="file"
              accept=".csv,.ofx,.qfx,.txt,.xlsx,.xls"
              className="h-10 w-full rounded-[var(--radius-control)] border border-neutral-200 bg-surface text-sm file:mr-3 file:h-full file:border-0 file:bg-neutral-100 file:px-3 file:text-neutral-800"
            />
          </Field>
          <Button type="submit" disabled={busy || !pocketKey}>
            {busy
              ? t("imports.importer.fileStep.reading")
              : t("imports.importer.fileStep.analyze")}
          </Button>
        </form>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger"
          >
            {error}
          </p>
        )}
        {saved !== null && pocket && (
          <p className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-control)] bg-success-bg p-3 text-[13px] text-success">
            {t("imports.importer.fileStep.saved", {
              count: saved,
              account: pocket.label,
            })}
            <ButtonLink
              href={`/transactions?accountId=${pocket.accountId}`}
              variant="secondary"
              size="compact"
            >
              {t("imports.importer.fileStep.viewTransactions")}
            </ButtonLink>
          </p>
        )}
      </Widget>

      {rows && (
        <Widget
          title={t("imports.importer.reviewStep.title")}
          context={[
            t("imports.importer.reviewStep.rowsRead", { count: rows.length }),
            t("imports.importer.reviewStep.duplicates", { count: duplicates }),
            t("imports.importer.reviewStep.valuesIn", {
              currency: pocket?.assetCode,
            }),
          ].join(" · ")}
          flush
          action={
            <Button onClick={confirm} disabled={busy || selected.length === 0}>
              {t("imports.importer.reviewStep.import", {
                count: selected.length,
              })}
            </Button>
          }
        >
          {warnings.map((w) => (
            <p
              key={w}
              className="mx-5 mb-3 rounded-[var(--radius-control)] bg-warning-bg p-3 text-[13px] text-warning"
            >
              {w}
            </p>
          ))}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px] leading-[18px]">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-[12px] text-neutral-600">
                  <th className="px-5 py-2.5 font-medium">
                    <span className="sr-only">
                      {t("imports.importer.reviewStep.include")}
                    </span>
                  </th>
                  <th className="px-3 py-2.5 font-medium">
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
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const kind =
                    r.type === "INCOME" || r.type === "INTEREST_INCOME"
                      ? "INCOME"
                      : "EXPENSE";
                  const generic =
                    !r.categoryId || r.categoryId === fallback(kind);
                  return (
                    <tr
                      key={r.index}
                      className={cx(
                        "border-b border-neutral-100 last:border-0",
                        !r.include && "text-neutral-500",
                      )}
                    >
                      <td className="px-5 py-2">
                        <input
                          type="checkbox"
                          aria-label={t(
                            "imports.importer.reviewStep.includeRow",
                            { description: r.description },
                          )}
                          checked={r.include}
                          onChange={(e) =>
                            change(i, { include: e.target.checked })
                          }
                          className="h-4 w-4 accent-[var(--color-brand-600)]"
                        />
                      </td>
                      <td className="tabular px-3 py-2 whitespace-nowrap">
                        {fmt.civilDate(r.date)}
                      </td>
                      <td className="max-w-[320px] px-3 py-2">
                        <p className="truncate" title={r.originalDescription}>
                          {r.description}
                        </p>
                        {r.duplicate && (
                          <Badge tone="warning">
                            {t("imports.importer.reviewStep.alreadyImported")}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={t("common.fields.type")}
                          value={r.type}
                          onChange={(e) => {
                            const type = e.target
                              .value as LedgerTransactionType;
                            const k =
                              type === "INCOME" || type === "INTEREST_INCOME"
                                ? "INCOME"
                                : "EXPENSE";
                            change(i, {
                              type,
                              categoryId: WITH_CATEGORY.includes(type)
                                ? (r.categoryId ?? fallback(k))
                                : null,
                            });
                          }}
                          className="h-8 rounded-[var(--radius-control)] border border-neutral-200 bg-surface px-1"
                        >
                          {EDITABLE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {t(`enums.transactionType.${type}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        {WITH_CATEGORY.includes(r.type) ? (
                          <select
                            aria-label={t("common.fields.category")}
                            value={r.categoryId ?? ""}
                            onChange={(e) =>
                              change(i, { categoryId: e.target.value || null })
                            }
                            className={cx(
                              "h-8 max-w-[200px] rounded-[var(--radius-control)] border px-1",
                              generic
                                ? "border-warning/40 bg-warning-bg text-warning"
                                : "border-neutral-200 bg-surface",
                            )}
                          >
                            {!r.categoryId && (
                              <option value="">{t("common.noCategory")}</option>
                            )}
                            {categories
                              .filter(
                                (c) => c.kind === kind || c.id === r.categoryId,
                              )
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <span className="text-neutral-500">
                            {t("common.states.none")}
                          </span>
                        )}
                      </td>
                      <td
                        className={cx(
                          "tabular px-5 py-2 text-right font-medium whitespace-nowrap",
                          Number(r.amount) > 0 && "text-success",
                        )}
                      >
                        {fmt.money(
                          Number(r.amount),
                          pocket?.assetCode ?? fmt.baseCurrency,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Widget>
      )}
    </div>
  );
}
