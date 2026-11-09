import type {
  LedgerEntryDirection,
  LedgerTransactionType,
} from "@prisma/client";

export function normalize(text: string): string {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Remove ruído de extrato (prefixos do Inter, cidade/país no fim). */
export function cleanDescription(description: string): string {
  return description
    .replace(/Compra No Debito: "No Estabelecimento /i, "")
    .replace(
      /\s+(Tres Coracoes|Belo Horizont|Guarulhos|Varginha|Oliveira|Pouso Alegre|Osasco)?\s*Bra"?$/i,
      "",
    )
    .replace(/^"+|"+$/g, "")
    .trim();
}

export interface Rule {
  priority: number;
  pattern: string;
  transactionType: LedgerTransactionType;
  direction: LedgerEntryDirection | null;
  categoryId: string | null;
  counterparty: string | null;
  tags: string[];
}

export interface Classification {
  type: LedgerTransactionType;
  categoryId: string | null;
  counterparty: string | null;
  tags: string[];
}

const NEEDS_CATEGORY: LedgerTransactionType[] = [
  "INCOME",
  "EXPENSE",
  "REFUND",
  "FEE",
  "INTEREST_INCOME",
];

export function needsCategory(type: LedgerTransactionType) {
  return NEEDS_CATEGORY.includes(type);
}

/**
 * Aplica as regras (regex sobre a descrição normalizada), em ordem de prioridade, respeitando o sentido.
 * Regras com `direction` só valem para entrada (CREDIT) ou saída (DEBIT).
 * Sem regra: entrada vira receita com `fallbackIncome`, saída vira despesa com `fallbackExpense`.
 */
export function classify(
  description: string,
  direction: LedgerEntryDirection,
  rules: Rule[],
  fallback: { income: string | null; expense: string | null },
): Classification {
  const target = normalize(description);
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  for (const rule of sorted) {
    if (rule.direction && rule.direction !== direction) continue;
    let match = false;
    try {
      match = new RegExp(rule.pattern, "i").test(target);
    } catch {
      continue;
    }
    if (!match) continue;
    let type = rule.transactionType;
    // Regra de despesa que casou numa entrada = estorno/cashback; regra de receita numa saída = despesa.
    if (type === "EXPENSE" && direction === "CREDIT") type = "REFUND";
    if (type === "INCOME" && direction === "DEBIT") type = "EXPENSE";
    return {
      type,
      categoryId: needsCategory(type)
        ? (rule.categoryId ??
          (direction === "CREDIT" ? fallback.income : fallback.expense))
        : null,
      counterparty: rule.counterparty,
      tags: rule.tags,
    };
  }
  return direction === "CREDIT"
    ? {
        type: "INCOME",
        categoryId: fallback.income,
        counterparty: null,
        tags: [],
      }
    : {
        type: "EXPENSE",
        categoryId: fallback.expense,
        counterparty: null,
        tags: [],
      };
}

/** Chave estável para detectar duplicidade na importação (quando o banco não traz id). */
export function dedupeKey(
  accountId: string,
  date: string,
  signedAmount: string,
  description: string,
): string {
  return [
    "k",
    accountId,
    date,
    signedAmount,
    normalize(description).slice(0, 40),
  ].join("|");
}
