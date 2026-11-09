import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { addHolder } from "@/lib/finance/households";

/** Adiciona um titular sem login (ADMIN). Corpo: `displayName`. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withUser(async (userId) => addHolder(userId, (await params).id, await body(request)), 201);
}
