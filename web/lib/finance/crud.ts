import {
  CategoryKind,
  HoldingClass,
  LedgerEntryDirection,
  LedgerTransactionType,
  Prisma,
  RecurrenceFrequency,
} from "@prisma/client";

import { parseDecimal, positive } from "@/lib/money";
import { todayIn } from "@/lib/i18n";
import { i18nContextForUser } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import {
  ValidationError,
  cuidValue,
  enumValue,
  parseCivilDate,
  stringValue,
} from "@/lib/validation";

import { assertAssetsAllowed, assertCanWrite } from "./billing";
import { holdingHolderId } from "./households";
import { accessibleAccounts, baseAssetCode } from "./load";

const optionalString = (v: unknown, field: string, max: number) =>
  v == null || v === "" ? null : stringValue(v, field, max, false);

const optionalInt = (v: unknown, field: string, min: number, max: number) => {
  if (v == null || v === "") return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max)
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", { field });
  return v;
};

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

async function assetByIdOrCode(value: unknown) {
  const key = stringValue(value, "assetId", 40);
  const asset = await prisma.assets.findFirst({
    where: { OR: [{ id: key }, { code: key.toUpperCase() }] },
  });
  if (!asset) throw new ValidationError("VALIDATION_ERROR", "errors.invalidCurrency");
  return asset;
}

async function ownCategoryId(userId: string, value: unknown) {
  if (value == null || value === "") return null;
  const id = cuidValue(String(value), "categoryId");
  const found = await prisma.categories.findFirst({
    where: { id, owner_id: userId },
  });
  if (!found)
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidCategory");
  return id;
}

async function ownAccountId(userId: string, value: unknown) {
  if (value == null || value === "") return null;
  const id = cuidValue(String(value), "accountId");
  const found = await prisma.accounts.findFirst({
    where: { id, ...accessibleAccounts(userId) },
  });
  if (!found) throw new ValidationError("VALIDATION_ERROR", "errors.invalidAccount");
  return id;
}

async function owned<T>(row: T | null): Promise<T> {
  if (!row)
    throw new ValidationError("RESOURCE_NOT_FOUND", "common.errors.notFound");
  return row;
}

// ---------- Categorias ----------

export async function createCategory(
  userId: string,
  b: Record<string, unknown>,
) {
  const name = stringValue(b.name, "name", 60);
  return prisma.categories.create({
    data: {
      owner_id: userId,
      name,
      slug: slugify(typeof b.slug === "string" && b.slug ? b.slug : name),
      kind: enumValue(b.kind, Object.values(CategoryKind), "kind"),
      icon: optionalString(b.icon, "icon", 40),
      color: optionalString(b.color, "color", 20),
      parent_id: await ownCategoryId(userId, b.parentId),
    },
  });
}

export async function updateCategory(
  userId: string,
  id: string,
  b: Record<string, unknown>,
) {
  await owned(
    await prisma.categories.findFirst({ where: { id, owner_id: userId } }),
  );
  const data: Prisma.categoriesUncheckedUpdateInput = {};
  if ("name" in b) data.name = stringValue(b.name, "name", 60);
  if ("icon" in b) data.icon = optionalString(b.icon, "icon", 40);
  if ("color" in b) data.color = optionalString(b.color, "color", 20);
  if ("archived" in b) data.archived_at = b.archived ? new Date() : null;
  return prisma.categories.update({ where: { id }, data });
}

// ---------- Regras de classificação ----------

export async function createRule(userId: string, b: Record<string, unknown>) {
  const pattern = stringValue(b.pattern, "pattern", 200);
  try {
    new RegExp(pattern, "i");
  } catch {
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidRegex");
  }
  return prisma.classification_rules.create({
    data: {
      owner_id: userId,
      pattern,
      priority: optionalInt(b.priority, "priority", 0, 10000) ?? 100,
      transaction_type: enumValue(
        b.transactionType,
        Object.values(LedgerTransactionType),
        "transactionType",
      ),
      direction: b.direction
        ? enumValue(
            b.direction,
            Object.values(LedgerEntryDirection),
            "direction",
          )
        : null,
      category_id: await ownCategoryId(userId, b.categoryId),
      counterparty: optionalString(b.counterparty, "counterparty", 120),
      tags: Array.isArray(b.tags) ? b.tags.map(String).slice(0, 10) : [],
    },
  });
}

export async function deactivateRule(userId: string, id: string) {
  await owned(
    await prisma.classification_rules.findFirst({
      where: { id, owner_id: userId },
    }),
  );
  return prisma.classification_rules.update({
    where: { id },
    data: { active: false },
  });
}

// ---------- Recorrentes ----------

async function recurringData(
  userId: string,
  b: Record<string, unknown>,
  partial: boolean,
) {
  const data: Prisma.recurring_itemsUncheckedCreateInput =
    {} as Prisma.recurring_itemsUncheckedCreateInput;
  if (!partial || "description" in b)
    data.description = stringValue(b.description, "description", 120);
  if (!partial || "kind" in b)
    data.kind = enumValue(b.kind, Object.values(CategoryKind), "kind");
  if (!partial || "amount" in b) {
    const amount = parseDecimal(b.amount, "amount");
    positive(amount);
    data.amount = amount;
  }
  if (!partial || "assetId" in b)
    data.asset_id = (
      await assetByIdOrCode(b.assetId ?? (await baseAssetCode(userId)))
    ).id;
  if (!partial || "frequency" in b)
    data.frequency = enumValue(
      b.frequency ?? "MONTHLY",
      Object.values(RecurrenceFrequency),
      "frequency",
    );
  if ("dayOfMonth" in b)
    data.day_of_month = optionalInt(b.dayOfMonth, "dayOfMonth", 1, 31);
  if ("monthOfYear" in b)
    data.month_of_year = optionalInt(b.monthOfYear, "monthOfYear", 1, 12);
  if ("variableDay" in b) data.variable_day = Boolean(b.variableDay);
  if ("active" in b) data.active = Boolean(b.active);
  if ("notes" in b) data.notes = optionalString(b.notes, "notes", 500);
  if ("categoryId" in b)
    data.category_id = await ownCategoryId(userId, b.categoryId);
  if ("accountId" in b)
    data.account_id = await ownAccountId(userId, b.accountId);
  return data;
}

export async function createRecurring(
  userId: string,
  b: Record<string, unknown>,
) {
  await assertCanWrite(userId);
  const data = await recurringData(userId, b, false);
  await assertAssetsAllowed(userId, [data.asset_id]);
  return prisma.recurring_items.create({ data: { ...data, owner_id: userId } });
}

export async function updateRecurring(
  userId: string,
  id: string,
  b: Record<string, unknown>,
) {
  await owned(
    await prisma.recurring_items.findFirst({ where: { id, owner_id: userId } }),
  );
  await assertCanWrite(userId);
  const data = await recurringData(userId, b, true);
  await assertAssetsAllowed(userId, [data.asset_id]);
  return prisma.recurring_items.update({ where: { id }, data });
}

/** Recorrente não tem histórico financeiro: desativar mantém o registro. */
export async function deactivateRecurring(userId: string, id: string) {
  await owned(
    await prisma.recurring_items.findFirst({ where: { id, owner_id: userId } }),
  );
  return prisma.recurring_items.update({
    where: { id },
    data: { active: false },
  });
}

// ---------- Bens e investimentos ----------

async function holdingData(
  userId: string,
  b: Record<string, unknown>,
  partial: boolean,
) {
  const data = {} as Prisma.holdingsUncheckedCreateInput;
  if (!partial || "name" in b) data.name = stringValue(b.name, "name", 120);
  if (!partial || "class" in b)
    data.class = enumValue(b.class, Object.values(HoldingClass), "class");
  if (!partial || "value" in b) data.value = parseDecimal(b.value, "value");
  if (!partial || "assetId" in b)
    data.asset_id = (
      await assetByIdOrCode(b.assetId ?? (await baseAssetCode(userId)))
    ).id;
  if (!partial || "valuedAt" in b)
    data.valued_at = parseCivilDate(
      b.valuedAt ?? todayIn((await i18nContextForUser(userId)).timeZone),
      "valuedAt",
    );
  if ("quantity" in b)
    data.quantity =
      b.quantity == null || b.quantity === ""
        ? null
        : parseDecimal(b.quantity, "quantity");
  if ("ticker" in b) data.ticker = optionalString(b.ticker, "ticker", 32);
  if ("countryCode" in b)
    data.country_code =
      optionalString(b.countryCode, "countryCode", 2)?.toUpperCase() ?? null;
  if ("holderName" in b)
    data.holder_name = optionalString(b.holderName, "holderName", 80);
  if ("holderMemberId" in b)
    data.holder_member_id = await holdingHolderId(userId, b.holderMemberId);
  if ("notes" in b) data.notes = optionalString(b.notes, "notes", 500);
  return data;
}

export async function createHolding(
  userId: string,
  b: Record<string, unknown>,
) {
  await assertCanWrite(userId);
  const data = await holdingData(userId, b, false);
  await assertAssetsAllowed(userId, [data.asset_id]);
  return prisma.holdings.create({ data: { ...data, owner_id: userId } });
}

export async function updateHolding(
  userId: string,
  id: string,
  b: Record<string, unknown>,
) {
  await owned(
    await prisma.holdings.findFirst({
      where: { id, owner_id: userId, archived_at: null },
    }),
  );
  await assertCanWrite(userId);
  const data = await holdingData(userId, b, true);
  await assertAssetsAllowed(userId, [data.asset_id]);
  return prisma.holdings.update({ where: { id }, data });
}

export async function archiveHolding(userId: string, id: string) {
  await owned(
    await prisma.holdings.findFirst({ where: { id, owner_id: userId } }),
  );
  return prisma.holdings.update({
    where: { id },
    data: { archived_at: new Date() },
  });
}

// ---------- Viagens ----------

export async function createTrip(userId: string, b: Record<string, unknown>) {
  const name = stringValue(b.name, "name", 80);
  return prisma.trips.create({
    data: {
      owner_id: userId,
      name,
      tag: slugify(
        typeof b.tag === "string" && b.tag ? b.tag.replace(/^#/, "") : name,
      ),
      starts_on: b.startsOn ? parseCivilDate(b.startsOn, "startsOn") : null,
      ends_on: b.endsOn ? parseCivilDate(b.endsOn, "endsOn") : null,
      country_codes: Array.isArray(b.countryCodes)
        ? b.countryCodes
            .map((c) => String(c).toUpperCase())
            .filter((c) => /^[A-Z]{2}$/.test(c))
        : [],
      notes: optionalString(b.notes, "notes", 500),
    },
  });
}

/** Remove só o cadastro da viagem; a tag continua nos lançamentos. */
export async function deleteTrip(userId: string, id: string) {
  await owned(await prisma.trips.findFirst({ where: { id, owner_id: userId } }));
  await prisma.trips.delete({ where: { id } });
}

// ---------- Cotações manuais ----------

/** `baseCode`: moeda-base do usuário, usada quando `to` não vem no corpo. */
export async function createRate(userId: string, b: Record<string, unknown>, baseCode: string) {
  const from = await assetByIdOrCode(b.from);
  const to = await assetByIdOrCode(b.to ?? baseCode);
  if (from.id === to.id)
    throw new ValidationError("VALIDATION_ERROR", "errors.sameCurrencies");
  const rate = parseDecimal(b.rate, "rate");
  positive(rate, "rate");
  const at = b.date ? parseCivilDate(b.date, "date") : new Date();
  return prisma.exchange_rates.create({
    data: {
      from_asset_id: from.id,
      to_asset_id: to.id,
      rate,
      // O sufixo evita colisão da chave única entre usuários que informam o mesmo par no mesmo dia.
      provider: `manual:${userId}`,
      reference_type: "manual",
      source: "MANUAL",
      owner_id: userId,
      provider_timestamp: at,
      indicative: true,
    },
  });
}

// ---------- Fatura oficial ----------

/** Registra/atualiza o total e as datas oficiais da fatura (vindos do PDF do banco). */
export async function upsertStatement(
  userId: string,
  accountId: string,
  b: Record<string, unknown>,
) {
  const account = await owned(
    await prisma.accounts.findFirst({
      where: {
        id: accountId,
        type: "CREDIT_CARD",
        ...accessibleAccounts(userId),
      },
      include: { balances: true },
    }),
  );
  const month = stringValue(b.month, "month", 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new ValidationError("VALIDATION_ERROR", "errors.monthFormat", {
      field: "month",
    });
  const data = {
    closing_date: parseCivilDate(b.closingDate, "closingDate"),
    due_date: parseCivilDate(b.dueDate, "dueDate"),
    total_amount:
      b.total == null || b.total === "" ? null : parseDecimal(b.total, "total"),
    source: optionalString(b.source, "source", 32) ?? "manual",
    notes: optionalString(b.notes, "notes", 500),
  };
  const assetId =
    account.balances[0]?.asset_id ??
    (await assetByIdOrCode(await baseAssetCode(userId))).id;
  return prisma.card_statements.upsert({
    where: {
      account_id_reference_month: {
        account_id: accountId,
        reference_month: month,
      },
    },
    create: {
      ...data,
      account_id: accountId,
      reference_month: month,
      asset_id: assetId,
    },
    update: data,
  });
}
