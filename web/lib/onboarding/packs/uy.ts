import type { CountryPack } from "../types";

export const UY_PACK: CountryPack = {
  id: "UY",
  defaults: { locale: "es", timeZone: "America/Montevideo", currency: "UYU" },
  extraCategories: [
    {
      slug: "condominium",
      key: "condominium",
      kind: "EXPENSE",
      icon: "building",
      color: "#7c5cc4",
    },
  ],
  rules: [
    {
      pattern: "pago (de )?tarjeta|pago tc",
      transactionType: "CARD_PAYMENT",
      direction: "DEBIT",
    },
    {
      pattern: "comision|cargo (de )?mantenimiento|mantenimiento de cuenta",
      transactionType: "FEE",
      direction: "DEBIT",
      categorySlug: "bank-fees",
    },
    {
      pattern: "sueldo|haberes|liquidacion de sueldo",
      transactionType: "INCOME",
      direction: "CREDIT",
      categorySlug: "salary",
    },
    {
      pattern: "intereses? (ganados|acreditados)",
      transactionType: "INTEREST_INCOME",
      direction: "CREDIT",
      categorySlug: "investment-income",
    },
    {
      pattern: "\\b(uber|cabify)\\b(?! ?eats)",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "transport",
    },
    {
      pattern: "\\b(ancap|petrobras|disa|axion)\\b|combustible",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "transport",
    },
    {
      pattern: "pedidosya|pedidos ya|rappi|restaurante|cafeteria",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "restaurants",
    },
    {
      pattern:
        "tienda inglesa|\\bdisco\\b|devoto|ta-?ta\\b|el dorado|supermercado",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "groceries",
    },
    {
      pattern: "farmashop|farmacia|mutualista|casmu|medica uruguaya",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "health",
    },
    {
      pattern: "netflix|spotify|disney|hbo|prime video|youtube premium",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "subscriptions",
    },
    {
      pattern: "\\b(ute|ose|antel|montevideo gas)\\b",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "utilities",
    },
  ],
  accountTypes: [
    "BANK_ACCOUNT",
    "MULTI_CURRENCY_ACCOUNT",
    "CREDIT_CARD",
    "DIGITAL_BALANCE",
    "CASH_WALLET",
  ],
};
