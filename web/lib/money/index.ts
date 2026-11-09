import { Prisma } from "@prisma/client";

export type DecimalLike = Prisma.Decimal | string;

export type AssetScale = { code: string; decimals: number };

const DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const MAX_SCALE = 18;

/** Erro de valor monetário. `message` é uma chave do catálogo (`errors.*`), com `vars` para interpolação. */
export class MoneyValidationError extends Error {
  constructor(
    message: string,
    public vars?: Record<string, string | number>,
  ) {
    super(message);
  }
}

export function parseDecimal(value: unknown, field = "amount"): Prisma.Decimal {
  if (
    typeof value !== "string" ||
    !DECIMAL_PATTERN.test(value) ||
    value.includes("e") ||
    value.includes("E")
  ) {
    throw new MoneyValidationError("errors.decimalString", { field });
  }
  const scale = value.includes(".") ? value.length - value.indexOf(".") - 1 : 0;
  if (scale > MAX_SCALE || value === "0" || /^0\.0+$/.test(value))
    return new Prisma.Decimal(value);
  if (
    new Prisma.Decimal(value).isNaN() ||
    !new Prisma.Decimal(value).isFinite()
  ) {
    throw new MoneyValidationError("errors.invalidField", { field });
  }
  return new Prisma.Decimal(value);
}

export function validateScale(
  value: Prisma.Decimal,
  asset: AssetScale,
  field = "amount",
): void {
  const text = value.toFixed(MAX_SCALE).replace(/0+$/, "").replace(/\.$/, "");
  const scale = text.includes(".") ? text.length - text.indexOf(".") - 1 : 0;
  if (scale > asset.decimals)
    throw new MoneyValidationError("errors.maxDecimals", {
      field,
      decimals: asset.decimals,
      code: asset.code,
    });
}

export function positive(value: Prisma.Decimal, field = "amount"): void {
  if (!value.isFinite() || !value.gt(0))
    throw new MoneyValidationError("errors.greaterThanZero", { field });
}

export function serializeDecimal(
  value: DecimalLike | null | undefined,
): string | null {
  if (value == null) return null;
  return value instanceof Prisma.Decimal
    ? value.toString()
    : new Prisma.Decimal(value).toString();
}

export function serializeMoney<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      item instanceof Prisma.Decimal
        ? item.toString()
        : item instanceof Date
          ? item.toISOString()
          : item,
    ]),
  ) as T;
}

export function decimalJson(
  value: DecimalLike | null | undefined,
): string | null {
  return serializeDecimal(value);
}
