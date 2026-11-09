import type { CategoryTemplate } from "./types";

const expense = (
  slug: string,
  key: string,
  icon: string,
  color: string,
): CategoryTemplate => ({
  slug,
  key,
  kind: "EXPENSE",
  icon,
  color,
});
const income = (
  slug: string,
  key: string,
  icon: string,
  color: string,
): CategoryTemplate => ({
  slug,
  key,
  kind: "INCOME",
  icon,
  color,
});

/**
 * Categorias de qualquer país. Os dois slugs em português são o fallback fixo da importação e da classificação
 * (`FALLBACK_*_SLUG` em `lib/finance/ledger.ts`); os nomes visíveis seguem o idioma escolhido.
 */
export const UNIVERSAL_CATEGORIES: CategoryTemplate[] = [
  expense("sem-categoria", "uncategorized", "tag", "#8a8f98"),
  expense("groceries", "groceries", "shopping-cart", "#2f9e6e"),
  expense("restaurants", "restaurants", "utensils", "#e08a2e"),
  expense("transport", "transport", "car", "#3b82c4"),
  expense("housing", "housing", "home", "#7c5cc4"),
  expense("utilities", "utilities", "zap", "#c4a12f"),
  expense("health", "health", "heart", "#d9534f"),
  expense("education", "education", "book", "#2f8fa3"),
  expense("leisure", "leisure", "smile", "#d96aa7"),
  expense("shopping", "shopping", "bag", "#a05fcf"),
  expense("subscriptions", "subscriptions", "repeat", "#5b6bd6"),
  expense("travel", "travel", "plane", "#2c9fd0"),
  expense("insurance", "insurance", "shield", "#6b7a8f"),
  expense("taxes", "taxes", "landmark", "#8c6d46"),
  expense("bank-fees", "bankFees", "percent", "#9a9a9a"),
  expense("gifts-donations", "giftsDonations", "gift", "#cf6f5a"),
  income("salary", "salary", "briefcase", "#2f9e6e"),
  income("freelance", "freelance", "laptop", "#3b82c4"),
  income("investment-income", "investmentIncome", "trending-up", "#7c5cc4"),
  income("outras-receitas", "otherIncome", "plus-circle", "#8a8f98"),
];
