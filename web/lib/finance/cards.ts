import type { AccountView, Movement, StatementView } from "./types";

export type StatementStatus = "paid" | "closed" | "overdue" | "open" | "future";

export interface StatementItem {
  id: string;
  date: string;
  description: string;
  /** Positivo = compra/encargo; negativo = estorno/crédito. */
  amount: number;
  categoryId: string | null;
  installment?: { number: number; count: number };
  projected?: boolean;
  pending?: boolean;
  tags: string[];
}

export interface StatementPayment {
  id: string;
  date: string;
  amount: number;
  description: string;
  /** Conta de onde saiu o dinheiro (outra perna do lançamento). */
  sourceAccountId: string | null;
  pending: boolean;
}

export interface Statement {
  month: string;
  closingDate: string;
  dueDate: string;
  status: StatementStatus;
  items: StatementItem[];
  itemsTotal: number;
  officialTotal: number | null;
  payments: StatementPayment[];
  paidTotal: number;
  /** Cashback estimado sobre compras líquidas (sem juros/encargos). Pagamento antecipado não reduz. */
  expectedCashback: number;
}

export interface CardSummary {
  account: AccountView;
  limit: number;
  /** Dívida já lançada (saldo negativo do cartão). */
  outstanding: number;
  /** Parcelas futuras que já comprometem o limite. */
  futureInstallments: number;
  used: number;
  available: number;
  statements: Statement[];
  current: Statement | null;
}

const day = (iso: string) => Number(iso.slice(8, 10));

export function addMonths(yearMonth: string, n: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dateInMonth(yearMonth: string, d: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${yearMonth}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

/** Fechamento e vencimento de uma fatura (mês = mês do vencimento). */
export function statementDates(account: AccountView, month: string, official: StatementView[]) {
  const o = official.find((s) => s.accountId === account.id && s.month === month);
  if (o) return { closingDate: o.closingDate, dueDate: o.dueDate };
  const closing = account.card?.closingDay || 1;
  const due = account.card?.dueDay || closing;
  const closingMonth = due > closing ? month : addMonths(month, -1);
  return { closingDate: dateInMonth(closingMonth, closing), dueDate: dateInMonth(month, due) };
}

/** Em qual fatura cai uma compra: a primeira cujo fechamento é posterior à data. */
export function statementMonthFor(account: AccountView, date: string, official: StatementView[]): string {
  const known = official.filter((s) => s.accountId === account.id).sort((a, b) => a.closingDate.localeCompare(b.closingDate));
  const hit = known.find((s) => date < s.closingDate);
  if (hit) return hit.month;
  const closing = account.card?.closingDay || 1;
  const due = account.card?.dueDay || closing;
  let closingMonth = date.slice(0, 7);
  if (day(date) >= closing) closingMonth = addMonths(closingMonth, 1);
  return due > closing ? closingMonth : addMonths(closingMonth, 1);
}

const isPayment = (m: Movement) => m.amount > 0 && (m.type === "CARD_PAYMENT" || m.type === "TRANSFER");

export function cardSummary(
  account: AccountView,
  movements: Movement[],
  official: StatementView[],
  /** `today`: AAAA-MM-DD no fuso do usuário (`fmt.today()`). */
  options: { excludedFromCashback?: Set<string>; today: string },
): CardSummary {
  const today = options.today;
  const excluded = options.excludedFromCashback ?? new Set<string>();
  const own = movements.filter((m) => m.accountId === account.id && m.type !== "OPENING_BALANCE");
  const byMonth = new Map<string, StatementItem[]>();
  const payments: Movement[] = [];

  for (const m of own) {
    if (isPayment(m)) {
      payments.push(m);
      continue;
    }
    const month = m.statementMonth ?? statementMonthFor(account, m.date, official);
    const items = byMonth.get(month) ?? [];
    items.push({
      id: m.id,
      date: m.date,
      description: m.description,
      amount: -m.amount,
      categoryId: m.categoryId,
      installment: m.installment ? { number: m.installment.number, count: m.installment.count } : undefined,
      pending: m.status === "PENDING",
      tags: m.tags,
    });
    byMonth.set(month, items);
  }

  // Projeta parcelas futuras a partir da última parcela lançada de cada compra.
  const groups = new Map<string, Movement>();
  for (const m of own) {
    if (!m.installment) continue;
    const key = m.installment.groupId ?? `${m.description.toLowerCase()}|${m.installment.purchaseDate}|${m.installment.count}`;
    const last = groups.get(key);
    if (!last || m.installment.number > last.installment!.number) groups.set(key, m);
  }
  let futureInstallments = 0;
  for (const last of groups.values()) {
    const inst = last.installment!;
    const baseMonth = last.statementMonth ?? statementMonthFor(account, last.date, official);
    for (let k = inst.number + 1; k <= inst.count; k++) {
      const month = addMonths(baseMonth, k - inst.number);
      const items = byMonth.get(month) ?? [];
      items.push({
        id: `${last.id}-p${k}`,
        date: inst.purchaseDate,
        description: last.description,
        amount: -last.amount,
        categoryId: last.categoryId,
        installment: { number: k, count: inst.count },
        projected: true,
        tags: last.tags,
      });
      byMonth.set(month, items);
      futureInstallments += -last.amount;
    }
  }

  const months = [
    ...new Set([...byMonth.keys(), ...official.filter((s) => s.accountId === account.id).map((s) => s.month)]),
  ].sort();
  const statements: Statement[] = months.map((month) => {
    const { closingDate, dueDate } = statementDates(account, month, official);
    const items = (byMonth.get(month) ?? []).sort((a, b) => b.date.localeCompare(a.date));
    const itemsTotal = round(items.reduce((s, i) => s + i.amount, 0));
    const o = official.find((s) => s.accountId === account.id && s.month === month) ?? null;
    const nextClosing = statementDates(account, addMonths(month, 1), official).closingDate;
    const paid = payments
      .filter((p) => p.date >= closingDate && p.date < nextClosing)
      .map((p) => ({
        id: p.id,
        date: p.date,
        amount: p.amount,
        description: p.description,
        sourceAccountId: p.counterpartAccountId,
        pending: p.status === "PENDING" || p.tags.includes("a-confirmar"),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const paidTotal = round(paid.reduce((s, p) => s + p.amount, 0));
    const due = o?.total ?? itemsTotal;
    let status: StatementStatus;
    if (today < closingDate) status = "future";
    else if (paidTotal >= due - 0.01) status = "paid";
    else if (today > dueDate) status = "overdue";
    else status = "closed";
    const cashbackBase = Math.max(
      0,
      items.filter((i) => !i.categoryId || !excluded.has(i.categoryId)).reduce((s, i) => s + i.amount, 0),
    );
    return {
      month,
      closingDate,
      dueDate,
      status,
      items,
      itemsTotal,
      officialTotal: o?.total ?? null,
      payments: paid,
      paidTotal,
      expectedCashback: round(cashbackBase * (account.card?.cashbackRate ?? 0)),
    };
  });

  const balance = account.balances.reduce((s, b) => s + (b.base ?? b.current), 0);
  const outstanding = Math.max(0, -balance);
  const limit = account.card?.creditLimit ?? 0;
  const used = round(outstanding + futureInstallments);
  // A primeira fatura ainda não fechada é a atual (aberta); as seguintes são futuras.
  const current = statements.find((s) => s.status === "future") ?? null;
  if (current) current.status = "open";
  return {
    account,
    limit,
    outstanding: round(outstanding),
    futureInstallments: round(futureInstallments),
    used,
    available: round(limit - used),
    statements,
    current,
  };
}

export interface OpenInstallmentPlan {
  key: string;
  description: string;
  accountId: string;
  purchaseDate: string;
  number: number;
  count: number;
  installmentAmount: number;
  remaining: number;
  remainingAmount: number;
}

/** Compras parceladas com parcelas futuras, em qualquer cartão. */
export function openInstallmentPlans(movements: Movement[]): OpenInstallmentPlan[] {
  const groups = new Map<string, Movement>();
  for (const m of movements) {
    if (!m.installment) continue;
    const key = `${m.accountId}|${m.installment.groupId ?? `${m.description.toLowerCase()}|${m.installment.purchaseDate}|${m.installment.count}`}`;
    const last = groups.get(key);
    if (!last || m.installment.number > last.installment!.number) groups.set(key, m);
  }
  return [...groups.entries()]
    .map(([key, last]) => {
      const remaining = last.installment!.count - last.installment!.number;
      const installmentAmount = Math.abs(last.baseAmount ?? last.amount);
      return {
        key,
        description: last.description,
        accountId: last.accountId,
        purchaseDate: last.installment!.purchaseDate,
        number: last.installment!.number,
        count: last.installment!.count,
        installmentAmount,
        remaining,
        remainingAmount: remaining * installmentAmount,
      };
    })
    .filter((p) => p.remaining > 0)
    .sort((a, b) => b.remainingAmount - a.remainingAmount);
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
