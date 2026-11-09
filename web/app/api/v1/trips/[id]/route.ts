import type { NextRequest } from "next/server";

import { withUser } from "@/lib/finance/api";
import { deleteTrip } from "@/lib/finance/crud";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  return withUser(async (userId) => {
    await deleteTrip(userId, id);
    return { deleted: true };
  });
}
