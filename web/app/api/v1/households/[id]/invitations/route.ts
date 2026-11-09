import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { inviteMember } from "@/lib/finance/households";

/** Convida por e-mail (ADMIN). Corpo: `email`, `role`. Devolve `acceptPath` uma única vez. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withUser(async (userId) => inviteMember(userId, (await params).id, await body(request)), 201);
}
