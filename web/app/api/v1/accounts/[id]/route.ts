import { NextRequest } from "next/server";

import { accountDetailsForForm } from "@/lib/account-service";
import { accountAccessWhere } from "@/lib/auth/access";
import { getAccountTypeConfiguration } from "@/lib/accounts/account-types";
import { getSession } from "@/lib/auth/session";
import { accountHouseholdData } from "@/lib/finance/households";
import {
  caughtError,
  localizedError,
  unauthorizedResponse,
} from "@/lib/finance/api";
import { jsonData } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  cardInput,
  parseUpdateAccountInput,
  publicAccount,
  ValidationError,
} from "@/lib/validation";
import { AccountMemberRole } from "@prisma/client";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const { id } = await context.params;
  const access = await accountDetailsForForm(session.user_id, id);
  return access
    ? jsonData({
        ...publicAccount(access.account),
        permissions: {
          canEdit: access.role === AccountMemberRole.OWNER,
          canAddBalance:
            access.role === AccountMemberRole.OWNER &&
            access.account.status === "ACTIVE",
        },
      })
    : localizedError(
        session.user_id,
        404,
        "RESOURCE_NOT_FOUND",
        "errors.accounts.notFound",
      );
}

export async function PATCH(request: NextRequest, context: Context) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const { id } = await context.params;
  const access = await accountDetailsForForm(session.user_id, id);
  if (!access || access.role !== AccountMemberRole.OWNER)
    return localizedError(
      session.user_id,
      403,
      "FORBIDDEN",
      "errors.accounts.onlyOwnerCanEdit",
    );
  try {
    if (access.account.status !== "ACTIVE")
      return localizedError(
        session.user_id,
        409,
        "ACCOUNT_ARCHIVED",
        "errors.accounts.archivedNotEditable",
      );
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseUpdateAccountInput(body, access.account.type);
    const assets = await prisma.assets.findMany({
      where: { active: true },
      select: { id: true, type: true },
    });
    const card = cardInput(
      body,
      getAccountTypeConfiguration(access.account.type),
      assets,
      false,
    );
    if (card?.payment_account_id) {
      const payer = await prisma.accounts.findFirst({
        where: {
          id: card.payment_account_id,
          ...accountAccessWhere(session.user_id),
        },
        select: { id: true },
      });
      if (!payer || payer.id === id)
        throw new ValidationError(
          "INVALID_CARD_PROFILE",
          "errors.card.invalidPaymentAccount",
        );
    }
    const household = await accountHouseholdData(
      session.user_id,
      body,
      access.account,
    );
    const account = await prisma.accounts.update({
      where: { id },
      data: {
        ...input,
        ...household,
        card_profile:
          card === undefined
            ? undefined
            : card
              ? { upsert: { create: card, update: card } }
              : { delete: true },
      },
      include: { balances: { include: { asset: true } }, card_profile: true },
    });
    return jsonData(publicAccount(account));
  } catch (error) {
    const code =
      error instanceof ValidationError ? error.code : "VALIDATION_ERROR";
    return caughtError(
      session.user_id,
      code === "CONFLICT" ? 409 : 400,
      code,
      error,
      "errors.codes.VALIDATION_ERROR",
    );
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const { id } = await context.params;
  try {
    const { deleteEmptyAccount } = await import("@/lib/account-service");
    await deleteEmptyAccount(session.user_id, id);
    return jsonData({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "VALIDATION_ERROR";
    return caughtError(
      session.user_id,
      message === "ACCOUNT_NOT_EMPTY"
        ? 409
        : message === "FORBIDDEN"
          ? 403
          : 400,
      message,
      error,
    );
  }
}
