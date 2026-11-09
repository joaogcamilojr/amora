import { withUser } from "@/lib/finance/api";
import { skipOnboarding } from "@/lib/finance/onboarding";

/** Pula o onboarding sem criar nada. */
export async function POST() {
  return withUser((userId) => skipOnboarding(userId));
}
