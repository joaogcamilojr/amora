import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageTitle } from "@/components/ds/headers";
import { getCountryOptions } from "@/lib/countries";
import { BillingPanel } from "@/components/settings/billing-panel";
import { PrivacyPanel } from "@/components/settings/privacy-panel";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { getSession } from "@/lib/auth/session";
import { getBillingStatus } from "@/lib/finance/billing";
import { param, type PageProps } from "@/lib/finance/page";
import { getDeletionStatus } from "@/lib/finance/privacy-deletion";
import { LOCALE_LABELS, LOCALES, timeZoneOptions } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { baseCurrencyOptions, getPreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("settings.title") };
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [{ t, fmt, locale }, prefs, currencies, deletion, billing, sp] =
    await Promise.all([
      getI18n(),
      getPreferences(session.user_id),
      baseCurrencyOptions(),
      getDeletionStatus(session.user_id),
      getBillingStatus(session.user_id),
      searchParams,
    ]);
  const billingResult = param(sp.billing);
  return (
    <div className="mx-auto max-w-[720px]">
      <PageTitle
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />
      <PreferencesForm
        initial={{
          displayName: prefs.display_name ?? "",
          countryCode: prefs.country_code ?? "",
          locale: prefs.locale,
          timeZone: prefs.time_zone,
          baseCurrency: prefs.base_currency ?? "",
        }}
        countries={getCountryOptions(locale)}
        locales={LOCALES.map((value) => ({
          value,
          label: LOCALE_LABELS[value],
        }))}
        timeZones={timeZoneOptions()}
        currencies={currencies.map((c) => ({
          value: c.code,
          label: `${c.code} · ${fmt.currencyName(c.code)}`,
        }))}
      />
      <BillingPanel
        billing={{
          plan: billing.plan,
          accessState: billing.accessState,
          interval: billing.interval,
          trialDaysLeft: billing.trialDaysLeft,
          currentPeriodEnd: billing.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
          hasSubscription: billing.hasSubscription,
          hasCustomer: billing.hasCustomer,
          inheritedFromHousehold: billing.inheritedFromHousehold,
          checkoutAvailable: billing.checkoutAvailable,
          billingDisabled: billing.billingDisabled,
          prices: billing.prices,
        }}
        result={
          billingResult === "success" || billingResult === "canceled"
            ? billingResult
            : null
        }
      />
      <PrivacyPanel
        email={prefs.email}
        status={{
          graceDays: deletion.graceDays,
          sharedAccounts: deletion.sharedAccounts,
          pending: deletion.pending
            ? {
                scheduledFor:
                  deletion.pending.scheduled_for?.toISOString() ?? null,
              }
            : null,
        }}
      />
    </div>
  );
}
