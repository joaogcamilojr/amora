import type { NextRequest } from "next/server";

import { withUser } from "@/lib/finance/api";
import { loadFinance } from "@/lib/finance/load";
import { publicFinance } from "@/lib/finance/views";

/**
 * Snapshot financeiro do usuário: o mesmo `FinanceData` que as telas do web carregam no servidor
 * (contas com saldos e conversão para a moeda-base, lançamentos, categorias, faturas oficiais, recorrentes,
 * bens, viagens, cotações e titulares). Somente leitura; usado pelo app mobile.
 * `?holder=<idDoMembro>|none` filtra por titular, como `?holder=` nas telas.
 */
export async function GET(request: NextRequest) {
  const holder = request.nextUrl.searchParams.get("holder") ?? undefined;
  return withUser(async (userId) =>
    publicFinance(await loadFinance(userId, { holder })),
  );
}
