import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { removeMember, updateMember } from "@/lib/finance/households";

type Context = { params: Promise<{ id: string; memberId: string }> };

/** Altera papel (`role`) ou nome (`displayName`) de um membro (ADMIN). */
export async function PATCH(request: NextRequest, { params }: Context) {
  return withUser(async (userId) => {
    const { id, memberId } = await params;
    return updateMember(userId, id, memberId, await body(request));
  });
}

/** ADMIN remove qualquer membro; qualquer membro remove a si mesmo (sair). */
export async function DELETE(_request: NextRequest, { params }: Context) {
  return withUser(async (userId) => {
    const { id, memberId } = await params;
    return removeMember(userId, id, memberId);
  });
}
