import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { archiveHolding, updateHolding } from "@/lib/finance/crud";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return withUser(async (userId) => updateHolding(userId, id, await body(request)));
}

/** Arquiva (archivedAt); não apaga. */
export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  return withUser((userId) => archiveHolding(userId, id));
}
