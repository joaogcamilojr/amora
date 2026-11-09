import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { updateCategory } from "@/lib/finance/crud";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return withUser(async (userId) =>
    updateCategory(userId, id, await body(request)),
  );
}
