import { withUser } from "@/lib/finance/api";
import { applyCountryPack } from "@/lib/finance/onboarding";

/** Reaplica o pacote do país salvo nas preferências (cria só o que falta). */
export async function POST() {
  return withUser((userId) => applyCountryPack(userId));
}
