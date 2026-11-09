import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/auth/session";
import { listHouseholds } from "@/lib/finance/households";
import { PlanBanner } from "@/components/finance/plan-banner";
import { getConsentStatus } from "@/lib/finance/consent";
import { getBillingStatus } from "@/lib/finance/billing";
import { getOnboardingState } from "@/lib/finance/onboarding";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [workspaces, onboarding, billing, consent] = await Promise.all([
    listHouseholds(session.user_id),
    getOnboardingState(session.user_id),
    getBillingStatus(session.user_id),
    getConsentStatus(session.user_id),
  ]);
  // Termos e privacidade vigentes precisam de aceite (primeiro acesso de quem já existia e a cada versão nova).
  if (!consent.upToDate) redirect("/consent");
  if (onboarding.needsOnboarding) redirect("/onboarding");
  return (
    <AppShell
      email={session.user.email}
      displayName={session.user.display_name}
      workspaces={workspaces}
    >
      <PlanBanner billing={billing} />
      {children}
    </AppShell>
  );
}
