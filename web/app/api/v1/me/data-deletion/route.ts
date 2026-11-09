import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { cancelDeletion, getDeletionStatus, requestDeletion } from "@/lib/finance/privacy-deletion";

/** Situação do pedido de exclusão: `{ graceDays, pending: { requestedAt, scheduledFor } | null, sharedAccounts }`. */
export async function GET() {
  return withUser((userId) => getDeletionStatus(userId));
}

/** Pede a exclusão: `{ confirmEmail }` (o próprio e-mail). Carência de 30 dias; depois a conta é anonimizada. */
export async function POST(request: NextRequest) {
  return withUser(async (userId) => requestDeletion(userId, await body(request)), 201);
}

/** Cancela o pedido pendente. */
export async function DELETE() {
  return withUser((userId) => cancelDeletion(userId));
}
