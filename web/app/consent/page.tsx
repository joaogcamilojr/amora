import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsentForm } from "@/components/legal/consent-form";
import { getSession } from "@/lib/auth/session";
import { getConsentStatus } from "@/lib/finance/consent";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("legal.consent.title") };
}

export default async function ConsentPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const status = await getConsentStatus(session.user_id);
  if (status.upToDate) redirect("/dashboard");
  const { t } = await getI18n();
  return (
    <main className="mx-auto min-h-screen max-w-[640px] px-4 py-10">
      <h1 className="mb-4 text-2xl leading-8 font-semibold text-neutral-950">{t("legal.consent.title")}</h1>
      <ConsentForm versions={{ terms: status.current.TERMS, privacy: status.current.PRIVACY }} />
    </main>
  );
}
