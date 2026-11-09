import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { acceptInvitation } from "@/lib/finance/households";

/** Aceita um convite. Corpo: `token`. O token precisa ser do e-mail do usuário logado. */
export async function POST(request: NextRequest) {
  return withUser(async (userId) => acceptInvitation(userId, await body(request)));
}
