import { withUser } from "@/lib/finance/api";
import { loadFinance } from "@/lib/finance/load";
import { cardSummaries } from "@/lib/finance/views";
import { i18nForUser } from "@/lib/i18n/server";

/** Resumo de cada cartão: limite, faturas (itens + pagamentos), status e cashback estimado. */
export async function GET() {
  return withUser(async (userId) => {
    const { fmt } = await i18nForUser(userId);
    return cardSummaries(await loadFinance(userId), fmt.today());
  });
}
