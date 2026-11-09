import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { previewImport } from "@/lib/finance/import-service";
import { stringValue } from "@/lib/validation";

/** { accountId, assetId, fileName, content } → linhas classificadas e duplicidades. Não grava. */
export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const b = await body(request);
    return previewImport(userId, {
      accountId: stringValue(b.accountId, "accountId", 40),
      assetId: stringValue(b.assetId, "assetId", 40),
      fileName: stringValue(b.fileName, "fileName", 200),
      content: stringValue(b.content, "content", 5_000_000),
    });
  });
}
