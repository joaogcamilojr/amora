"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ds/button";
import { Field, Input, Select } from "@/components/ds/field";
import { useToast } from "@/components/ui/toast-provider";
import { api } from "@/lib/finance/client";
import { useI18n } from "@/lib/i18n/client";

type Option = { value: string; label: string };
type Prefs = {
  displayName: string;
  countryCode: string;
  locale: string;
  timeZone: string;
  baseCurrency: string;
};

export function PreferencesForm({
  initial,
  locales,
  timeZones,
  currencies,
  countries,
}: {
  initial: Prefs;
  locales: Option[];
  timeZones: string[];
  currencies: Option[];
  countries: Option[];
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof Prefs) => (value: string) =>
    setPrefs((p) => ({ ...p, [key]: value }));
  const zones = timeZones.includes(prefs.timeZone)
    ? timeZones
    : [prefs.timeZone, ...timeZones];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await api("/api/v1/me", "PATCH", {
      displayName: prefs.displayName,
      countryCode: prefs.countryCode,
      locale: prefs.locale,
      timeZone: prefs.timeZone,
      ...(prefs.baseCurrency ? { baseCurrency: prefs.baseCurrency } : {}),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      toast({
        variant: "error",
        title: t("settings.saveFailed"),
        description: result.error,
      });
      return;
    }
    toast({ variant: "success", title: t("settings.saved") });
    // Recarrega layout e páginas no novo idioma/fuso/moeda.
    router.refresh();
  }

  async function applyPack() {
    setBusy(true);
    const result = await api<{ categories: number; rules: number }>(
      "/api/v1/onboarding/apply-pack",
      "POST",
    );
    setBusy(false);
    if (!result.ok)
      return toast({
        variant: "error",
        title: t("settings.saveFailed"),
        description: result.error,
      });
    toast({
      variant: "success",
      title: t("onboarding.settings.applied", result.data),
    });
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-5 rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-6"
    >
      <Field label={t("settings.displayName")}>
        <Input
          value={prefs.displayName}
          maxLength={120}
          onChange={(e) => set("displayName")(e.target.value)}
        />
      </Field>
      <Field
        label={t("onboarding.settings.countryLabel")}
        hint={t("onboarding.settings.countryHint")}
      >
        <div className="flex flex-wrap gap-2">
          <Select
            className="min-w-0 flex-1"
            value={prefs.countryCode}
            onChange={(e) => set("countryCode")(e.target.value)}
          >
            <option value="">{t("onboarding.settings.noCountry")}</option>
            {countries.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            disabled={
              busy ||
              !initial.countryCode ||
              initial.countryCode !== prefs.countryCode
            }
            onClick={applyPack}
          >
            {t("onboarding.settings.applyPack")}
          </Button>
        </div>
        <span className="text-[12px] leading-4 text-neutral-500">
          {t("onboarding.settings.applyPackHint")}
        </span>
      </Field>
      <Field label={t("settings.language")} hint={t("settings.languageHint")}>
        <Select
          value={prefs.locale}
          onChange={(e) => set("locale")(e.target.value)}
        >
          {locales.map((o) => (
            <option key={o.value} value={o.value} lang={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("settings.timeZone")} hint={t("settings.timeZoneHint")}>
        <div className="flex flex-wrap gap-2">
          <Select
            className="min-w-0 flex-1"
            value={prefs.timeZone}
            onChange={(e) => set("timeZone")(e.target.value)}
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            onClick={() =>
              set("timeZone")(Intl.DateTimeFormat().resolvedOptions().timeZone)
            }
          >
            {t("settings.detectTimeZone")}
          </Button>
        </div>
      </Field>
      <Field
        label={t("settings.baseCurrency")}
        hint={t("settings.baseCurrencyHint")}
      >
        <Select
          value={prefs.baseCurrency}
          onChange={(e) => set("baseCurrency")(e.target.value)}
          required
        >
          {!prefs.baseCurrency && <option value="">—</option>}
          {currencies.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <p className="text-[12px] text-neutral-500">
        {t("settings.preview", {
          money: fmt.money(1234.56, prefs.baseCurrency || fmt.baseCurrency),
          date: fmt.civilDate(fmt.today()),
        })}
      </p>
      {error && (
        <p className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? t("common.actions.saving") : t("common.actions.save")}
        </Button>
      </div>
    </form>
  );
}
