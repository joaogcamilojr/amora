import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { createTransaction, type NewTransactionInput } from "@/lib/finance/ledger";
import { loadFinance } from "@/lib/finance/load";
import { filterMovements } from "@/lib/finance/views";

/** Lista movimentos (uma linha por perna) com filtros: month, accountId, categoryId (_none), type, tag, q, pending. */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  return withUser(async (userId) => {
    const data = await loadFinance(userId);
    const rows = filterMovements(data.movements, {
      month: p.get("month"),
      accountId: p.get("accountId"),
      categoryId: p.get("categoryId"),
      type: p.get("type"),
      tag: p.get("tag"),
      q: p.get("q"),
      pending: p.get("pending") === "true",
    });
    const limit = Math.min(Number(p.get("limit") ?? 500) || 500, 5000);
    return { baseCode: data.baseCode, total: rows.length, items: rows.slice(0, limit) };
  });
}

export async function POST(request: NextRequest) {
  return withUser(async (userId) => createTransaction(userId, (await body(request)) as unknown as NewTransactionInput), 201);
}
