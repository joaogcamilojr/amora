import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { getPreferences, updatePreferences } from "@/lib/preferences";

/** Preferências do usuário logado. */
export async function GET() {
  return withUser((userId) => getPreferences(userId));
}

/** Atualiza idioma (`locale`), fuso (`timeZone`), moeda-base (`baseCurrency`) e nome (`displayName`). */
export async function PATCH(request: NextRequest) {
  return withUser(async (userId) => updatePreferences(userId, await body(request)));
}
