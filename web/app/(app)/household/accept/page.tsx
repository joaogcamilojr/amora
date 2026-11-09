import type { Metadata } from "next";

import { AcceptInvitation } from "@/components/household/accept-invitation";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("household.accept.title") };
}

export default async function AcceptHouseholdPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return <AcceptInvitation token={typeof token === "string" ? token : null} />;
}
