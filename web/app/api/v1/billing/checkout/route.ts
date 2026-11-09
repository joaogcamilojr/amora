import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { createCheckout } from "@/lib/finance/billing";

/** `{ plan: "START"|"PREMIUM"|"FAMILY", interval?: "MONTH"|"YEAR" }` → `{ url }` do Stripe Checkout. */
export async function POST(request: NextRequest) {
  return withUser(
    async (userId) => createCheckout(userId, await body(request)),
    201,
  );
}
