import {
  averageOfLast,
  expensesByCategory,
  monthlySummary,
  netWorth,
} from "./analysis";
import { cardSummary, openInstallmentPlans } from "./cards";
import type { FinanceData } from "./load";
import { monthlyEquivalent, nextDate } from "./recurring";
import type { Movement } from "./types";

/** Categorias que não geram cashback (juros, encargos, IOF). */
export const NO_CASHBACK_SLUGS = ["juros", "encargos", "iof", "tarifas"];

/** `today`: AAAA-MM-DD no fuso do usuário (`fmt.today()`). */
export function cardSummaries(data: FinanceData, today: string) {
  const excluded = new Set(
    data.categories
      .filter((c) => NO_CASHBACK_SLUGS.includes(c.slug))
      .map((c) => c.id),
  );
  return data.accounts
    .filter((a) => a.type === "CREDIT_CARD" && a.status === "ACTIVE")
    .map((a) =>
      cardSummary(
        a,
        data.movements,
        data.statements.filter((s) => s.accountId === a.id),
        { excludedFromCashback: excluded, today },
      ),
    );
}

export interface TransactionFilter {
  month?: string | null;
  accountId?: string | null;
  categoryId?: string | null;
  type?: string | null;
  tag?: string | null;
  q?: string | null;
  pending?: boolean;
}

export function filterMovements(movements: Movement[], f: TransactionFilter) {
  const q = f.q?.trim().toLowerCase();
  return movements
    .filter(
      (m) =>
        (!f.month || m.date.startsWith(f.month)) &&
        (!f.accountId || m.accountId === f.accountId) &&
        (!f.categoryId ||
          (f.categoryId === "_none"
            ? !m.categoryId
            : m.categoryId === f.categoryId)) &&
        (!f.type || m.type === f.type) &&
        (!f.tag || m.tags.includes(f.tag)) &&
        (!f.pending || m.status !== "POSTED") &&
        (!q ||
          m.description.toLowerCase().includes(q) ||
          (m.originalDescription ?? "").toLowerCase().includes(q)),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Pontos de atenção: o que precisa de revisão humana. */
export function pendingReview(data: FinanceData) {
  const uncategorized = data.movements.filter(
    (m) => (m.type === "EXPENSE" || m.type === "INCOME") && !m.categoryId,
  ).length;
  const generic = new Set(
    data.categories
      .filter((c) => ["sem-categoria", "outras-receitas"].includes(c.slug))
      .map((c) => c.id),
  );
  const genericCount = data.movements.filter(
    (m) => m.categoryId && generic.has(m.categoryId),
  ).length;
  const pending = data.movements.filter((m) => m.status === "PENDING").length;
  const unlinkedTransfers = data.movements.filter(
    (m) => m.type === "TRANSFER" && !m.counterpartAccountId,
  ).length;
  const missingRates = netWorth(data.accounts, data.holdings).missingRates;
  return {
    uncategorized,
    genericCount,
    pending,
    unlinkedTransfers,
    missingRates,
  };
}

/**
 * Resumo do mês. `currentMonth` (AAAA-MM no fuso do usuário, ex.: `fmt.currentMonth()`) só é usado
 * quando não há `month` nem movimentos; sem ele, cai no mês UTC (compatibilidade).
 */
/** `today` (AAAA-MM-DD) no fuso do usuário: `fmt.today()`. */
export function overview(
  data: FinanceData,
  month: string | undefined,
  today: string,
) {
  const summary = monthlySummary(data.movements);
  const current = month ?? summary.at(-1)?.month ?? today.slice(0, 7);
  const recurring = data.recurring.filter((r) => r.active);
  return {
    baseCode: data.baseCode,
    month: current,
    months: data.months,
    netWorth: netWorth(data.accounts, data.holdings),
    monthly: summary,
    average3: averageOfLast(
      summary.filter((s) => s.month < current),
      3,
    ),
    currentMonth: summary.find((s) => s.month === current) ?? {
      month: current,
      income: 0,
      expenses: 0,
      result: 0,
    },
    expensesByCategory: expensesByCategory(
      data.movements,
      data.categories,
      (m) => m.date.startsWith(current),
    ),
    cards: cardSummaries(data, today).map((c) => ({
      accountId: c.account.id,
      name: c.account.name,
      limit: c.limit,
      used: c.used,
      available: c.available,
      current: c.current && {
        month: c.current.month,
        dueDate: c.current.dueDate,
        status: c.current.status,
        total: c.current.officialTotal ?? c.current.itemsTotal,
        expectedCashback: c.current.expectedCashback,
      },
    })),
    recurring: {
      monthlyIncome: recurring
        .filter((r) => r.kind === "INCOME")
        .reduce((s, r) => s + monthlyEquivalent(r), 0),
      monthlyExpenses: recurring
        .filter((r) => r.kind === "EXPENSE")
        .reduce((s, r) => s + monthlyEquivalent(r), 0),
      upcoming: recurring
        .map((r) => ({
          id: r.id,
          description: r.description,
          kind: r.kind,
          amount: r.amount,
          assetCode: r.assetCode,
          next: nextDate(r, today),
        }))
        .filter((r) => r.next)
        .sort((a, b) => a.next!.localeCompare(b.next!))
        .slice(0, 8),
    },
    installments: openInstallmentPlans(data.movements),
    review: pendingReview(data),
  };
}

/** Versão serializável (sem Map) para API/MCP. */
export function publicFinance(data: FinanceData) {
  const { fx, ...rest } = data;
  return { ...rest, fx: Object.fromEntries(fx) };
}

/** Contas ativas sem movimento há mais de `days` dias (ou nunca). */
export function staleAccounts(
  data: FinanceData,
  days: number,
  now = Date.now(),
) {
  return data.accounts.filter(
    (a) =>
      a.status === "ACTIVE" &&
      (!a.lastMovementDate ||
        (now - new Date(a.lastMovementDate).getTime()) / 86_400_000 > days),
  );
}
