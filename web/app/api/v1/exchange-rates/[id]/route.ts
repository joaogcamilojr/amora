import type { NextRequest } from "next/server";

import { withUser } from "@/lib/finance/api";
import { deactivateOwnRate } from "@/lib/finance/fx-rates";

/** Desativa uma cotação manual própria (fica no histórico; a automática volta a valer). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withUser((userId) => deactivateOwnRate(userId, id));
}
