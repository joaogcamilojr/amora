import type { AccountType, LedgerEntryDirection, LedgerTransactionType } from "@prisma/client";

import type { Locale } from "@/lib/i18n/config";

/** Categoria sugerida. `slug` é estável e único por usuário; o nome vem do catálogo i18n (`onboarding.categories.<key>`). */
export interface CategoryTemplate {
  slug: string;
  key: string;
  kind: "INCOME" | "EXPENSE";
  icon?: string;
  color?: string;
}

/** Regra de classificação sugerida: `pattern` é regex (flag i) sobre a descrição normalizada (minúsculas, sem acento). */
export interface RuleTemplate {
  pattern: string;
  transactionType: LedgerTransactionType;
  direction: Extract<LedgerEntryDirection, "CREDIT" | "DEBIT"> | null;
  /** Slug de uma categoria do pacote; ausente para tipos sem categoria (ex.: pagamento de fatura). */
  categorySlug?: string;
}

export interface CountryPack {
  /** ISO 3166-1 alpha-2 ou "GENERIC". */
  id: string;
  defaults: { locale: Locale; timeZone: string; currency: string } | null;
  /** Slugs extras de categoria além das universais. */
  extraCategories: CategoryTemplate[];
  rules: RuleTemplate[];
  accountTypes: AccountType[];
}
