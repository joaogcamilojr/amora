import { withUser } from "@/lib/finance/api";
import { householdOptions } from "@/lib/finance/households";

/** Grupos e membros do usuário, para os seletores de grupo e titular nos formulários. */
export async function GET() {
  return withUser((userId) => householdOptions(userId));
}
