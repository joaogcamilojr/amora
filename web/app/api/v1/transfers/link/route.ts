import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { linkTransfer } from "@/lib/finance/ledger";
import { stringValue } from "@/lib/validation";

/** Une duas pontas importadas: { firstId, secondId } (ids de LedgerTransaction). */
export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const b = await body(request);
    return linkTransfer(userId, stringValue(b.firstId, "firstId", 40), stringValue(b.secondId, "secondId", 40));
  });
}
