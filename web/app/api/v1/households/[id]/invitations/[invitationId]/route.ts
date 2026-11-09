import type { NextRequest } from "next/server";

import { withUser } from "@/lib/finance/api";
import { revokeInvitation } from "@/lib/finance/households";

/** Revoga um convite pendente (ADMIN). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> },
) {
  return withUser(async (userId) => {
    const { id, invitationId } = await params;
    return revokeInvitation(userId, id, invitationId);
  });
}
