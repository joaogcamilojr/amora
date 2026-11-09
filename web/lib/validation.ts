import {
  AccountMemberRole,
  AccountStatus,
  AccountType,
  AssetType,
  CardType,
  Prisma,
  YieldType,
} from "@prisma/client";

import { getAccountTypeConfiguration } from "@/lib/accounts/account-types";
import { isCountryCode } from "@/lib/countries";
import { camelize, snakeKey } from "@/lib/case";
import { parseDecimal, validateScale } from "@/lib/money";

export const accountTypes = Object.values(AccountType);
export const roles = Object.values(AccountMemberRole);
export const cardTypes = Object.values(CardType);
export const yieldTypes = Object.values(YieldType);

/**
 * Erro de domínio. `message` é uma chave do catálogo ("errors.invalidCurrency"), traduzida para o idioma
 * do usuário em `toErrorResponse`/`localizeError`, com `vars` para interpolação.
 */
export class ValidationError extends Error {
  constructor(
    public code: string,
    message = code,
    public vars?: Record<string, string | number>,
  ) {
    super(message);
  }
}

export function emailValue(value: unknown) {
  const email = stringValue(value, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidEmail");
  return email;
}

export function stringValue(
  value: unknown,
  field: string,
  max = 160,
  required = true,
) {
  if (
    typeof value !== "string" ||
    (required && !value.trim()) ||
    value.length > max
  )
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", { field });
  return value.trim();
}

export function cuidValue(value: string, field = "id") {
  if (!/^[a-z0-9]{20,30}$/i.test(value))
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", { field });
  return value;
}

export function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
): T {
  if (typeof value !== "string" || !values.includes(value as T))
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", { field });
  return value as T;
}

export function parseCivilDate(value: unknown, field = "openingDate") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new ValidationError("VALIDATION_ERROR", "errors.dateFormat", {
      field,
    });
  const [year, month, day] = value.split("-").map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    year < 1900 ||
    year > 2200 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    instant.getUTCFullYear() !== year ||
    instant.getUTCMonth() !== month - 1 ||
    instant.getUTCDate() !== day
  )
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", { field });
  return instant;
}

export const parseCivilDateToCanonicalInstant = parseCivilDate;

export function formatCanonicalInstantAsCivilDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getUTCFullYear().toString().padStart(4, "0")}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`;
}

function accountFields(body: Record<string, unknown>, includeType: boolean) {
  const type = includeType
    ? enumValue(body.type, accountTypes, "type")
    : undefined;
  const config = type ? getAccountTypeConfiguration(type) : undefined;
  const countryCode =
    body.countryCode == null || body.countryCode === ""
      ? null
      : stringValue(body.countryCode, "countryCode", 2).toUpperCase();

  if (countryCode && !isCountryCode(countryCode))
    throw new ValidationError(
      "INVALID_COUNTRY_CODE",
      "errors.invalidCountryCode",
    );

  if (config?.requiresCountry && !countryCode)
    throw new ValidationError(
      "COUNTRY_REQUIRED",
      "errors.countryRequired",
    );

  const institutionName =
    body.institutionName == null || body.institutionName === ""
      ? null
      : stringValue(body.institutionName, "institutionName", 120, false);

  if (config?.requiresInstitution && !institutionName)
    throw new ValidationError(
      "INSTITUTION_REQUIRED",
      "errors.institutionRequired",
    );

  if (config && !config.allowsCountry && countryCode)
    throw new ValidationError(
      "VALIDATION_ERROR",
      "errors.countryNotAllowed",
    );

  if (config && !config.allowsInstitution && institutionName)
    throw new ValidationError(
      "VALIDATION_ERROR",
      "errors.institutionNotAllowed",
    );

  return {
    ...(type ? { type } : {}),
    name: stringValue(body.name, "name", 100),
    description:
      body.description == null
        ? null
        : stringValue(body.description, "description", 500, false),
    institution_name: institutionName,
    country_code: countryCode,
    external_reference:
      body.externalReference == null
        ? null
        : stringValue(body.externalReference, "externalReference", 120, false),
    color:
      body.color == null ? null : stringValue(body.color, "color", 20, false),
    icon: body.icon == null ? null : stringValue(body.icon, "icon", 40, false),
    include_in_net_worth:
      typeof body.includeInNetWorth === "boolean"
        ? body.includeInNetWorth
        : (config?.defaultIncludeInNetWorth ?? true),
    include_in_available_balance:
      typeof body.includeInAvailableBalance === "boolean"
        ? body.includeInAvailableBalance
        : (config?.defaultIncludeInAvailableBalance ?? true),
  };
}

export function parseCreateAccountInput(body: Record<string, unknown>) {
  return accountFields(body, true);
}

export function parseUpdateAccountInput(
  body: Record<string, unknown>,
  type: AccountType,
) {
  const allowed = [
    "name",
    "description",
    "institutionName",
    "countryCode",
    "externalReference",
    "color",
    "icon",
    "includeInNetWorth",
    "includeInAvailableBalance",
    "card",
    "holderName",
    "householdId",
    "holderMemberId",
    "notes",
  ];
  if (Object.keys(body).some((key) => !allowed.includes(key)))
    throw new ValidationError("VALIDATION_ERROR", "errors.fieldNotEditable");
  const config = getAccountTypeConfiguration(type);
  const output: Record<string, unknown> = {};
  if ("name" in body) output.name = stringValue(body.name, "name", 100);
  for (const field of [
    "description",
    "externalReference",
    "color",
    "icon",
  ] as const)
    if (field in body)
      output[snakeKey(field)] =
        body[field] == null
          ? null
          : stringValue(
              body[field],
              field,
              field === "description"
                ? 500
                : field === "icon"
                  ? 40
                  : field === "color"
                    ? 20
                    : 120,
              false,
            );
  if ("holderName" in body)
    output.holder_name =
      body.holderName == null || body.holderName === ""
        ? null
        : stringValue(body.holderName, "holderName", 80, false);
  if ("notes" in body)
    output.notes =
      body.notes == null || body.notes === ""
        ? null
        : stringValue(body.notes, "notes", 1000, false);
  if ("countryCode" in body) {
    const country =
      body.countryCode == null || body.countryCode === ""
        ? null
        : stringValue(body.countryCode, "countryCode", 2).toUpperCase();
    if (country && !isCountryCode(country))
      throw new ValidationError(
        "INVALID_COUNTRY_CODE",
        "errors.invalidCountryCode",
      );
    if (config.requiresCountry && !country)
      throw new ValidationError(
        "COUNTRY_REQUIRED",
        "errors.countryRequired",
      );
    output.country_code = country;
  }
  if ("institutionName" in body) {
    const institution =
      body.institutionName == null || body.institutionName === ""
        ? null
        : stringValue(body.institutionName, "institutionName", 120, false);
    if (config.requiresInstitution && !institution)
      throw new ValidationError(
        "INSTITUTION_REQUIRED",
        "errors.institutionRequired",
      );
    output.institution_name = institution;
  }
  for (const field of [
    "includeInNetWorth",
    "includeInAvailableBalance",
  ] as const)
    if (field in body) {
      if (typeof body[field] !== "boolean")
        throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", { field });
      output[snakeKey(field)] = body[field];
    }
  return output;
}

export function parseOpeningBalances(
  input: unknown,
  assets: Array<{
    id: string;
    code: string;
    decimals: number;
    type: AssetType;
  }>,
  type: AccountType,
) {
  const config = getAccountTypeConfiguration(type);
  if (input == null) input = [];
  if (!Array.isArray(input) || input.length > 20)
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", {
        field: "openingBalances",
      });
  if (config.assetSelection === "single" && input.length > 1)
    throw new ValidationError(
      "MULTIPLE_ASSETS_NOT_ALLOWED",
      "errors.singleAssetOnly",
    );
  const seen = new Set<string>();

  return input.map((raw) => {
    if (!raw || typeof raw !== "object")
      throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", {
        field: "openingBalances",
      });
    const item = raw as Record<string, unknown>;
    const assetId = cuidValue(String(item.assetId), "assetId");
    if (seen.has(assetId))
      throw new ValidationError("DUPLICATE_ASSET", "errors.duplicateAsset");
    seen.add(assetId);
    const asset = assets.find((candidate) => candidate.id === assetId);
    if (!asset)
      throw new ValidationError("ASSET_NOT_ALLOWED", "errors.assetNotFound");
    if (!config.allowedAssetTypes.includes(asset.type))
      throw new ValidationError(
        "ASSET_NOT_ALLOWED",
        "errors.assetIncompatible",
      );
    const amount = parseDecimal(item.amount, "openingBalance");
    if (amount.lt(0))
      throw new ValidationError(
        "VALIDATION_ERROR",
        "errors.negativeOpeningBalance",
      );
    validateScale(amount, asset, "openingBalance");
    return {
      asset,
      amount,
      occurredAt: parseCivilDateToCanonicalInstant(item.openingDate),
    };
  });
}

export function cardInput(
  body: Record<string, unknown>,
  config: ReturnType<typeof getAccountTypeConfiguration>,
  assets: Array<{ id: string; type: AssetType }> = [],
  required = config.requiresCardProfile,
) {
  const raw = body.card;
  if (raw == null) {
    if (required)
      throw new ValidationError(
        "CARD_PROFILE_REQUIRED",
        "errors.card.profileRequired",
      );
    return undefined;
  }
  if (typeof raw !== "object")
    throw new ValidationError(
      "INVALID_CARD_PROFILE",
      "errors.card.invalidProfile",
    );
  const card = raw as Record<string, unknown>;
  const type = enumValue(card.type, cardTypes, "card.type");
  if (!config.allowedCardTypes.includes(type))
    throw new ValidationError(
      "INVALID_CARD_PROFILE",
      "errors.card.typeIncompatible",
    );
  const lastFour =
    card.lastFour == null || card.lastFour === ""
      ? null
      : stringValue(card.lastFour, "card.lastFour", 4);
  if (lastFour && !/^\d{4}$/.test(lastFour))
    throw new ValidationError(
      "INVALID_CARD_PROFILE",
      "errors.card.invalidLastFour",
    );
  const day = (value: unknown, field: string) =>
    value == null || value === ""
      ? null
      : typeof value === "number" &&
          Number.isInteger(value) &&
          value >= 1 &&
          value <= 31
        ? value
        : (() => {
            throw new ValidationError(
              "INVALID_CARD_PROFILE",
              "errors.invalidField",
              { field },
            );
          })();
  const closingDay = day(card.closingDay, "closingDay");
  const dueDay = day(card.dueDay, "dueDay");
  if (
    ["GIFT_CARD", "BENEFIT_ACCOUNT", "PREPAID_CARD"].includes(config.value) &&
    (closingDay || dueDay)
  )
    throw new ValidationError(
      "INVALID_CARD_PROFILE",
      "errors.card.closingDueNotApplicable",
    );
  if (config.value === "CREDIT_CARD" && (!closingDay || !dueDay))
    throw new ValidationError(
      "INVALID_CARD_PROFILE",
      "errors.card.closingDueRequired",
    );
  const creditLimit =
    card.creditLimit == null || card.creditLimit === ""
      ? null
      : parseDecimal(card.creditLimit, "card.creditLimit");
  if (creditLimit?.lt(0))
    throw new ValidationError("INVALID_CARD_PROFILE", "errors.card.invalidLimit");
  const limitAssetId =
    card.limitAssetId == null || card.limitAssetId === ""
      ? null
      : cuidValue(String(card.limitAssetId), "card.limitAssetId");
  if (creditLimit && !limitAssetId)
    throw new ValidationError(
      "INVALID_CARD_PROFILE",
      "errors.card.limitAssetRequired",
    );
  if (
    limitAssetId &&
    assets.length &&
    !assets.some(
      (asset) => asset.id === limitAssetId && asset.type === AssetType.FIAT,
    )
  )
    throw new ValidationError(
      "INVALID_CARD_PROFILE",
      "errors.card.invalidLimitAsset",
    );
  return {
    type,
    brand:
      card.brand == null
        ? null
        : stringValue(card.brand, "card.brand", 40, false),
    last_four: lastFour,
    closing_day: closingDay,
    due_day: dueDay,
    credit_limit: creditLimit,
    limit_asset_id: limitAssetId,
    ...cardExtras(card),
  };
}

/** Campos Amora do cartão: cashback estimado (fração, 0.012 = 1,2%) e conta pagadora. */
function cardExtras(card: Record<string, unknown>) {
  const out: {
    cashback_rate?: Prisma.Decimal | null;
    payment_account_id?: string | null;
  } = {};
  if ("cashbackRate" in card) {
    const rate =
      card.cashbackRate == null || card.cashbackRate === ""
        ? null
        : parseDecimal(card.cashbackRate, "card.cashbackRate");
    if (rate && (rate.lt(0) || rate.gt(0.2)))
      throw new ValidationError(
        "INVALID_CARD_PROFILE",
        "errors.card.invalidCashback",
      );
    out.cashback_rate = rate;
  }
  if ("paymentAccountId" in card)
    out.payment_account_id =
      card.paymentAccountId == null || card.paymentAccountId === ""
        ? null
        : cuidValue(String(card.paymentAccountId), "card.paymentAccountId");
  return out;
}

export function parseAddAccountBalanceInput(body: Record<string, unknown>) {
  return {
    assetId: cuidValue(String(body.assetId), "assetId"),
    amount: parseDecimal(body.amount, "amount"),
    occurredAt: parseCivilDateToCanonicalInstant(body.openingDate),
  };
}

type PublicAccountInput = Prisma.accountsGetPayload<{
  include: {
    balances: {
      include: { asset: true; entries: { include: { transaction: true } } };
    };
    card_profile: true;
  };
}>;

/** DTO da conta para a API (camelCase, decimais em string, `openingDate` civil). */
export function publicAccount(
  account: Omit<PublicAccountInput, "balances"> & {
    balances: Array<
      Omit<PublicAccountInput["balances"][number], "entries"> & {
        entries?: PublicAccountInput["balances"][number]["entries"];
      }
    >;
  },
) {
  const { balances, card_profile, ...rest } = account;
  return camelize({
    ...rest,
    balances: balances.map(({ entries, ...balance }) => ({
      ...balance,
      current_balance: balance.current_balance.toString(),
      available_balance: balance.available_balance?.toString() ?? null,
      opening_date: entries?.[0]?.transaction?.occurred_at
        ? formatCanonicalInstantAsCivilDate(entries[0].transaction.occurred_at)
        : null,
    })),
    card_profile: card_profile
      ? {
          ...card_profile,
          credit_limit: card_profile.credit_limit?.toString() ?? null,
          cashback_rate: card_profile.cashback_rate?.toString() ?? null,
        }
      : null,
  }) as Record<string, unknown>;
}

export const activeAccount = { status: AccountStatus.ACTIVE };
