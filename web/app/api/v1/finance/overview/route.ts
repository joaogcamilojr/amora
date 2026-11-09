import type { NextRequest } from "next/server";

import { withUser } from "@/lib/finance/api";
import { loadFinance } from "@/lib/finance/load";
import { overview } from "@/lib/finance/views";
import { i18nForUser } from "@/lib/i18n/server";

/** Visão geral: patrimônio, mês, categorias, cartões, recorrentes e pendências de revisão. */
export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month") ?? undefined;
  return withUser(async (userId) => {
    const { fmt } = await i18nForUser(userId);
    return overview(await loadFinance(userId), month, fmt.today());
  });
}
