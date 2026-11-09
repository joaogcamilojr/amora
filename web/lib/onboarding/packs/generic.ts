import type { CountryPack } from "../types";

/** Países sem pacote próprio: categorias universais, sem regras de mercado. */
export const GENERIC_PACK: CountryPack = {
  id: "GENERIC",
  defaults: null,
  extraCategories: [],
  rules: [
    {
      pattern: "netflix|spotify|disney|hbo|prime video|youtube premium",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "subscriptions",
    },
  ],
  accountTypes: [
    "BANK_ACCOUNT",
    "CREDIT_CARD",
    "CASH_WALLET",
    "DIGITAL_BALANCE",
    "MULTI_CURRENCY_ACCOUNT",
  ],
};
