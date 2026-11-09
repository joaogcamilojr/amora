import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { HouseholdDetail } from "@/components/household/household-detail";
import { getSession } from "@/lib/auth/session";
import { getHousehold } from "@/lib/finance/households";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("household.title") };
}

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const household = await getHousehold(session.user_id, id).catch(() => null);
  if (!household) notFound();
  return <HouseholdDetail household={household} />;
}
