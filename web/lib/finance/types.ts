import type {
  AccountStatus,
  AccountType,
  CardType,
  CategoryKind,
  HoldingClass,
  LedgerTransactionType,
  RecurrenceFrequency,
  TransactionStatus,
} from "@prisma/client";

/**
 * View models do domínio financeiro (números JS, datas civis "AAAA-MM-DD").
 * O banco guarda Decimal(38,18); a conversão para number acontece só na leitura para exibição/análise.
 * Escritas sempre recebem strings decimais e usam Prisma.Decimal (ver lib/money).
 */

export interface AssetView {
  id: string;
  code: string;
  symbol: string;
  decimals: number;
}

export interface CardView {
  closingDay: number | null;
  dueDay: number | null;
  creditLimit: number | null;
  cashbackRate: number;
  paymentAccountId: string | null;
  lastFour: string | null;
  type: CardType;
  brand: string | null;
  limitAssetId: string | null;
}

export interface BalanceView {
  id: string;
  asset: AssetView;
  current: number;
  /** Valor convertido para a moeda-base; null quando não há cotação. */
  base: number | null;
}

export interface AccountView {
  id: string;
  name: string;
  type: AccountType;
  status: AccountStatus;
  institutionName: string | null;
  countryCode: string | null;
  holderName: string | null;
  householdId: string | null;
  holderMemberId: string | null;
  notes: string | null;
  includeInNetWorth: boolean;
  isOwner: boolean;
  canPost: boolean;
  card: CardView | null;
  balances: BalanceView[];
  monthlyYieldRate: number | null;
  annualYieldRate: number | null;
  lastMovementDate: string | null;
}

export interface Installment {
  number: number;
  count: number;
  purchaseDate: string;
  groupId: string | null;
}

/** Uma perna (LedgerEntry) de um lançamento, com sinal: crédito +, débito −. */
export interface Movement {
  id: string;
  transactionId: string;
  date: string;
  accountId: string;
  assetCode: string;
  amount: number;
  /** Valor na moeda-base com sinal; null se não houver cotação. */
  baseAmount: number | null;
  type: LedgerTransactionType;
  status: TransactionStatus;
  categoryId: string | null;
  description: string;
  originalDescription: string | null;
  tags: string[];
  installment: Installment | null;
  /** Mês (AAAA-MM) da fatura oficial vinculada, quando houver. */
  statementMonth: string | null;
  /** Outra conta envolvida (transferência, pagamento de fatura, câmbio). */
  counterpartAccountId: string | null;
  fxFeeBase: number;
}

export interface CategoryView {
  id: string;
  slug: string;
  name: string;
  kind: CategoryKind;
}

export interface StatementView {
  id: string;
  accountId: string;
  month: string;
  closingDate: string;
  dueDate: string;
  total: number | null;
  source: string;
}

export interface RecurringView {
  id: string;
  description: string;
  kind: CategoryKind;
  categoryId: string | null;
  accountId: string | null;
  assetCode: string;
  amount: number;
  frequency: RecurrenceFrequency;
  dayOfMonth: number | null;
  monthOfYear: number | null;
  variableDay: boolean;
  active: boolean;
  notes: string | null;
}

export interface HoldingView {
  id: string;
  name: string;
  class: HoldingClass;
  assetCode: string;
  value: number;
  base: number | null;
  quantity: number | null;
  ticker: string | null;
  countryCode: string | null;
  holderName: string | null;
  holderMemberId: string | null;
  valuedAt: string;
}

export interface TripView {
  id: string;
  name: string;
  tag: string;
  startsOn: string | null;
  endsOn: string | null;
  countryCodes: string[];
}

export const INCOME_TYPES: LedgerTransactionType[] = [
  "INCOME",
  "INTEREST_INCOME",
  "REFUND",
];
export const EXPENSE_TYPES: LedgerTransactionType[] = ["EXPENSE", "FEE"];

export function isIncome(type: LedgerTransactionType) {
  return INCOME_TYPES.includes(type);
}

export function isExpense(type: LedgerTransactionType) {
  return EXPENSE_TYPES.includes(type);
}

/** Receita/despesa entram nos indicadores; transferências, câmbio, investimento e pagamento de fatura não. */
export function isResult(type: LedgerTransactionType) {
  return isIncome(type) || isExpense(type);
}

/** Tipos que o usuário escolhe ao editar um lançamento. */
export const EDITABLE_TYPES: LedgerTransactionType[] = [
  "INCOME",
  "EXPENSE",
  "TRANSFER",
  "INVESTMENT",
  "ADJUSTMENT",
  "REFUND",
  "FEE",
  "INTEREST_INCOME",
];
