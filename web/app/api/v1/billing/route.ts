import { withUser } from "@/lib/finance/api";
import { getBillingStatus } from "@/lib/finance/billing";

/** Plano atual, estado de acesso (teste, ativo, somente leitura), direitos e preços de referência em USD. */
export async function GET() {
  return withUser((userId) => getBillingStatus(userId));
}
