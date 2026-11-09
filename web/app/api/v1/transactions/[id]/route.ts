import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { deleteTransaction, updateTransaction, type TransactionPatch } from "@/lib/finance/ledger";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return withUser(async (userId) => updateTransaction(userId, id, (await body(request)) as TransactionPatch));
}

/** Exclusão lógica (deletedAt). */
export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  return withUser(async (userId) => {
    await deleteTransaction(userId, id);
    return { deleted: true };
  });
}
