import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { createHolding } from "@/lib/finance/crud";
import { loadFinance } from "@/lib/finance/load";

export async function GET() {
  return withUser(async (userId) => (await loadFinance(userId)).holdings);
}

export async function POST(request: NextRequest) {
  return withUser(async (userId) => createHolding(userId, await body(request)), 201);
}
