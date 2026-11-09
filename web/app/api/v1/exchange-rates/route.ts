import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { createRate } from "@/lib/finance/crud";
import { baseAssetCode } from "@/lib/finance/load";
import { prisma } from "@/lib/prisma";

/** Cotações visíveis ao usuário: de provedor (globais) e as dele (manual, fatura, extrato). */
export async function GET() {
  return withUser((userId) =>
    prisma.exchange_rates.findMany({
      where: {
        stale: false,
        OR: [{ source: "PROVIDER" }, { owner_id: userId }],
      },
      orderBy: { provider_timestamp: "desc" },
      take: 200,
      include: {
        from_asset: { select: { code: true } },
        to_asset: { select: { code: true } },
      },
    }),
  );
}

/** Cotação manual: { from: "USD", to?: "<moeda>" (padrão: moeda-base do usuário), rate: "5.40", date?: "AAAA-MM-DD" }. */
export async function POST(request: NextRequest) {
  return withUser(
    async (userId) =>
      createRate(userId, await body(request), await baseAssetCode(userId)),
    201,
  );
}
