import type { AccountView, CategoryView, HoldingView, Movement } from "./types";
import { isExpense, isIncome } from "./types";

export interface MonthSummary {
  month: string;
  income: number;
  expenses: number;
  result: number;
}

/** Receitas e despesas reais na moeda-base. Transferências, câmbio, investimentos e pagamentos de fatura ficam de fora. */
export function monthlySummary(movements: Movement[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>();
  for (const m of movements) {
    const income = isIncome(m.type);
    if (!income && !isExpense(m.type)) continue;
    if (m.status === "ESTIMATED" || m.baseAmount == null) continue;
    const month = m.date.slice(0, 7);
    const item = map.get(month) ?? { month, income: 0, expenses: 0, result: 0 };
    // Sinal manda: estorno lançado como despesa positiva reduz a despesa.
    if (income) item.income += m.baseAmount;
    else item.expenses += -m.baseAmount;
    item.result = item.income - item.expenses;
    map.set(month, item);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function averageOfLast(summary: MonthSummary[], months: number) {
  const slice = summary.slice(-months);
  if (slice.length === 0) return { income: 0, expenses: 0 };
  return {
    income: slice.reduce((s, m) => s + m.income, 0) / slice.length,
    expenses: slice.reduce((s, m) => s + m.expenses, 0) / slice.length,
  };
}

export interface CategoryTotal {
  categoryId: string;
  /** Nome da categoria; `null` = sem categoria (a interface mostra o rótulo traduzido). */
  name: string | null;
  total: number;
  count: number;
}

export const UNCATEGORIZED = "_uncategorized";

export function expensesByCategory(
  movements: Movement[],
  categories: CategoryView[],
  filter: (m: Movement) => boolean = () => true,
): CategoryTotal[] {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const map = new Map<string, CategoryTotal>();
  for (const m of movements) {
    if (!isExpense(m.type) || m.baseAmount == null || !filter(m)) continue;
    const id = m.categoryId ?? UNCATEGORIZED;
    const item = map.get(id) ?? {
      categoryId: id,
      name: names.get(id) ?? null,
      total: 0,
      count: 0,
    };
    item.total += -m.baseAmount;
    item.count += 1;
    map.set(id, item);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface NetWorth {
  accountsBase: number;
  holdingsBase: number;
  debtsBase: number;
  totalBase: number;
  missingRates: string[];
  byAsset: { assetCode: string; amount: number; base: number | null }[];
}

export function netWorth(
  accounts: AccountView[],
  holdings: HoldingView[],
): NetWorth {
  const missing = new Set<string>();
  const byAsset = new Map<string, { amount: number; base: number | null }>();
  let accountsBase = 0;
  let debtsBase = 0;
  const add = (code: string, amount: number, base: number | null) => {
    const item = byAsset.get(code) ?? { amount: 0, base: 0 };
    item.amount += amount;
    item.base = item.base == null || base == null ? null : item.base + base;
    byAsset.set(code, item);
  };
  for (const account of accounts) {
    if (account.status !== "ACTIVE" || !account.includeInNetWorth) continue;
    for (const balance of account.balances) {
      add(balance.asset.code, balance.current, balance.base);
      if (balance.base == null) {
        if (balance.current !== 0) missing.add(balance.asset.code);
        continue;
      }
      if (balance.base < 0) debtsBase += -balance.base;
      else accountsBase += balance.base;
    }
  }
  let holdingsBase = 0;
  for (const h of holdings) {
    add(h.assetCode, h.value, h.base);
    if (h.base == null) missing.add(h.assetCode);
    else holdingsBase += h.base;
  }
  return {
    accountsBase,
    holdingsBase,
    debtsBase,
    totalBase: accountsBase + holdingsBase - debtsBase,
    missingRates: [...missing],
    byAsset: [...byAsset.entries()]
      .filter(([, v]) => v.amount !== 0)
      .map(([assetCode, v]) => ({ assetCode, ...v }))
      .sort((a, b) => (b.base ?? 0) - (a.base ?? 0)),
  };
}
