import type { NextRequest } from "next/server";

import { isCronAuthorized } from "@/lib/auth/cron";
import { unauthorizedResponse } from "@/lib/finance/api";
import { processDueDeletions } from "@/lib/finance/privacy-deletion";
import { jsonData } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Job diário: anonimiza os pedidos de exclusão vencidos. `Authorization: Bearer $CRON_SECRET`. */
async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) return unauthorizedResponse();
  return jsonData(await processDueDeletions());
}

export const GET = run;
export const POST = run;
