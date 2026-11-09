"use client";

import { AccountType, CardType } from "@prisma/client";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { AccountFormSection } from "@/components/accounts/account-form-section";
import { AccountTypeSelect } from "@/components/accounts/account-type-select";
import {
  CardForm,
  CardProfileFields,
} from "@/components/accounts/card-profile-fields";
import { CountrySelect } from "@/components/accounts/country-select";
import {
  Asset,
  OpeningBalanceFormItem,
  OpeningBalancesEditor,
} from "@/components/accounts/opening-balances-editor";
import { getAccountTypeConfiguration } from "@/lib/accounts/account-types";
import { useI18n } from "@/lib/i18n/client";

type HouseholdOptions = {
  households: { id: string; name: string; canLinkAccounts: boolean }[];
  members: { id: string; householdId: string; name: string | null }[];
};

type ExistingBalance = {
  id: string;
  asset: Asset;
  currentBalance: string;
  openingDate: string | null;
};

export type AccountFormData = {
  id?: string;
  name: string;
  description: string;
  type: AccountType;
  institutionName: string;
  countryCode: string;
  externalReference: string;
  includeInNetWorth: boolean;
  includeInAvailableBalance: boolean;
  householdId: string;
  holderMemberId: string;
  openingBalances: OpeningBalanceFormItem[];
  card: CardForm | null;
};

const emptyCard = (type: CardType): CardForm => ({
  type,
  brand: "",
  lastFour: "",
  closingDay: "",
  dueDay: "",
  creditLimit: "",
  limitAssetId: "",
});

/** Aplica as regras do tipo (saldos incluídos, saldo inicial, perfil de cartão) a um formulário. */
function withType(
  form: AccountFormData,
  type: AccountType,
  mode: "create" | "edit",
  today: string,
): AccountFormData {
  const next = getAccountTypeConfiguration(type);
  return {
    ...form,
    type,
    includeInNetWorth: next.defaultIncludeInNetWorth,
    includeInAvailableBalance: next.defaultIncludeInAvailableBalance,
    openingBalances:
      mode === "create"
        ? [
            {
              localId: crypto.randomUUID(),
              assetId: "",
              amount: "0",
              openingDate: today,
            },
          ]
        : [],
    card:
      next.requiresCardProfile || next.allowsCardProfile
        ? emptyCard(next.allowedCardTypes[0] || CardType.VIRTUAL)
        : null,
  };
}

export function AccountForm({
  mode,
  assets,
  initial,
  existingBalances = [],
  onSaved,
}: {
  mode: "create" | "edit";
  assets: Asset[];
  initial?: Partial<AccountFormData>;
  existingBalances?: ExistingBalance[];
  onSaved: (data: { id: string }) => void;
}) {
  const { t, fmt } = useI18n();
  const [form, setForm] = useState<AccountFormData>(() => {
    const base: AccountFormData = {
      name: "",
      description: "",
      type: "CASH_WALLET",
      institutionName: "",
      countryCode: "",
      externalReference: "",
      includeInNetWorth: true,
      includeInAvailableBalance: true,
      householdId: "",
      holderMemberId: "",
      openingBalances:
        mode === "create"
          ? [
              {
                localId: crypto.randomUUID(),
                assetId: "",
                amount: "0",
                openingDate: fmt.today(),
              },
            ]
          : [],
      card: null,
      ...initial,
    };
    // Tipo vindo de fora (ex.: link do onboarding) precisa das regras do tipo, como na troca manual.
    return mode === "create" && initial?.type
      ? withType(base, initial.type, mode, fmt.today())
      : base;
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<HouseholdOptions | null>(null);
  useEffect(() => {
    fetch("/api/v1/households/options")
      .then(async (response) => {
        if (response.ok) setOptions((await response.json()).data);
      })
      .catch(() => undefined);
  }, []);
  const config = getAccountTypeConfiguration(form.type);
  const cardTypes = config.allowedCardTypes;
  function changeType(type: AccountType) {
    setForm(withType(form, type, mode, fmt.today()));
  }
  const balanceMessage = useMemo(
    () =>
      existingBalances.length
        ? t("accounts.form.historyReadOnly")
        : t("accounts.form.zeroNoTransaction"),
    [existingBalances.length, t],
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      institutionName: form.institutionName || undefined,
      countryCode: form.countryCode || undefined,
      externalReference: form.externalReference || undefined,
      includeInNetWorth: form.includeInNetWorth,
      includeInAvailableBalance: form.includeInAvailableBalance,
      householdId: form.householdId || null,
      holderMemberId: form.householdId ? form.holderMemberId || null : null,
    };
    if (mode === "create") {
      payload.type = form.type;
      payload.openingBalances = form.openingBalances
        .filter((item) => item.assetId)
        .map(({ assetId, amount, openingDate }) => ({
          assetId,
          amount,
          openingDate,
        }));
    }
    if (form.card)
      payload.card = {
        ...form.card,
        closingDay: form.card.closingDay ? Number(form.card.closingDay) : null,
        dueDay: form.card.dueDay ? Number(form.card.dueDay) : null,
      };
    const response = await fetch(
      mode === "create"
        ? "/api/v1/accounts"
        : `/api/v1/accounts/${initial?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const body = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(body.error?.message || t("accounts.form.saveFailed"));
      return;
    }
    onSaved(body.data);
  }
  return (
    <form
      className="form-card account-form"
      onSubmit={submit}
      onChange={() => setError("")}
    >
      <AccountFormSection title={t("accounts.form.sections.identification")}>
        <label>
          {t("common.fields.name")}
          {t("accounts.form.requiredMark")}
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          {t("common.fields.description")}
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </label>
      </AccountFormSection>
      {options && options.households.length > 0 && (
        <AccountFormSection title={t("household.accountForm.household")}>
          <div className="form-two">
            <label>
              {t("household.accountForm.household")}
              <select
                value={form.householdId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    householdId: event.target.value,
                    holderMemberId: "",
                  })
                }
              >
                <option value="">
                  {t("household.accountForm.householdNone")}
                </option>
                {options.households
                  .filter((h) => h.canLinkAccounts || h.id === form.householdId)
                  .map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {t("household.accountForm.holder")}
              <select
                value={form.holderMemberId}
                disabled={!form.householdId}
                onChange={(event) =>
                  setForm({ ...form, holderMemberId: event.target.value })
                }
              >
                <option value="">
                  {t("household.accountForm.holderNone")}
                </option>
                {options.members
                  .filter((m) => m.householdId === form.householdId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name ?? t("household.detail.unnamedMember")}
                    </option>
                  ))}
              </select>
              <small>{t("household.accountForm.holderHint")}</small>
            </label>
          </div>
        </AccountFormSection>
      )}
      <AccountFormSection
        title={t("accounts.form.sections.typeAndInstitution")}
      >
        <AccountTypeSelect
          value={form.type}
          disabled={mode === "edit" && existingBalances.length > 0}
          onChange={changeType}
        />
        <div className="form-two">
          <label>
            {t("accounts.form.institution")}
            {config.requiresInstitution && t("accounts.form.requiredMark")}
            <input
              required={config.requiresInstitution}
              value={form.institutionName}
              onChange={(event) =>
                setForm({ ...form, institutionName: event.target.value })
              }
            />
          </label>
          <CountrySelect
            required={config.requiresCountry}
            value={form.countryCode}
            onChange={(countryCode) => setForm({ ...form, countryCode })}
          />
        </div>
      </AccountFormSection>
      {mode === "create" ? (
        <AccountFormSection
          title={t("accounts.form.sections.openingBalances")}
          description={balanceMessage}
        >
          <OpeningBalancesEditor
            type={form.type}
            assets={assets}
            items={form.openingBalances}
            onChange={(openingBalances) =>
              setForm({ ...form, openingBalances })
            }
          />
        </AccountFormSection>
      ) : (
        <AccountFormSection
          title={t("accounts.form.sections.balances")}
          description={balanceMessage}
        >
          {existingBalances.map((balance) => (
            <div className="balance-row" key={balance.id}>
              <span>
                <b>
                  {balance.asset.symbol} {balance.asset.code}
                </b>
                <small>
                  {balance.openingDate
                    ? t("accounts.form.openingOn", {
                        date: fmt.civilDate(balance.openingDate),
                      })
                    : t("accounts.form.historyPreserved")}
                </small>
              </span>
              <strong>{balance.currentBalance}</strong>
            </div>
          ))}
          {!existingBalances.length && (
            <p className="field-note">
              {t("accounts.form.noExistingBalances")}
            </p>
          )}
          {config.assetSelection === "multiple" && (
            <p className="field-note">
              {t("accounts.form.cannotRemoveCurrency")}
            </p>
          )}
        </AccountFormSection>
      )}
      {(config.requiresCardProfile || config.allowsCardProfile) &&
        form.card && (
          <AccountFormSection
            title={t("accounts.form.sections.card")}
            description={
              config.requiresCardProfile
                ? t("accounts.form.cardRequired")
                : t("accounts.form.cardOptional")
            }
          >
            <CardProfileFields
              value={form.card}
              types={cardTypes}
              assets={assets.filter((asset) => asset.type === "FIAT")}
              onChange={(card) => setForm({ ...form, card })}
            />
          </AccountFormSection>
        )}
      <AccountFormSection title={t("accounts.form.sections.behavior")}>
        <label className="check">
          <input
            type="checkbox"
            checked={form.includeInNetWorth}
            onChange={(event) =>
              setForm({ ...form, includeInNetWorth: event.target.checked })
            }
          />{" "}
          {t("accounts.form.includeInNetWorth")}
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.includeInAvailableBalance}
            onChange={(event) =>
              setForm({
                ...form,
                includeInAvailableBalance: event.target.checked,
              })
            }
          />{" "}
          {t("accounts.form.includeInAvailableBalance")}
        </label>
        {form.type === "OTHER" && (
          <p className="field-note">{t("accounts.form.reviewCustomType")}</p>
        )}
      </AccountFormSection>
      {error && (
        <p className="form-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      <button className="button" disabled={saving}>
        {saving
          ? t("common.actions.saving")
          : mode === "create"
            ? t("accounts.form.createSubmit")
            : t("accounts.form.editSubmit")}
      </button>
    </form>
  );
}
