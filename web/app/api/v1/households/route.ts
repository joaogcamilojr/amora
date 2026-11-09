import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { createHousehold, listHouseholds } from "@/lib/finance/households";

/** Grupos familiares do usuário e o workspace ativo. */
export async function GET() {
  return withUser((userId) => listHouseholds(userId));
}

/** Cria um grupo; o criador vira ADMIN. Corpo: `name`. */
export async function POST(request: NextRequest) {
  return withUser(async (userId) => createHousehold(userId, await body(request)), 201);
}
