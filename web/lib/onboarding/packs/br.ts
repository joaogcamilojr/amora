import type { CountryPack } from "../types";

export const BR_PACK: CountryPack = {
  id: "BR",
  defaults: { locale: "pt-BR", timeZone: "America/Sao_Paulo", currency: "BRL" },
  extraCategories: [
    {
      slug: "condominium",
      key: "condominium",
      kind: "EXPENSE",
      icon: "building",
      color: "#7c5cc4",
    },
    {
      slug: "meal-voucher",
      key: "mealVoucher",
      kind: "INCOME",
      icon: "ticket",
      color: "#e08a2e",
    },
  ],
  rules: [
    {
      pattern: "pagamento (de )?fatura|pgto fatura|pag fatura",
      transactionType: "CARD_PAYMENT",
      direction: "DEBIT",
    },
    {
      pattern: "\\biof\\b",
      transactionType: "FEE",
      direction: "DEBIT",
      categorySlug: "bank-fees",
    },
    {
      pattern: "tarifa|anuidade|cesta de servicos",
      transactionType: "FEE",
      direction: "DEBIT",
      categorySlug: "bank-fees",
    },
    {
      pattern: "salario|folha pgto|proventos",
      transactionType: "INCOME",
      direction: "CREDIT",
      categorySlug: "salary",
    },
    {
      pattern: "rendimento|rend pago|rend\\.",
      transactionType: "INTEREST_INCOME",
      direction: "CREDIT",
      categorySlug: "investment-income",
    },
    {
      pattern: "\\b(uber|99 ?app|99pop|cabify)\\b(?! ?eats)",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "transport",
    },
    {
      pattern: "\\b(posto|shell|ipiranga)\\b|combustivel",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "transport",
    },
    {
      pattern: "ifood|rappi|uber ?eats|restaurante|lanchonete|padaria",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "restaurants",
    },
    {
      pattern: "supermerc|atacad|carrefour|assai|pao de acucar|hortifruti",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "groceries",
    },
    {
      pattern: "farmacia|drogaria|drogasil|droga raia|pacheco",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "health",
    },
    {
      pattern:
        "netflix|spotify|disney|hbo|prime video|youtube premium|apple\\.com/bill|google one",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "subscriptions",
    },
    {
      pattern: "\\b(enel|cemig|copel|sabesp|copasa|sanepar|vivo|claro|tim)\\b",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "utilities",
    },
  ],
  accountTypes: [
    "BANK_ACCOUNT",
    "CREDIT_CARD",
    "BENEFIT_ACCOUNT",
    "DIGITAL_BALANCE",
    "CASH_WALLET",
    "INTERNATIONAL_ACCOUNT",
    "CRYPTO_WALLET",
  ],
};
