"use client";

import type { AccountType } from "@prisma/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AccountForm } from "@/components/accounts/account-form";
import { Asset } from "@/components/accounts/opening-balances-editor";
import { ErrorState } from "@/components/ui/error-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ACCOUNT_TYPE_CONFIGURATIONS } from "@/lib/accounts/account-types";
import { isCountryCode } from "@/lib/countries";
import { useI18n } from "@/lib/i18n/client";

/** `?type=` e `?country=` pré-preenchem o formulário (links do onboarding). */
function NewAccount() {
  const { t } = useI18n();
  const params = useSearchParams();
  const type = params.get("type");
  const country = params.get("country");
  const initial = {
    ...(type && Object.hasOwn(ACCOUNT_TYPE_CONFIGURATIONS, type)
      ? { type: type as AccountType }
      : {}),
    ...(isCountryCode(country) ? { countryCode: country.toUpperCase() } : {}),
  };
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch("/api/v1/assets")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setAssets((await response.json()).data || []);
      })
      .catch(() => setError(true));
  }, []);
  return (
    <PageContainer size="form">
      <PageHeader
        back={
          <Link className="back-link" href="/accounts">
            {t("accounts.create.back")}
          </Link>
        }
        eyebrow={t("accounts.create.eyebrow")}
        title={t("accounts.create.title")}
        description={t("accounts.create.description")}
      />
      {error ? (
        <ErrorState
          title={t("accounts.create.catalogUnavailableTitle")}
          description={t("accounts.create.catalogUnavailableDescription")}
          retry={() => window.location.reload()}
        />
      ) : (
        <AccountForm
          mode="create"
          assets={assets}
          initial={initial}
          onSaved={(account) => {
            window.location.href = `/accounts/${account.id}`;
          }}
        />
      )}
    </PageContainer>
  );
}

export default function NewAccountPage() {
  return (
    <Suspense>
      <NewAccount />
    </Suspense>
  );
}
