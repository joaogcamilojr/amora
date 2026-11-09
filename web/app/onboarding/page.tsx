import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getCountryOptions, isCountryCode } from "@/lib/countries";
import { getSession } from "@/lib/auth/session";
import { getOnboardingState, previewPack } from "@/lib/finance/onboarding";
import { LOCALE_LABELS, LOCALES, timeZoneOptions } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { baseCurrencyOptions, getPreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("onboarding.title") };
}

/** País sugerido pelo cabeçalho Accept-Language ("pt-BR" → BR); só uma sugestão, a pessoa confirma. */
function guessCountry(acceptLanguage: string | null) {
  const region = acceptLanguage?.split(",")[0]?.split(";")[0]?.split("-")[1]?.toUpperCase();
  return region && isCountryCode(region) ? region : "";
}

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const state = await getOnboardingState(session.user_id);
  if (!state.needsOnboarding) redirect("/dashboard");
  const [{ t, fmt, locale }, prefs, currencies, requestHeaders] = await Promise.all([
    getI18n(),
    getPreferences(session.user_id),
    baseCurrencyOptions(),
    headers(),
  ]);
  const countryCode = prefs.country_code ?? guessCountry(requestHeaders.get("accept-language"));
  const initialPack = countryCode ? await previewPack(session.user_id, countryCode, prefs.locale) : null;
  return (
    <main className="mx-auto min-h-screen max-w-[720px] px-4 py-10">
      <h1 className="text-2xl leading-8 font-semibold text-neutral-950">{t("onboarding.title")}</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-600">{t("onboarding.subtitle")}</p>
      <OnboardingWizard
        initial={{
          displayName: prefs.display_name ?? "",
          countryCode,
          locale: prefs.locale,
          timeZone: prefs.time_zone,
          baseCurrency: prefs.base_currency ?? "",
        }}
        initialPack={initialPack}
        countries={getCountryOptions(locale)}
        locales={LOCALES.map((value) => ({ value, label: LOCALE_LABELS[value] }))}
        timeZones={timeZoneOptions()}
        currencies={currencies.map((c) => ({ value: c.code, label: `${c.code} · ${fmt.currencyName(c.code)}` }))}
      />
    </main>
  );
}
