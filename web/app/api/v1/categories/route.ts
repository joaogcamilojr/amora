import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { createCategory } from "@/lib/finance/crud";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withUser((userId) =>
    prisma.categories.findMany({
      where: { owner_id: userId },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    }),
  );
}

export async function POST(request: NextRequest) {
  return withUser(
    async (userId) => createCategory(userId, await body(request)),
    201,
  );
}
