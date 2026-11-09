"use client";

import type { AccountType } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";

import { SharePanel } from "@/components/share-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/lib/i18n/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function AccountDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [account, setAccount] = useState<any>(null);
  const [error, setError] = useState(false);
  const [confirm, setConfirm] = useState<
    "archive" | "restore" | "delete" | null
  >(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  async function load(nextId: string) {
    try {
      const response = await fetch(`/api/v1/accounts/${nextId}`);
      if (!response.ok) throw new Error();
      setAccount((await response.json()).data);
    } catch {
      setError(true);
    }
  }
  useEffect(() => {
    params.then(({ id: nextId }) => {
      setId(nextId);
      load(nextId);
    });
  }, [params]);
  async function action() {
    if (!confirm) return;
    setBusy(true);
    const method = confirm === "delete" ? "DELETE" : "POST";
    const response = await fetch(
      `/api/v1/accounts/${id}${confirm === "delete" ? "" : `/${confirm}`}`,
      { method },
    );
    setBusy(false);
    if (!response.ok) {
      setConfirm(null);
      toast({
        variant: "error",
        title: t("accounts.detail.toast.failedTitle"),
        description: t("accounts.detail.toast.failedDescription"),
      });
      return;
    }
    if (confirm === "delete") {
      toast({ variant: "success", title: t("accounts.detail.toast.deleted") });
      window.location.href = "/accounts";
      return;
    }
    setAccount({
      ...account,
      status: confirm === "archive" ? "ARCHIVED" : "ACTIVE",
    });
    toast({
      variant: "success",
      title: t(
        confirm === "archive"
          ? "accounts.detail.toast.archived"
          : "accounts.detail.toast.restored",
      ),
    });
    setConfirm(null);
  }
  if (error)
    return (
      <PageContainer>
        <ErrorState
          title={t("accounts.detail.unavailableTitle")}
          description={t("accounts.detail.unavailableDescription")}
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
        <LoadingState label={t("accounts.detail.loading")} />
      </PageContainer>
    );
  const typeLabel = t(`enums.accountType.${account.type as AccountType}.label`);
  return (
    <PageContainer size="form">
      <PageHeader
        back={
          <Link className="back-link" href="/accounts">
            {t("accounts.detail.back")}
          </Link>
        }
        eyebrow={
          account.status === "ARCHIVED"
            ? t("accounts.detail.archivedEyebrow")
            : typeLabel
        }
        title={account.name}
        description={account.institutionName || typeLabel}
        actions={
          <>
            <Link className="button button-small" href={`/accounts/${id}/edit`}>
              {t("common.actions.edit")}
            </Link>
            <button
              className="button button-small secondary"
              onClick={() =>
                setConfirm(account.status === "ACTIVE" ? "archive" : "restore")
              }
            >
              {account.status === "ACTIVE"
                ? t("common.actions.archive")
                : t("accounts.detail.restore")}
            </button>
          </>
        }
      />
      <section className="balance-detail">
        <h2>{t("accounts.detail.balancesTitle")}</h2>
        {account.balances.length ? (
          account.balances.map((balance: any) => (
            <div className="balance-row" key={balance.id}>
              <span>
                <b>
                  {balance.asset.symbol} {balance.asset.code}
                </b>
                <small>{balance.asset.name}</small>
              </span>
              <strong>{balance.currentBalance}</strong>
            </div>
          ))
        ) : (
          <p>{t("accounts.detail.zeroBalance")}</p>
        )}
      </section>
      <SharePanel accountId={id} />
      <section className="danger-zone">
        <h2>{t("accounts.detail.deletionTitle")}</h2>
        <p>{t("accounts.detail.deletionHelp")}</p>
        <button className="text-danger" onClick={() => setConfirm("delete")}>
          {t("accounts.detail.deleteIfEmpty")}
        </button>
      </section>
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === "delete"
            ? t("accounts.detail.confirm.deleteTitle")
            : confirm === "archive"
              ? t("accounts.detail.confirm.archiveTitle")
              : t("accounts.detail.confirm.restoreTitle")
        }
        description={
          confirm === "delete"
            ? t("accounts.detail.confirm.deleteDescription")
            : t("accounts.detail.confirm.otherDescription")
        }
        confirmLabel={
          confirm === "delete"
            ? t("common.actions.delete")
            : confirm === "archive"
              ? t("common.actions.archive")
              : t("accounts.detail.restore")
        }
        destructive={confirm === "delete" || confirm === "archive"}
        busy={busy}
        onConfirm={action}
        onCancel={() => setConfirm(null)}
      />
    </PageContainer>
  );
}
