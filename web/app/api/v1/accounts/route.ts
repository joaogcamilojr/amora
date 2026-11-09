import { NextRequest } from "next/server";

import { createAccount } from "@/lib/account-service";
import { accountAccessWhere } from "@/lib/auth/access";
import { getAccountTypeConfiguration } from "@/lib/accounts/account-types";
import { getSession } from "@/lib/auth/session";
import { accountHouseholdData } from "@/lib/finance/households";
import { caughtError, unauthorizedResponse } from "@/lib/finance/api";
import { jsonData } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  cardInput,
  parseCreateAccountInput,
  parseOpeningBalances,
  publicAccount,
  ValidationError,
} from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const accounts = await prisma.accounts.findMany({
    where: accountAccessWhere(session.user_id),
    orderBy: { updated_at: "desc" },
    include: { balances: { include: { asset: true } }, card_profile: true },
  });
  return jsonData(accounts.map(publicAccount));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseCreateAccountInput(body);
    if (!input.type)
      throw new ValidationError("VALIDATION_ERROR", "errors.fieldRequired", {
        field: "type",
      });
    const assets = await prisma.assets.findMany({
      where: { active: true },
      select: { id: true, code: true, decimals: true, type: true },
    });
    const openings = parseOpeningBalances(
      body.openingBalances,
      assets,
      input.type,
    );
    const card = cardInput(
      body,
      getAccountTypeConfiguration(input.type),
      assets,
    );
    const household = await accountHouseholdData(session.user_id, body);
    const account = await createAccount(
      session.user_id,
      { ...input, ...household, type: input.type },
      card,
      openings,
    );
    return jsonData(publicAccount(account), 201);
  } catch (error) {
    const code =
      error instanceof ValidationError ? error.code : "VALIDATION_ERROR";
    return caughtError(
      session.user_id,
      code === "DUPLICATE_ASSET" ? 409 : 400,
      code,
      error,
      "errors.codes.VALIDATION_ERROR",
    );
  }
}
