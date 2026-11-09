import type { CountryPack } from "../types";

export const US_PACK: CountryPack = {
  id: "US",
  defaults: { locale: "en", timeZone: "America/New_York", currency: "USD" },
  extraCategories: [
    {
      slug: "tips",
      key: "tips",
      kind: "EXPENSE",
      icon: "coins",
      color: "#c4a12f",
    },
  ],
  rules: [
    {
      pattern: "payment thank you|autopay|credit card payment|card payment",
      transactionType: "CARD_PAYMENT",
      direction: "DEBIT",
    },
    {
      pattern: "overdraft|monthly service fee|atm fee|foreign transaction fee",
      transactionType: "FEE",
      direction: "DEBIT",
      categorySlug: "bank-fees",
    },
    {
      pattern: "payroll|direct dep|salary",
      transactionType: "INCOME",
      direction: "CREDIT",
      categorySlug: "salary",
    },
    {
      pattern: "interest (paid|earned|payment)|\\bapy\\b",
      transactionType: "INTEREST_INCOME",
      direction: "CREDIT",
      categorySlug: "investment-income",
    },
    {
      pattern: "\\b(uber|lyft)\\b(?! ?eats)",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "transport",
    },
    {
      pattern: "\\b(shell|chevron|exxon|mobil)\\b|gas station",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "transport",
    },
    {
      pattern:
        "doordash|grubhub|uber ?eats|starbucks|mcdonald|chipotle|restaurant",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "restaurants",
    },
    {
      pattern:
        "walmart|kroger|safeway|trader joe|whole foods|costco|aldi|publix",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "groceries",
    },
    {
      pattern: "\\b(cvs|walgreens)\\b|pharmacy",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "health",
    },
    {
      pattern: "netflix|spotify|disney|hulu|hbo|prime video|youtube premium",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "subscriptions",
    },
    {
      pattern: "comcast|xfinity|verizon|at&t|t-mobile|con ?ed|pg&e",
      transactionType: "EXPENSE",
      direction: "DEBIT",
      categorySlug: "utilities",
    },
  ],
  accountTypes: [
    "BANK_ACCOUNT",
    "CREDIT_CARD",
    "DIGITAL_BALANCE",
    "CASH_WALLET",
    "CRYPTO_WALLET",
  ],
};
