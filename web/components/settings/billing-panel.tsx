"use client";

import { useState } from "react";

import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import {
  FAMILY_MAX_MEMBERS,
  PLAN_CODES,
  START_MAX_ACTIVE_ACCOUNTS,
  type BillingInterval,
  type PlanCode,
} from "@/lib/billing/plans";
import { api } from "@/lib/finance/client";
import type { MessageKey } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";

export interface BillingView {
  plan: PlanCode;
  accessState: "TRIAL" | "ACTIVE" | "PAST_DUE" | "GRACE" | "EXPIRED";
  interval: BillingInterval | null;
  trialDaysLeft: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasSubscription: boolean;
  hasCustomer: boolean;
  inheritedFromHousehold: boolean;
  checkoutAvailable: boolean;
  billingDisabled: boolean;
  prices: Record<PlanCode, Record<BillingInterval, number>>;
}

const FEATURES: Record<
  PlanCode,
  { key: string; vars?: Record<string, number> }[]
> = {
  START: [
    { key: "accounts", vars: { count: START_MAX_ACTIVE_ACCOUNTS } },
    { key: "currency" },
    { key: "manualRate" },
  ],
  PREMIUM: [{ key: "accounts" }, { key: "currencies" }, { key: "autoFx" }],
  FAMILY: [
    { key: "premium" },
    { key: "household", vars: { count: FAMILY_MAX_MEMBERS } },
    { key: "members" },
  ],
};

/** Navegação completa: o Stripe é outro domínio. */
const leave = (url: string) => window.location.assign(url);

export function BillingPanel({
  billing,
  result,
}: {
  billing: BillingView;
  result: "success" | "canceled" | null;
}) {
  const { t, fmt } = useI18n();
  const [interval, setInterval] = useState<BillingInterval>(
    billing.interval ?? "YEAR",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscribed =
    billing.hasSubscription &&
    (billing.accessState === "ACTIVE" || billing.accessState === "PAST_DUE");
  const planName = (plan: PlanCode) =>
    t(`billing.plans.${plan}.name` as MessageKey);
  const date = (iso: string | null) =>
    iso ? fmt.civilDate(iso.slice(0, 10)) : "—";

  async function open(kind: "checkout" | "portal", plan?: PlanCode) {
    setBusy(plan ?? kind);
    setError(null);
    const result = await api<{ url: string }>(
      kind === "checkout"
        ? "/api/v1/billing/checkout"
        : "/api/v1/billing/portal",
      "POST",
      kind === "checkout" ? { plan, interval } : undefined,
    );
    if (!result.ok) {
      setBusy(null);
      return setError(result.error);
    }
    leave(result.data.url);
  }

  const stateText = (() => {
    switch (billing.accessState) {
      case "TRIAL":
        return t("billing.state.TRIAL", { count: billing.trialDaysLeft });
      case "ACTIVE":
        return t("billing.state.ACTIVE", { plan: planName(billing.plan) });
      case "PAST_DUE":
        return t("billing.state.PAST_DUE");
      case "GRACE":
        return t("billing.state.GRACE", {
          plan: planName(billing.plan),
          date: date(billing.currentPeriodEnd),
        });
      default:
        return t("billing.state.EXPIRED");
    }
  })();

  return (
    <section
      id="billing"
      className="mt-6 grid scroll-mt-6 gap-4 rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-neutral-950">
          {t("billing.title")}
        </h2>
        <p className="text-sm text-neutral-600">{t("billing.subtitle")}</p>
      </div>

      {billing.billingDisabled && (
        <p className="rounded-[var(--radius-control)] bg-warning-bg p-3 text-[13px] text-warning">
          {t("billing.devDisabled")}
        </p>
      )}

      {result && (
        <p className="rounded-[var(--radius-control)] bg-info-bg p-3 text-[13px] text-info">
          {t(`billing.result.${result}`)}
        </p>
      )}

      <div className="grid gap-1 rounded-[var(--radius-control)] bg-neutral-50 p-4">
        <p className="text-sm font-medium text-neutral-900">{stateText}</p>
        {billing.inheritedFromHousehold && (
          <p className="text-[13px] text-neutral-600">
            {t("billing.state.inherited")}
          </p>
        )}
        {subscribed && billing.currentPeriodEnd && (
          <p className="text-[13px] text-neutral-600">
            {billing.cancelAtPeriodEnd
              ? t("billing.state.cancels", {
                  date: date(billing.currentPeriodEnd),
                })
              : t("billing.state.renews", {
                  date: date(billing.currentPeriodEnd),
                })}
          </p>
        )}
        {subscribed && billing.hasCustomer && (
          <div className="pt-2">
            <Button
              variant="secondary"
              disabled={busy !== null}
              onClick={() => void open("portal")}
            >
              {busy === "portal"
                ? t("billing.actions.redirecting")
                : t("billing.actions.manage")}
            </Button>
          </div>
        )}
      </div>

      {!billing.checkoutAvailable && (
        <p className="text-[13px] text-neutral-600">
          {t("billing.unavailable")}
        </p>
      )}

      {!subscribed && billing.checkoutAvailable && (
        <>
          <div
            className="flex gap-2"
            role="group"
            aria-label={t("billing.title")}
          >
            {(["MONTH", "YEAR"] as const).map((value) => (
              <Button
                key={value}
                variant={interval === value ? "primary" : "secondary"}
                size="compact"
                onClick={() => setInterval(value)}
              >
                {value === "MONTH"
                  ? t("billing.interval.monthly")
                  : t("billing.interval.yearly")}
              </Button>
            ))}
            {interval === "YEAR" && (
              <Badge tone="success">{t("billing.interval.save")}</Badge>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {PLAN_CODES.map((plan) => (
              <article
                key={plan}
                className="grid content-start gap-3 rounded-[var(--radius-control)] border border-neutral-200 p-4"
              >
                <div>
                  <h3 className="text-base font-semibold text-neutral-950">
                    {planName(plan)}
                  </h3>
                  <p className="text-[12px] text-neutral-500">
                    {t(`billing.plans.${plan}.tagline` as MessageKey)}
                  </p>
                </div>
                <p className="text-xl font-semibold text-neutral-950">
                  {t("billing.interval.price", {
                    price: fmt.money(billing.prices[plan][interval], "USD", 0),
                    interval: t(`billing.interval.${interval}`),
                  })}
                </p>
                <ul className="list-disc pl-5 text-[13px] text-neutral-600">
                  {FEATURES[plan].map((f) => (
                    <li key={f.key}>
                      {t(
                        `billing.features.${plan}.${f.key}` as MessageKey,
                        f.vars,
                      )}
                    </li>
                  ))}
                </ul>
                <Button
                  disabled={busy !== null}
                  onClick={() => void open("checkout", plan)}
                >
                  {busy === plan
                    ? t("billing.actions.redirecting")
                    : t("billing.actions.subscribe", { plan: planName(plan) })}
                </Button>
              </article>
            ))}
          </div>
        </>
      )}

      {error && (
        <p className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
