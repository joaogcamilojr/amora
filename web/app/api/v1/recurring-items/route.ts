import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { createRecurring } from "@/lib/finance/crud";
import { loadFinance } from "@/lib/finance/load";

export async function GET() {
  return withUser(async (userId) => (await loadFinance(userId)).recurring);
}

export async function POST(request: NextRequest) {
  return withUser(async (userId) => createRecurring(userId, await body(request)), 201);
}
