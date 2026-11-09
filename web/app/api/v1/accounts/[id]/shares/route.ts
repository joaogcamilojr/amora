import { AccountMemberRole } from "@prisma/client";
import { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";
import {
  caughtError,
  localizedError,
  unauthorizedResponse,
} from "@/lib/finance/api";
import { jsonData } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { emailValue, enumValue } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const { id } = await params;
  const account = await prisma.accounts.findFirst({
    where: { id, owner_id: session.user_id, status: "ACTIVE" },
  });
  if (!account)
    return localizedError(
      session.user_id,
      403,
      "FORBIDDEN",
      "errors.accounts.onlyOwnerCanShare",
    );
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = emailValue(body.email);
    const role = enumValue(
      body.role,
      [AccountMemberRole.VIEWER, AccountMemberRole.TRANSACTION_MANAGER],
      "role",
    );
    const invitedUser = await prisma.users.findUnique({ where: { email } });
    if (invitedUser) {
      await prisma.account_members.upsert({
        where: {
          account_id_user_id: { account_id: id, user_id: invitedUser.id },
        },
        create: { account_id: id, user_id: invitedUser.id, role },
        update: { role },
      });
      return jsonData({ accepted: true, email, role }, 201);
    }
    const invitation = await prisma.account_share_invitations.create({
      data: {
        account_id: id,
        invited_by_user_id: session.user_id,
        email,
        role,
        expires_at: new Date(Date.now() + 7 * 86400000),
      },
    });
    return jsonData(
      {
        ...invitation,
        createdAt: invitation.created_at.toISOString(),
        expiresAt: invitation.expires_at.toISOString(),
        updatedAt: invitation.updated_at.toISOString(),
      },
      201,
    );
  } catch (error) {
    return caughtError(
      session.user_id,
      400,
      "VALIDATION_ERROR",
      error,
      "errors.accounts.invalidInvitation",
    );
  }
}
