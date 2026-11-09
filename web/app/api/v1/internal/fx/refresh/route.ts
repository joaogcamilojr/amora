import type { NextRequest } from "next/server";

import { isCronAuthorized } from "@/lib/auth/cron";
import { backfillRates, refreshRates } from "@/lib/finance/fx-rates";
import { localizeError, unauthorizedResponse } from "@/lib/finance/api";
import { jsonData, jsonError } from "@/lib/http";
import { i18nForUser } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/**
 * Job diário de cotações. Autenticado por `Authorization: Bearer $CRON_SECRET` (formato do Vercel Cron).
 * `?date=AAAA-MM-DD` busca um dia; `?days=N` (até 31) preenche os últimos N dias.
 */
async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) return unauthorizedResponse();
  const params = request.nextUrl.searchParams;
  try {
    if (params.has("days")) return jsonData(await backfillRates(Number(params.get("days"))));
    return jsonData(await refreshRates(params.get("date") ?? undefined));
  } catch (error) {
    const { t } = await i18nForUser(null);
    return jsonError(500, "FX_REFRESH_FAILED", localizeError(error, t));
  }
}

export const GET = run;
export const POST = run;
