import { AccountMemberRole } from "@prisma/client";
import { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";
import { localizedError, unauthorizedResponse } from "@/lib/finance/api";
import { jsonData } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { enumValue } from "@/lib/validation";

type Context = { params: Promise<{ id: string; memberId: string }> };
async function owner(userId: string, accountId: string) {
  return prisma.accounts.findFirst({
    where: { id: accountId, owner_id: userId, status: "ACTIVE" },
  });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const { id, memberId } = await params;
  if (!(await owner(session.user_id, id)))
    return localizedError(
      session.user_id,
      403,
      "FORBIDDEN",
      "errors.accounts.onlyOwnerCanChangeMembers",
    );
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const role = enumValue(
      body.role,
      [AccountMemberRole.VIEWER, AccountMemberRole.TRANSACTION_MANAGER],
      "role",
    );
    const member = await prisma.account_members.findFirst({
      where: { id: memberId, account_id: id },
    });
    if (!member || member.role === AccountMemberRole.OWNER)
      return localizedError(
        session.user_id,
        404,
        "RESOURCE_NOT_FOUND",
        "errors.accounts.memberNotFound",
      );
    return jsonData(
      await prisma.account_members.update({
        where: { id: member.id },
        data: { role },
      }),
    );
  } catch {
    return localizedError(
      session.user_id,
      404,
      "RESOURCE_NOT_FOUND",
      "errors.accounts.memberNotFound",
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const { id, memberId } = await params;
  if (!(await owner(session.user_id, id)))
    return localizedError(
      session.user_id,
      403,
      "FORBIDDEN",
      "errors.accounts.onlyOwnerCanRevokeMembers",
    );
  try {
    const member = await prisma.account_members.findFirst({
      where: { id: memberId, account_id: id },
    });
    if (!member)
      return localizedError(
        session.user_id,
        404,
        "RESOURCE_NOT_FOUND",
        "errors.accounts.memberNotFound",
      );
    if (member.role === AccountMemberRole.OWNER)
      return localizedError(
        session.user_id,
        409,
        "OWNER_REQUIRED",
        "errors.accounts.ownerCannotBeRemoved",
      );
    await prisma.account_members.delete({ where: { id: member.id } });
    return jsonData({ revoked: true });
  } catch {
    return localizedError(
      session.user_id,
      404,
      "RESOURCE_NOT_FOUND",
      "errors.accounts.memberNotFound",
    );
  }
}
