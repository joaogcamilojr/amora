import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { confirmImport, type ConfirmRow } from "@/lib/finance/import-service";
import { stringValue } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const b = await body(request);
    return confirmImport(userId, {
      accountId: stringValue(b.accountId, "accountId", 40),
      assetId: stringValue(b.assetId, "assetId", 40),
      fileName: stringValue(b.fileName, "fileName", 200),
      format: b.format === "ofx" ? "ofx" : "csv",
      rows: (Array.isArray(b.rows) ? b.rows : []) as ConfirmRow[],
    });
  }, 201);
}
