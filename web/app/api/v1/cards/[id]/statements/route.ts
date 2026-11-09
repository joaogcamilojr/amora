import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { upsertStatement } from "@/lib/finance/crud";

type Context = { params: Promise<{ id: string }> };

/** Grava total e datas oficiais da fatura: { month: "AAAA-MM", closingDate, dueDate, total, source }. */
export async function PUT(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return withUser(async (userId) =>
    upsertStatement(userId, id, await body(request)),
  );
}
