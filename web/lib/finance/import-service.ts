import {
  Prisma,
  type ImportFormat,
  type LedgerTransactionType,
} from "@prisma/client";

import { i18nForUser } from "@/lib/i18n/server";
import { parseDecimal } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { ValidationError, parseCivilDate } from "@/lib/validation";

import { cleanDescription, dedupeKey, needsCategory } from "./classification";
import { parseStatement } from "./importers";
import { assertAssetsAllowed, assertCanWrite } from "./billing";
import { classifier, postableAccount, rebuildBalances } from "./ledger";
import { baseAssetCode, loadFxTable } from "./load";
import { EDITABLE_TYPES } from "./types";

export interface PreviewRow {
  index: number;
  date: string;
  description: string;
  originalDescription: string;
  /** Valor com sinal na moeda da conta (string decimal). */
  amount: string;
  externalId: string | null;
  type: LedgerTransactionType;
  categoryId: string | null;
  tags: string[];
  duplicate: boolean;
}

export interface ImportPreview {
  format: "ofx" | "csv";
  accountId: string;
  assetId: string;
  fileName: string;
  rows: PreviewRow[];
  warnings: string[];
}

async function existingKeys(accountId: string, from: Date, to: Date) {
  const entries = await prisma.ledger_entries.findMany({
    where: {
      account_id: accountId,
      transaction: { deleted_at: null, occurred_at: { gte: from, lte: to } },
    },
    include: {
      transaction: {
        select: {
          occurred_at: true,
          description: true,
          original_description: true,
          external_id: true,
        },
      },
    },
  });
  const keys = new Set<string>();
  for (const e of entries) {
    if (e.transaction.external_id) keys.add(`x|${e.transaction.external_id}`);
    const date = e.transaction.occurred_at.toISOString().slice(0, 10);
    const signed = (
      e.direction === "CREDIT" ? e.amount : e.amount.negated()
    ).toFixed(2);
    for (const d of [
      e.transaction.description,
      e.transaction.original_description,
    ])
      if (d) keys.add(dedupeKey(accountId, date, signed, d));
  }
  return keys;
}

/** Lê o arquivo, classifica cada linha pelas regras e marca duplicidades. Não grava nada. */
export async function previewImport(
  userId: string,
  input: {
    accountId: string;
    assetId: string;
    fileName: string;
    content: string;
  },
): Promise<ImportPreview> {
  await prisma.$transaction((tx) =>
    postableAccount(tx, userId, input.accountId),
  );
  if (input.content.length > 5_000_000)
    throw new ValidationError(
      "VALIDATION_ERROR",
      "errors.import.fileTooLarge",
      {
        size: 5,
      },
    );
  const parsed = parseStatement(input.fileName, input.content);
  if (!parsed.rows.length)
    throw new ValidationError(
      "VALIDATION_ERROR",
      parsed.warnings[0]?.key ?? "errors.import.noRowsRecognized",
      parsed.warnings[0]?.vars,
    );
  const { t } = await i18nForUser(userId);
  const noDescription = t("errors.generated.noDescription");
  const dates = parsed.rows.map((r) => r.date).sort();
  const keys = await existingKeys(
    input.accountId,
    parseCivilDate(dates[0], "date"),
    parseCivilDate(dates[dates.length - 1], "date"),
  );
  const classify = await prisma.$transaction((tx) => classifier(tx, userId));
  const seen = new Set<string>();
  const rows = parsed.rows.map((raw, index): PreviewRow => {
    const row = { ...raw, description: raw.description || noDescription };
    const amount = row.amount.toFixed(2);
    const description = cleanDescription(row.description);
    const key = row.externalId
      ? `x|${row.externalId}`
      : dedupeKey(input.accountId, row.date, amount, row.description);
    const altKey = dedupeKey(input.accountId, row.date, amount, description);
    const duplicate = keys.has(key) || keys.has(altKey) || seen.has(key);
    seen.add(key);
    const c = classify(description, row.amount >= 0 ? "CREDIT" : "DEBIT");
    return {
      index,
      date: row.date,
      description,
      originalDescription: row.description,
      amount,
      externalId: row.externalId ?? null,
      type: c.type,
      categoryId: c.categoryId,
      tags: c.tags,
      duplicate,
    };
  });
  return {
    format: parsed.format,
    accountId: input.accountId,
    assetId: input.assetId,
    fileName: input.fileName,
    rows,
    warnings: parsed.warnings.map((w) => t(w.key, w.vars)),
  };
}

export interface ConfirmRow {
  date: string;
  description: string;
  originalDescription?: string;
  amount: string;
  externalId?: string | null;
  type: LedgerTransactionType;
  categoryId?: string | null;
  tags?: string[];
}

/** Grava as linhas aprovadas como lançamentos de uma perna, num ImportBatch. Transferências entram como TRANSFER sem contraparte (vincular depois). */
export async function confirmImport(
  userId: string,
  input: {
    accountId: string;
    assetId: string;
    fileName: string;
    format: "ofx" | "csv";
    rows: ConfirmRow[];
  },
) {
  await assertCanWrite(userId);
  await assertAssetsAllowed(userId, [input.assetId]);
  if (!Array.isArray(input.rows) || !input.rows.length)
    throw new ValidationError(
      "VALIDATION_ERROR",
      "errors.import.noRowsToImport",
    );
  if (input.rows.length > 2000)
    throw new ValidationError("VALIDATION_ERROR", "errors.import.tooManyRows", {
      max: 2000,
    });
  const baseCode = await baseAssetCode(userId);
  const fx = await loadFxTable(baseCode, userId);
  const format: ImportFormat = input.format === "ofx" ? "OFX" : "CSV";
  const { t } = await i18nForUser(userId);

  return prisma.$transaction(
    async (tx) => {
      await postableAccount(tx, userId, input.accountId);
      const asset = await tx.assets.findUnique({
        where: { id: input.assetId },
      });
      if (!asset)
        throw new ValidationError("VALIDATION_ERROR", "errors.invalidCurrency");
      const baseAsset = await tx.assets.findUnique({
        where: { code: baseCode },
      });
      const categories = new Set(
        (
          await tx.categories.findMany({
            where: { owner_id: userId },
            select: { id: true },
          })
        ).map((c) => c.id),
      );
      const balance =
        (await tx.account_balances.findUnique({
          where: {
            account_id_asset_id: {
              account_id: input.accountId,
              asset_id: asset.id,
            },
          },
        })) ??
        (await tx.account_balances.create({
          data: {
            account_id: input.accountId,
            asset_id: asset.id,
            current_balance: 0,
            available_balance: 0,
          },
        }));
      const batch = await tx.import_batches.create({
        data: {
          owner_id: userId,
          account_id: input.accountId,
          file_name: input.fileName.slice(0, 200),
          format,
          row_count: input.rows.length,
          imported_count: 0,
        },
      });
      const rate = fx.get(asset.code);
      let imported = 0;
      for (const row of input.rows) {
        const signed = new Prisma.Decimal(String(row.amount));
        if (signed.isZero()) continue;
        const amount = parseDecimal(signed.abs().toString(), "amount");
        if (!EDITABLE_TYPES.includes(row.type))
          throw new ValidationError(
            "VALIDATION_ERROR",
            "errors.invalidTypeValue",
            { type: String(row.type) },
          );
        const categoryId =
          needsCategory(row.type) &&
          row.categoryId &&
          categories.has(row.categoryId)
            ? row.categoryId
            : null;
        await tx.ledger_transactions.create({
          data: {
            created_by_user_id: userId,
            account_id: input.accountId,
            type: row.type,
            description:
              String(row.description).trim().slice(0, 200) ||
              t("errors.generated.noDescription"),
            original_description:
              row.originalDescription?.slice(0, 300) ?? null,
            occurred_at: parseCivilDate(row.date, "date"),
            category_id: categoryId,
            tags: (row.tags ?? []).map(String).slice(0, 20),
            external_id: row.externalId ?? null,
            import_batch_id: batch.id,
            base_asset_id: baseAsset?.id ?? null,
            base_amount:
              rate === undefined ? null : amount.times(rate).toDecimalPlaces(2),
            base_rate: rate === undefined ? null : new Prisma.Decimal(rate),
            entries: {
              create: {
                account_id: input.accountId,
                account_balance_id: balance.id,
                asset_id: asset.id,
                direction: signed.isNegative() ? "DEBIT" : "CREDIT",
                amount,
                balance_after: 0,
              },
            },
          },
        });
        imported++;
      }
      await tx.import_batches.update({
        where: { id: batch.id },
        data: { imported_count: imported },
      });
      await rebuildBalances(tx, [balance.id]);
      return { batchId: batch.id, imported };
    },
    { timeout: 120000, maxWait: 10000 },
  );
}
