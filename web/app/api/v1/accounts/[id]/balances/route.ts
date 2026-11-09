import { NextRequest } from "next/server";

import { addAccountBalance } from "@/lib/account-service";
import { getSession } from "@/lib/auth/session";
import { caughtError, unauthorizedResponse } from "@/lib/finance/api";
import { jsonData } from "@/lib/http";
import {
  parseAddAccountBalanceInput,
  publicAccount,
  ValidationError,
} from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, context: Context) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const { id } = await context.params;
  try {
    const input = parseAddAccountBalanceInput(
      (await request.json()) as Record<string, unknown>,
    );
    const account = await addAccountBalance(
      session.user_id,
      id,
      input.assetId,
      input.amount,
      input.occurredAt,
    );
    return jsonData(publicAccount(account), 201);
  } catch (error) {
    const code =
      error instanceof ValidationError
        ? error.code
        : error instanceof Error
          ? error.message
          : "VALIDATION_ERROR";
    const status =
      code === "FORBIDDEN"
        ? 403
        : ["CONFLICT", "ACCOUNT_ARCHIVED"].includes(code)
          ? 409
          : 400;
    return caughtError(
      session.user_id,
      status,
      code,
      error,
      "errors.accounts.addBalanceFailed",
    );
  }
}
