import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { deactivateRecurring, updateRecurring } from "@/lib/finance/crud";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return withUser(async (userId) => updateRecurring(userId, id, await body(request)));
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  return withUser((userId) => deactivateRecurring(userId, id));
}
