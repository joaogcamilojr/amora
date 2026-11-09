import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageTitle } from "@/components/ds/headers";
import {
  HouseholdList,
  NewHousehold,
} from "@/components/household/household-list";
import { getSession } from "@/lib/auth/session";
import { listHouseholds } from "@/lib/finance/households";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("household.title") };
}

export default async function HouseholdPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [{ t }, { households }] = await Promise.all([
    getI18n(),
    listHouseholds(session.user_id),
  ]);
  return (
    <div className="mx-auto max-w-[880px]">
      <PageTitle
        title={t("household.title")}
        description={t("household.subtitle")}
        actions={<NewHousehold />}
      />
      <HouseholdList households={households} />
    </div>
  );
}
