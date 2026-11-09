import type { NextRequest } from "next/server";

import { body, withUser } from "@/lib/finance/api";
import { createRule } from "@/lib/finance/crud";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withUser((userId) =>
    prisma.classification_rules.findMany({
      where: { owner_id: userId, active: true },
      orderBy: { priority: "asc" },
    }),
  );
}

export async function POST(request: NextRequest) {
  return withUser(
    async (userId) => createRule(userId, await body(request)),
    201,
  );
}
