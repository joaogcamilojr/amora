"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountForm } from "@/components/accounts/account-form";
import { Asset } from "@/components/accounts/opening-balances-editor";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-provider";
import { getAccountTypeConfiguration } from "@/lib/accounts/account-types";
import { useI18n } from "@/lib/i18n/client";

type Account = {
  id: string;
  name: string;
  type: any;
  status: string;
  countryCode: string;
  institutionName: string;
  description: string;
  householdId: string;
  holderMemberId: string;
  includeInNetWorth: boolean;
  includeInAvailableBalance: boolean;
  balances: Array<{
    id: string;
    assetId: string;
    currentBalance: string;
    openingDate: string | null;
    asset: Asset;
  }>;
  cardProfile: any;
};

export default function EditAccount({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, fmt } = useI18n();
  const [id, setId] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");
  const [newAsset, setNewAsset] = useState("");
  const [newAmount, setNewAmount] = useState("0");
  const [newDate, setNewDate] = useState(fmt.today);
  const { toast } = useToast();
  async function load(nextId: string) {
    try {
      const [accountResponse, assetsResponse] = await Promise.all([
        fetch(`/api/v1/accounts/${nextId}`),
        fetch("/api/v1/assets"),
      ]);
      const accountBody = await accountResponse.json();
      const assetsBody = await assetsResponse.json();
      if (!accountResponse.ok) throw new Error(t("accounts.edit.notFound"));
      setAccount({
        ...accountBody.data,
        description: accountBody.data.description || "",
        institutionName: accountBody.data.institutionName || "",
        countryCode: accountBody.data.countryCode || "",
        householdId: accountBody.data.householdId || "",
        holderMemberId: accountBody.data.holderMemberId || "",
      });
      setAssets(assetsBody.data || []);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t("accounts.edit.loadFailed"),
      );
    }
  }
  useEffect(() => {
    params.then(({ id: nextId }) => {
      setId(nextId);
      load(nextId);
    });
    // `load` só depende de `t`, estável por idioma; recarregar a conta a cada render não é desejado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  async function addCurrency() {
    const response = await fetch(`/api/v1/accounts/${id}/balances`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assetId: newAsset,
        amount: newAmount,
        openingDate: newDate,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error?.message || t("accounts.edit.addCurrencyFailed"));
      return;
    }
    setAccount(body.data);
    setNewAsset("");
    setNewAmount("0");
    toast({ variant: "success", title: t("accounts.edit.currencyAdded") });
  }
  if (error && !account)
    return (
      <PageContainer>
        <ErrorState
          title={t("accounts.detail.unavailableTitle")}
          description={error}
          retry={() => load(id)}
          action={
            <Link className="button button-small secondary" href="/accounts">
              {t("accounts.detail.backToAccounts")}
            </Link>
          }
        />
      </PageContainer>
    );
  if (!account)
    return (
      <PageContainer>
        <LoadingState label={t("accounts.edit.loading")} />
      </PageContainer>
    );
  const config = getAccountTypeConfiguration(account.type);
  const options = assets.filter(
    (asset) =>
      config.allowedAssetTypes.includes(asset.type) &&
      !account.balances.some((balance) => balance.assetId === asset.id),
  );
  const card = account.cardProfile
    ? {
        type: account.cardProfile.type,
        brand: account.cardProfile.brand || "",
        lastFour: account.cardProfile.lastFour || "",
        closingDay: account.cardProfile.closingDay?.toString() || "",
        dueDay: account.cardProfile.dueDay?.toString() || "",
        creditLimit: account.cardProfile.creditLimit || "",
        limitAssetId: account.cardProfile.limitAssetId || "",
      }
    : null;
  return (
    <PageContainer size="form">
      <PageHeader
        back={
          <Link className="back-link" href={`/accounts/${id}`}>
            {t("accounts.edit.back")}
          </Link>
        }
        eyebrow={t("accounts.edit.eyebrow")}
        title={t("accounts.edit.title")}
        description={t("accounts.edit.description")}
      />
      <AccountForm
        mode="edit"
        assets={assets}
        initial={{ ...account, id, card }}
        existingBalances={account.balances}
        onSaved={() => {
          window.location.href = `/accounts/${id}`;
        }}
      />
      {config.assetSelection === "multiple" && account.status === "ACTIVE" && (
        <section className="form-card add-balance-card">
          <h2>{t("accounts.edit.addCurrencyTitle")}</h2>
          <p className="section-help">{t("accounts.edit.addCurrencyHelp")}</p>
          <div className="form-two">
            <label>
              {t("accounts.edit.asset")}
              <select
                value={newAsset}
                onChange={(event) => setNewAsset(event.target.value)}
              >
                <option value="">{t("accounts.edit.select")}</option>
                {options.map((asset) => (
                  <option value={asset.id} key={asset.id}>
                    {asset.symbol} {asset.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("accounts.edit.balance")}
              <input
                inputMode="decimal"
                value={newAmount}
                onChange={(event) => setNewAmount(event.target.value)}
              />
            </label>
          </div>
          <label>
            {t("common.fields.date")}
            <input
              type="date"
              value={newDate}
              onChange={(event) => setNewDate(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="button button-small"
            disabled={!newAsset}
            onClick={addCurrency}
          >
            {t("accounts.edit.addCurrencySubmit")}
          </button>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </section>
      )}
    </PageContainer>
  );
}
