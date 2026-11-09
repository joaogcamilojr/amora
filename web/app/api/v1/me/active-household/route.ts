import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { setActiveHousehold } from "@/lib/finance/households";

/** Troca o workspace ativo. Corpo: `householdId` (null = todas as contas). */
export async function PUT(request: NextRequest) {
  return withUser(async (userId) => setActiveHousehold(userId, await body(request)));
}
