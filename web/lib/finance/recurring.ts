import type { RecurrenceFrequency } from "@prisma/client";

import type { Formatter, Translator } from "@/lib/i18n";

import type { RecurringView } from "./types";

const STEP: Record<RecurrenceFrequency, number> = {
  MONTHLY: 1,
  BIMONTHLY: 2,
  QUARTERLY: 3,
  SEMIANNUAL: 6,
  YEARLY: 12,
};

export function monthlyEquivalent(
  item: Pick<RecurringView, "amount" | "frequency">,
): number {
  return item.amount / STEP[item.frequency];
}

/** Quando a recorrência cai, no idioma do usuário: "Todo dia 8", "07/jan", "Variável", "A definir". */
export function whenLabel(
  item: RecurringView,
  t: Translator,
  fmt: Formatter,
): string {
  if (item.variableDay) return t("recurring.when.variable");
  if (!item.dayOfMonth) return t("recurring.when.toBeDefined");
  if (item.frequency === "MONTHLY")
    return t("recurring.when.monthly", { day: String(item.dayOfMonth) });
  const day = String(item.dayOfMonth).padStart(2, "0");
  if (!item.monthOfYear)
    return t("recurring.when.day", { day: String(item.dayOfMonth) });
  if (item.frequency === "YEARLY")
    return t("recurring.when.yearly", {
      day,
      month: fmt.monthAbbr(item.monthOfYear),
    });
  const step = STEP[item.frequency];
  const months: string[] = [];
  for (
    let m = item.monthOfYear;
    months.length < 12 / step;
    m = ((m - 1 + step) % 12) + 1
  )
    months.push(fmt.monthAbbr(m));
  return t("recurring.when.periodic", { day, months: months.join(", ") });
}

/**
 * Próxima data prevista (AAAA-MM-DD) a partir de `today`; null sem dia definido.
 * `today` vem de `fmt.today()` (fuso do usuário).
 */
export function nextDate(item: RecurringView, today: string): string | null {
  if (!item.dayOfMonth || item.variableDay) return null;
  const [ty, tm] = today.split("-").map(Number);
  const step = STEP[item.frequency];
  for (let i = 0; i <= 24; i++) {
    const total = ty * 12 + (tm - 1) + i;
    const year = Math.floor(total / 12);
    const month = (total % 12) + 1;
    if (
      step > 1 &&
      item.monthOfYear &&
      (month - item.monthOfYear + 12) % step !== 0
    )
      continue;
    const last = new Date(year, month, 0).getDate();
    const date = `${year}-${String(month).padStart(2, "0")}-${String(Math.min(item.dayOfMonth, last)).padStart(2, "0")}`;
    if (date >= today) return date;
  }
  return null;
}
