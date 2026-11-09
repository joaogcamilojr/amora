import { AccountStatus } from "@prisma/client";
import { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";
import { localizedError, unauthorizedResponse } from "@/lib/finance/api";
import { jsonData } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const { id } = await params;
  const account = await prisma.accounts.findFirst({
    where: { id, owner_id: session.user_id, status: AccountStatus.ARCHIVED },
  });
  if (!account)
    return localizedError(
      session.user_id,
      403,
      "FORBIDDEN",
      "errors.accounts.onlyOwnerCanRestore",
    );
  return jsonData(
    await prisma.accounts.update({
      where: { id },
      data: { status: AccountStatus.ACTIVE, archived_at: null },
    }),
  );
}
