import { getSession } from "@/lib/auth/session";
import { jsonData } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await getSession();
  return jsonData(
    await prisma.assets.findMany({
      where: { active: true },
      orderBy: [{ type: "asc" }, { code: "asc" }],
    }),
  );
}
