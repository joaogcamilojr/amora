import { withUser } from "@/lib/finance/api";
import { createPortal } from "@/lib/finance/billing";

/** → `{ url }` do portal do cliente do Stripe (trocar plano e cartão, faturas, cancelar). */
export async function POST() {
  return withUser((userId) => createPortal(userId), 201);
}
