import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { completeOnboarding, getOnboardingState, previewPack } from "@/lib/finance/onboarding";

/** Estado do primeiro acesso; com `countryCode` (e `locale` opcional) devolve também a prévia do pacote. */
export async function GET(request: NextRequest) {
  return withUser(async (userId) => {
    const params = request.nextUrl.searchParams;
    const country = params.get("countryCode");
    return {
      ...(await getOnboardingState(userId)),
      ...(country ? { pack: await previewPack(userId, country, params.get("locale")) } : {}),
    };
  });
}

/** Conclui o onboarding: país, preferências e pacote inicial (`applyCategories`, `applyRules`). */
export async function POST(request: NextRequest) {
  return withUser(async (userId) => completeOnboarding(userId, await body(request)));
}
