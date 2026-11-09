import { NextRequest } from "next/server";

import { accountAccessWhere } from "@/lib/auth/access";
import { getSession } from "@/lib/auth/session";
import { localizedError, unauthorizedResponse } from "@/lib/finance/api";
import { jsonData } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const { id } = await params;
  const accessible = await prisma.accounts.findFirst({
    where: { id, ...accountAccessWhere(session.user_id) },
    select: { id: true },
  });
  if (!accessible)
    return localizedError(
      session.user_id,
      403,
      "FORBIDDEN",
      "errors.accounts.noAccess",
    );
  return jsonData(
    await prisma.account_members.findMany({
      where: { account_id: id },
      include: {
        user: { select: { id: true, email: true, display_name: true } },
      },
    }),
  );
}
