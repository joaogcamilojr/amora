import {
  AccountMemberRole,
  AccountStatus,
  Prisma,
  type LedgerEntryDirection,
  type LedgerTransactionType,
  type TransactionStatus,
} from "@prisma/client";

import {
  accountAccessWhere,
  accountRoleInclude,
  resolveAccountRole,
} from "@/lib/auth/access";
import { i18nForUser } from "@/lib/i18n/server";
import { parseDecimal, positive, validateScale } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { ValidationError, parseCivilDate } from "@/lib/validation";

import { classify, needsCategory, type Rule } from "./classification";
import { assertAssetsAllowed, assertCanWrite } from "./billing";
import { baseAssetCode, loadFxTable } from "./load";

type Tx = Prisma.TransactionClient;

export const FALLBACK_INCOME_SLUG = "outras-receitas";
export const FALLBACK_EXPENSE_SLUG = "sem-categoria";

/** Conta ativa onde o usuário pode lançar (OWNER ou TRANSACTION_MANAGER). */
export async function postableAccount(
  tx: Tx,
  userId: string,
  accountId: string,
) {
  const account = await tx.accounts.findFirst({
    where: {
      id: accountId,
      status: AccountStatus.ACTIVE,
      ...accountAccessWhere(userId),
    },
    include: { ...accountRoleInclude(userId), card_profile: true },
  });
  if (!account)
    throw new ValidationError(
      "RESOURCE_NOT_FOUND",
      "errors.ledger.accountNotFoundOrArchived",
    );
  const role = resolveAccountRole(userId, account);
  if (
    role !== AccountMemberRole.OWNER &&
    role !== AccountMemberRole.TRANSACTION_MANAGER
  )
    throw new ValidationError("FORBIDDEN", "errors.ledger.noPostingPermission");
  return account;
}

async function balanceFor(tx: Tx, accountId: string, assetId: string) {
  const existing = await tx.account_balances.findUnique({
    where: {
      account_id_asset_id: { account_id: accountId, asset_id: assetId },
    },
  });
  if (existing) return existing;
  return tx.account_balances.create({
    data: {
      account_id: accountId,
      asset_id: assetId,
      current_balance: 0,
      available_balance: 0,
    },
  });
}

/**
 * Recalcula `balanceAfter` das entries (ordem: data do fato, depois criação) e o saldo projetado.
 * Lançamentos com `deletedAt` não entram. O ledger continua sendo a fonte; o saldo é projeção.
 */
export async function rebuildBalances(tx: Tx, balanceIds: string[]) {
  for (const id of new Set(balanceIds)) {
    const entries = await tx.ledger_entries.findMany({
      where: { account_balance_id: id, transaction: { deleted_at: null } },
      include: {
        transaction: { select: { occurred_at: true, created_at: true } },
      },
    });
    entries.sort(
      (a, b) =>
        a.transaction.occurred_at.getTime() -
          b.transaction.occurred_at.getTime() ||
        a.transaction.created_at.getTime() -
          b.transaction.created_at.getTime() ||
        a.created_at.getTime() - b.created_at.getTime(),
    );
    let running = new Prisma.Decimal(0);
    for (const entry of entries) {
      running =
        entry.direction === "CREDIT"
          ? running.plus(entry.amount)
          : running.minus(entry.amount);
      if (!entry.balance_after.equals(running))
        await tx.ledger_entries.update({
          where: { id: entry.id },
          data: { balance_after: running },
        });
    }
    await tx.account_balances.update({
      where: { id },
      data: {
        current_balance: running,
        available_balance: running,
        last_calculated_at: new Date(),
      },
    });
  }
}

async function userRules(tx: Tx, userId: string): Promise<Rule[]> {
  const rules = await tx.classification_rules.findMany({
    where: { owner_id: userId, active: true },
  });
  return rules.map((r) => ({
    priority: r.priority,
    pattern: r.pattern,
    transactionType: r.transaction_type,
    direction: r.direction,
    categoryId: r.category_id,
    counterparty: r.counterparty,
    tags: r.tags,
  }));
}

async function fallbackCategories(tx: Tx, userId: string) {
  const rows = await tx.categories.findMany({
    where: {
      owner_id: userId,
      slug: { in: [FALLBACK_INCOME_SLUG, FALLBACK_EXPENSE_SLUG] },
    },
  });
  return {
    income: rows.find((r) => r.slug === FALLBACK_INCOME_SLUG)?.id ?? null,
    expense: rows.find((r) => r.slug === FALLBACK_EXPENSE_SLUG)?.id ?? null,
  };
}

export async function classifier(tx: Tx, userId: string) {
  const [rules, fallback] = await Promise.all([
    userRules(tx, userId),
    fallbackCategories(tx, userId),
  ]);
  return (description: string, direction: LedgerEntryDirection) =>
    classify(description, direction, rules, fallback);
}

async function ownCategory(
  tx: Tx,
  userId: string,
  categoryId: string | null | undefined,
) {
  if (!categoryId) return null;
  const category = await tx.categories.findFirst({
    where: { id: categoryId, owner_id: userId },
  });
  if (!category)
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidCategory");
  return category.id;
}

function cleanTags(tags: unknown): string[] {
  if (tags == null) return [];
  if (!Array.isArray(tags))
    throw new ValidationError("VALIDATION_ERROR", "errors.tagsMustBeList");
  return [
    ...new Set(
      tags
        .map((t) => String(t).trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 20);
}

export interface NewTransactionInput {
  accountId: string;
  assetId: string;
  date: string;
  description: string;
  /** Decimal positivo em string. */
  amount: string;
  direction: LedgerEntryDirection;
  type?: LedgerTransactionType;
  categoryId?: string | null;
  tags?: string[];
  status?: TransactionStatus;
  /** IOF/tarifa na moeda-base (decimal string). */
  fxFeeBase?: string;
  notes?: string;
}

/** Receita, despesa, estorno, ajuste etc. em uma conta (uma perna). Classifica automaticamente se `type` vier vazio. */
export async function createTransaction(
  userId: string,
  input: NewTransactionInput,
) {
  await assertCanWrite(userId);
  await assertAssetsAllowed(userId, [input.assetId]);
  const occurredAt = parseCivilDate(input.date, "date");
  const description = String(input.description ?? "").trim();
  if (!description || description.length > 200)
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidDescription");
  if (input.direction !== "CREDIT" && input.direction !== "DEBIT")
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidDirection");
  const amount = parseDecimal(input.amount, "amount");
  positive(amount);
  const fee = input.fxFeeBase
    ? parseDecimal(input.fxFeeBase, "fxFeeBase")
    : null;
  const baseCode = await baseAssetCode(userId);
  const fx = await loadFxTable(baseCode, userId);

  return prisma.$transaction(
    async (tx) => {
      await postableAccount(tx, userId, input.accountId);
      const asset = await tx.assets.findUnique({
        where: { id: input.assetId },
      });
      if (!asset || !asset.active)
        throw new ValidationError("VALIDATION_ERROR", "errors.invalidCurrency");
      validateScale(amount, asset);
      const auto = (await classifier(tx, userId))(description, input.direction);
      const type = input.type ?? auto.type;
      const categoryId = needsCategory(type)
        ? ((await ownCategory(tx, userId, input.categoryId)) ?? auto.categoryId)
        : null;
      const rate = fx.get(asset.code);
      let base = rate === undefined ? null : amount.times(rate);
      if (base && fee && input.direction === "DEBIT") base = base.plus(fee);
      const baseAsset = await tx.assets.findUnique({
        where: { code: baseCode },
      });
      const balance = await balanceFor(tx, input.accountId, asset.id);
      const created = await tx.ledger_transactions.create({
        data: {
          created_by_user_id: userId,
          account_id: input.accountId,
          type,
          status: input.status ?? "POSTED",
          description,
          notes: input.notes ?? null,
          occurred_at: occurredAt,
          category_id: categoryId,
          tags: cleanTags([...(input.tags ?? []), ...auto.tags]),
          counterparty: auto.counterparty,
          base_asset_id: baseAsset?.id ?? null,
          base_amount: base?.toDecimalPlaces(2) ?? null,
          base_rate: rate === undefined ? null : new Prisma.Decimal(rate),
          fx_fee_base_amount: fee,
          entries: {
            create: {
              account_id: input.accountId,
              account_balance_id: balance.id,
              asset_id: asset.id,
              direction: input.direction,
              amount,
              balance_after: 0,
            },
          },
        },
      });
      await rebuildBalances(tx, [balance.id]);
      return created;
    },
    { timeout: 20000 },
  );
}

export interface TransferInput {
  date: string;
  description?: string;
  fromAccountId: string;
  fromAssetId: string;
  fromAmount: string;
  toAccountId: string;
  toAssetId: string;
  toAmount?: string;
  fxFeeBase?: string;
}

/**
 * Movimento entre contas do usuário/household em um único lançamento com duas pernas.
 * Destino cartão de crédito = CARD_PAYMENT; moedas diferentes = EXCHANGE; senão TRANSFER.
 * Não é receita nem despesa.
 */
export async function createTransfer(userId: string, input: TransferInput) {
  await assertCanWrite(userId);
  await assertAssetsAllowed(userId, [input.fromAssetId, input.toAssetId]);
  const occurredAt = parseCivilDate(input.date, "date");
  const fromAmount = parseDecimal(input.fromAmount, "fromAmount");
  positive(fromAmount, "fromAmount");
  const toAmount = input.toAmount
    ? parseDecimal(input.toAmount, "toAmount")
    : fromAmount;
  positive(toAmount, "toAmount");
  const fee = input.fxFeeBase
    ? parseDecimal(input.fxFeeBase, "fxFeeBase")
    : null;
  if (
    input.fromAccountId === input.toAccountId &&
    input.fromAssetId === input.toAssetId
  )
    throw new ValidationError(
      "VALIDATION_ERROR",
      "errors.ledger.sameSourceAndTarget",
    );
  const baseCode = await baseAssetCode(userId);
  const fx = await loadFxTable(baseCode, userId);
  const { t } = await i18nForUser(userId);

  return prisma.$transaction(
    async (tx) => {
      await postableAccount(tx, userId, input.fromAccountId);
      const target = await postableAccount(tx, userId, input.toAccountId);
      const [fromAsset, toAsset] = await Promise.all([
        tx.assets.findUnique({ where: { id: input.fromAssetId } }),
        tx.assets.findUnique({ where: { id: input.toAssetId } }),
      ]);
      if (!fromAsset || !toAsset)
        throw new ValidationError("VALIDATION_ERROR", "errors.invalidCurrency");
      validateScale(fromAmount, fromAsset, "fromAmount");
      validateScale(toAmount, toAsset, "toAmount");
      const type: LedgerTransactionType =
        target.type === "CREDIT_CARD"
          ? "CARD_PAYMENT"
          : fromAsset.id !== toAsset.id
            ? "EXCHANGE"
            : "TRANSFER";
      const rate = fx.get(fromAsset.code);
      const baseAsset = await tx.assets.findUnique({
        where: { code: baseCode },
      });
      const [fromBalance, toBalance] = await Promise.all([
        balanceFor(tx, input.fromAccountId, fromAsset.id),
        balanceFor(tx, input.toAccountId, toAsset.id),
      ]);
      const created = await tx.ledger_transactions.create({
        data: {
          created_by_user_id: userId,
          account_id: input.fromAccountId,
          type,
          description:
            input.description?.trim() ||
            t(
              type === "CARD_PAYMENT"
                ? "errors.generated.cardPayment"
                : "errors.generated.transfer",
            ),
          occurred_at: occurredAt,
          base_asset_id: baseAsset?.id ?? null,
          base_amount:
            rate === undefined
              ? null
              : fromAmount.times(rate).toDecimalPlaces(2),
          base_rate: rate === undefined ? null : new Prisma.Decimal(rate),
          fx_fee_base_amount: fee,
          entries: {
            create: [
              {
                account_id: input.fromAccountId,
                account_balance_id: fromBalance.id,
                asset_id: fromAsset.id,
                direction: "DEBIT",
                amount: fromAmount,
                balance_after: 0,
              },
              {
                account_id: input.toAccountId,
                account_balance_id: toBalance.id,
                asset_id: toAsset.id,
                direction: "CREDIT",
                amount: toAmount,
                balance_after: 0,
              },
            ],
          },
          ...(type === "EXCHANGE"
            ? {
                fxConversion: {
                  create: {
                    fromAssetId: fromAsset.id,
                    toAssetId: toAsset.id,
                    fromAmount,
                    toAmount,
                    grossRate: toAmount.dividedBy(fromAmount),
                    effectiveRate: toAmount.dividedBy(fromAmount),
                    source: "MANUAL",
                    quotedAt: occurredAt,
                    settledAt: occurredAt,
                  },
                },
              }
            : {}),
        },
      });
      await rebuildBalances(tx, [fromBalance.id, toBalance.id]);
      return created;
    },
    { timeout: 20000 },
  );
}

export interface TransactionPatch {
  description?: string;
  type?: LedgerTransactionType;
  categoryId?: string | null;
  tags?: string[];
  date?: string;
  status?: TransactionStatus;
}

async function editableTransaction(tx: Tx, userId: string, id: string) {
  const transaction = await tx.ledger_transactions.findFirst({
    where: { id, deleted_at: null },
    include: { entries: true },
  });
  if (!transaction)
    throw new ValidationError(
      "RESOURCE_NOT_FOUND",
      "errors.ledger.transactionNotFound",
    );
  for (const entry of transaction.entries)
    await postableAccount(tx, userId, entry.account_id);
  return transaction;
}

export async function updateTransaction(
  userId: string,
  id: string,
  patch: TransactionPatch,
) {
  await assertCanWrite(userId);
  return prisma.$transaction(async (tx) => {
    const current = await editableTransaction(tx, userId, id);
    const type = patch.type ?? current.type;
    if (type === "OPENING_BALANCE")
      throw new ValidationError("VALIDATION_ERROR", "errors.invalidType");
    if (
      current.entries.length > 1 &&
      type !== current.type &&
      needsCategory(type)
    )
      throw new ValidationError(
        "VALIDATION_ERROR",
        "errors.ledger.transferCannotBecomeIncomeExpense",
      );
    const data: Prisma.ledger_transactionsUncheckedUpdateInput = { type };
    if (patch.description !== undefined) {
      const d = String(patch.description).trim();
      if (!d || d.length > 200)
        throw new ValidationError(
          "VALIDATION_ERROR",
          "errors.invalidDescription",
        );
      data.description = d;
    }
    if (patch.tags !== undefined) data.tags = cleanTags(patch.tags);
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.date !== undefined)
      data.occurred_at = parseCivilDate(patch.date, "date");
    if (!needsCategory(type)) data.category_id = null;
    else if (patch.categoryId !== undefined)
      data.category_id = await ownCategory(tx, userId, patch.categoryId);
    else if (!current.category_id || !needsCategory(current.type)) {
      const fallback = await fallbackCategories(tx, userId);
      data.category_id =
        type === "INCOME" || type === "INTEREST_INCOME"
          ? fallback.income
          : fallback.expense;
    }
    const updated = await tx.ledger_transactions.update({
      where: { id },
      data,
    });
    if (patch.date !== undefined)
      await rebuildBalances(
        tx,
        current.entries.map((e) => e.account_balance_id),
      );
    return updated;
  });
}

/** Exclusão lógica: o histórico fica no banco (deletedAt) e sai das projeções. */
export async function deleteTransaction(userId: string, id: string) {
  await assertCanWrite(userId);
  return prisma.$transaction(async (tx) => {
    const current = await editableTransaction(tx, userId, id);
    if (current.type === "OPENING_BALANCE")
      throw new ValidationError(
        "VALIDATION_ERROR",
        "errors.ledger.openingBalanceViaAccount",
      );
    await tx.ledger_transactions.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    await rebuildBalances(
      tx,
      current.entries.map((e) => e.account_balance_id),
    );
  });
}

/**
 * Une duas pontas importadas separadamente (ex.: saída no Inter e entrada na Wise) num único lançamento.
 * A perna da segunda passa para a primeira; a segunda fica com deletedAt (histórico preservado).
 * Tipo final: CARD_PAYMENT se uma ponta é cartão, EXCHANGE se moedas diferem, senão TRANSFER.
 */
export async function linkTransfer(
  userId: string,
  firstId: string,
  secondId: string,
) {
  await assertCanWrite(userId);
  if (firstId === secondId)
    throw new ValidationError(
      "VALIDATION_ERROR",
      "errors.ledger.linkSameTransaction",
    );
  const { t } = await i18nForUser(userId);
  return prisma.$transaction(async (tx) => {
    const a = await editableTransaction(tx, userId, firstId);
    const b = await editableTransaction(tx, userId, secondId);
    if (a.entries.length !== 1 || b.entries.length !== 1)
      throw new ValidationError(
        "VALIDATION_ERROR",
        "errors.ledger.linkSingleLegOnly",
      );
    const [ea, eb] = [a.entries[0], b.entries[0]];
    if (ea.direction === eb.direction)
      throw new ValidationError(
        "VALIDATION_ERROR",
        "errors.ledger.linkOppositeDirections",
      );
    if (ea.account_id === eb.account_id && ea.asset_id === eb.asset_id)
      throw new ValidationError(
        "VALIDATION_ERROR",
        "errors.ledger.linkSameAccountAndCurrency",
      );
    const debit = ea.direction === "DEBIT" ? ea : eb;
    const credit = ea.direction === "CREDIT" ? ea : eb;
    const creditAccount = await tx.accounts.findUnique({
      where: { id: credit.account_id },
      select: { type: true },
    });
    const type: LedgerTransactionType =
      creditAccount?.type === "CREDIT_CARD"
        ? "CARD_PAYMENT"
        : debit.asset_id !== credit.asset_id
          ? "EXCHANGE"
          : "TRANSFER";
    const keeper = debit.transaction_id === a.id ? a : b;
    const other = keeper.id === a.id ? b : a;
    await tx.ledger_entries.update({
      where: { id: other.entries[0].id },
      data: { transaction_id: keeper.id },
    });
    await tx.ledger_transactions.update({
      where: { id: other.id },
      data: {
        deleted_at: new Date(),
        notes: t("errors.generated.mergedInto", { id: keeper.id }),
      },
    });
    const updated = await tx.ledger_transactions.update({
      where: { id: keeper.id },
      data: { type, category_id: null, account_id: debit.account_id },
    });
    if (
      type === "EXCHANGE" &&
      !(await tx.fx_conversions.findUnique({
        where: { transaction_id: keeper.id },
      }))
    ) {
      await tx.fx_conversions.create({
        data: {
          transaction_id: keeper.id,
          from_asset_id: debit.asset_id,
          to_asset_id: credit.asset_id,
          from_amount: debit.amount,
          to_amount: credit.amount,
          gross_rate: credit.amount.dividedBy(debit.amount),
          effective_rate: credit.amount.dividedBy(debit.amount),
          source: "MANUAL",
          quoted_at: keeper.occurred_at,
          settled_at: keeper.occurred_at,
        },
      });
    }
    await rebuildBalances(tx, [
      debit.account_balance_id,
      credit.account_balance_id,
    ]);
    return updated;
  });
}
