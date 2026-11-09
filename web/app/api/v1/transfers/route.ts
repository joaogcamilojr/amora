import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { createTransfer, type TransferInput } from "@/lib/finance/ledger";

/** Transferência, câmbio ou pagamento de fatura entre contas do usuário (duas pernas). */
export async function POST(request: NextRequest) {
  return withUser(async (userId) => createTransfer(userId, (await body(request)) as unknown as TransferInput), 201);
}
