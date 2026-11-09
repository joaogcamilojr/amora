import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { archiveHousehold, getHousehold, updateHousehold } from "@/lib/finance/households";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  return withUser(async (userId) => getHousehold(userId, (await params).id));
}

/** Renomeia o grupo (ADMIN). Corpo: `name`. */
export async function PATCH(request: NextRequest, { params }: Context) {
  return withUser(async (userId) => updateHousehold(userId, (await params).id, await body(request)));
}

/** Arquiva o grupo (ADMIN); o histórico fica. */
export async function DELETE(_request: NextRequest, { params }: Context) {
  return withUser(async (userId) => archiveHousehold(userId, (await params).id));
}
