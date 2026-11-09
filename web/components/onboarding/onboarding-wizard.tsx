"use client";

import { useCallback, useState } from "react";

import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Field, Input, Select } from "@/components/ds/field";
import { api } from "@/lib/finance/client";
import { useI18n } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n";

type Option = { value: string; label: string };
type Values = {
  displayName: string;
  countryCode: string;
  locale: string;
  timeZone: string;
  baseCurrency: string;
};
export type PackPreview = {
  countryCode: string;
  packId: string;
  countryName: string;
  defaults: { locale: string; timeZone: string; currency: string } | null;
  categories: { slug: string; kind: "INCOME" | "EXPENSE"; name: string }[];
  rules: { pattern: string; categoryName: string | null }[];
  accountTypes: string[];
};

/** Navegação completa: idioma, fuso e moeda recém-salvos precisam recarregar o layout raiz. */
const leave = (href: string) => window.location.assign(href);

const STEPS = ["country", "preferences", "pack", "accounts"] as const;

export function OnboardingWizard({
  initial,
  initialPack,
  countries,
  locales,
  timeZones,
  currencies,
}: {
  initial: Values;
  initialPack: PackPreview | null;
  countries: Option[];
  locales: Option[];
  timeZones: string[];
  currencies: Option[];
}) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(initial);
  const [pack, setPack] = useState<PackPreview | null>(initialPack);
  const [applyCategories, setApplyCategories] = useState(true);
  const [applyRules, setApplyRules] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{
    categories: number;
    rules: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof Values, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  const zones = timeZones.includes(values.timeZone)
    ? timeZones
    : [values.timeZone, ...timeZones];

  const loadPack = useCallback(async (countryCode: string, locale: string) => {
    if (!countryCode) return null;
    const result = await api<{ pack: PackPreview }>(
      `/api/v1/onboarding?countryCode=${countryCode}&locale=${encodeURIComponent(locale)}`,
      "GET",
    );
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    setPack(result.data.pack);
    return result.data.pack;
  }, []);

  async function pickCountry(countryCode: string) {
    setError(null);
    set("countryCode", countryCode);
    setPack(null);
    const preview = await loadPack(countryCode, values.locale);
    if (!preview?.defaults) return;
    const { locale, timeZone, currency } = preview.defaults;
    setValues((v) => ({
      ...v,
      countryCode,
      locale,
      timeZone,
      baseCurrency: currencies.some((c) => c.value === currency)
        ? currency
        : v.baseCurrency,
    }));
    void loadPack(countryCode, locale);
  }

  async function goTo(next: number) {
    setError(null);
    if (next === 2) await loadPack(values.countryCode, values.locale);
    setStep(next);
  }

  async function finish() {
    setBusy(true);
    setError(null);
    const result = await api<{ categories: number; rules: number }>(
      "/api/v1/onboarding",
      "POST",
      {
        ...values,
        baseCurrency: values.baseCurrency || undefined,
        applyCategories,
        applyRules,
      },
    );
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setDone(result.data);
    setStep(3);
  }

  async function skip() {
    setBusy(true);
    const result = await api("/api/v1/onboarding/skip", "POST");
    setBusy(false);
    if (!result.ok) return setError(result.error);
    leave("/dashboard");
  }

  const canContinue =
    step === 0
      ? Boolean(values.countryCode)
      : step === 1
        ? Boolean(values.baseCurrency)
        : true;
  const packName = pack
    ? t(`onboarding.country.packNames.${pack.packId}` as MessageKey)
    : "";
  const expenses = pack?.categories.filter((c) => c.kind === "EXPENSE") ?? [];
  const income = pack?.categories.filter((c) => c.kind === "INCOME") ?? [];

  return (
    <div className="grid gap-5 rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-medium text-brand-700">
          {t("onboarding.stepLabel", {
            current: step + 1,
            total: STEPS.length,
          })}{" "}
          · {t(`onboarding.steps.${STEPS[step]}` as MessageKey)}
        </p>
        {!done && (
          <Button
            variant="tertiary"
            size="compact"
            onClick={skip}
            disabled={busy}
          >
            {t("onboarding.actions.skip")}
          </Button>
        )}
      </div>

      {step === 0 && (
        <section className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">
              {t("onboarding.country.title")}
            </h2>
            <p className="text-sm text-neutral-600">
              {t("onboarding.country.description")}
            </p>
          </div>
          <Field label={t("onboarding.country.label")}>
            <Select
              value={values.countryCode}
              onChange={(e) => void pickCountry(e.target.value)}
            >
              <option value="">{t("onboarding.country.placeholder")}</option>
              {countries.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          {pack && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">
                {t("onboarding.country.packBadge", { name: packName })}
              </Badge>
              {pack.packId === "GENERIC" && (
                <span className="text-[12px] text-neutral-500">
                  {t("onboarding.country.genericHint")}
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">
              {t("onboarding.preferences.title")}
            </h2>
            <p className="text-sm text-neutral-600">
              {t("onboarding.preferences.description")}
            </p>
          </div>
          <Field label={t("settings.displayName")}>
            <Input
              value={values.displayName}
              maxLength={120}
              onChange={(e) => set("displayName", e.target.value)}
            />
          </Field>
          <Field label={t("settings.language")}>
            <Select
              value={values.locale}
              onChange={(e) => set("locale", e.target.value)}
            >
              {locales.map((o) => (
                <option key={o.value} value={o.value} lang={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("settings.timeZone")}>
            <div className="flex flex-wrap gap-2">
              <Select
                className="min-w-0 flex-1"
                value={values.timeZone}
                onChange={(e) => set("timeZone", e.target.value)}
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
                  set(
                    "timeZone",
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                  )
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
              value={values.baseCurrency}
              onChange={(e) => set("baseCurrency", e.target.value)}
              required
            >
              {!values.baseCurrency && (
                <option value="">
                  {t("onboarding.preferences.pickCurrency")}
                </option>
              )}
              {currencies.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </section>
      )}

      {step === 2 && pack && (
        <section className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">
              {t("onboarding.pack.title")}
            </h2>
            <p className="text-sm text-neutral-600">
              {t("onboarding.pack.description")}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
            <input
              type="checkbox"
              checked={applyCategories}
              onChange={(e) => setApplyCategories(e.target.checked)}
            />
            {t("onboarding.pack.categories", { count: pack.categories.length })}
          </label>
          <div className="grid gap-3 text-[13px] sm:grid-cols-2">
            <div>
              <p className="mb-1 font-medium text-neutral-800">
                {t("onboarding.pack.expenses")}
              </p>
              <p className="text-neutral-600">
                {expenses.map((c) => c.name).join(" · ")}
              </p>
            </div>
            <div>
              <p className="mb-1 font-medium text-neutral-800">
                {t("onboarding.pack.income")}
              </p>
              <p className="text-neutral-600">
                {income.map((c) => c.name).join(" · ")}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
            <input
              type="checkbox"
              checked={applyRules}
              onChange={(e) => setApplyRules(e.target.checked)}
            />
            {t("onboarding.pack.rules", { count: pack.rules.length })}
          </label>
          <p className="text-[12px] text-neutral-500">
            {t("onboarding.pack.rulesHint")}
          </p>
          {pack.rules.length === 0 ? (
            <p className="text-[13px] text-neutral-600">
              {t("onboarding.pack.empty")}
            </p>
          ) : (
            <ul className="grid gap-1 text-[12px] text-neutral-600">
              {pack.rules.map((r) => (
                <li key={r.pattern} className="font-mono break-all">
                  {t("onboarding.pack.ruleLine", {
                    pattern: r.pattern,
                    target: r.categoryName ?? t("onboarding.pack.noCategory"),
                  })}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {step === 3 && pack && (
        <section className="grid gap-4">
          {done && (
            <p className="rounded-[var(--radius-control)] bg-success-bg p-3 text-[13px] text-success">
              {t("onboarding.result", {
                categories: done.categories,
                rules: done.rules,
              })}
            </p>
          )}
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">
              {t("onboarding.accounts.title")}
            </h2>
            <p className="text-sm text-neutral-600">
              {t("onboarding.accounts.description")}
            </p>
          </div>
          <ul className="grid gap-2">
            {pack.accountTypes.map((type) => (
              <li
                key={type}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-neutral-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {t(`enums.accountType.${type}.label` as MessageKey)}
                  </p>
                  <p className="text-[12px] text-neutral-500">
                    {t(`enums.accountType.${type}.description` as MessageKey)}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="compact"
                  onClick={() =>
                    leave(
                      `/accounts/new?type=${type}&country=${pack.countryCode}`,
                    )
                  }
                >
                  {t("onboarding.accounts.create")}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-between gap-2">
        {step > 0 && step < 3 ? (
          <Button
            variant="secondary"
            onClick={() => void goTo(step - 1)}
            disabled={busy}
          >
            {t("onboarding.actions.back")}
          </Button>
        ) : (
          <span />
        )}
        {step < 2 && (
          <Button onClick={() => void goTo(step + 1)} disabled={!canContinue}>
            {t("onboarding.actions.next")}
          </Button>
        )}
        {step === 2 && (
          <Button onClick={finish} disabled={busy}>
            {busy
              ? t("onboarding.actions.finishing")
              : t("onboarding.actions.finish")}
          </Button>
        )}
        {step === 3 && (
          <Button onClick={() => leave("/dashboard")}>
            {t("onboarding.actions.finish")}
          </Button>
        )}
      </div>
    </div>
  );
}
