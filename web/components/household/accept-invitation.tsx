"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/ds/button";
import { api } from "@/lib/finance/client";
import { useI18n } from "@/lib/i18n/client";

export function AcceptInvitation({ token }: { token: string | null }) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : t("household.accept.missingToken"),
  );
  const [joined, setJoined] = useState<{
    householdId: string;
    name: string;
  } | null>(null);

  async function accept() {
    setBusy(true);
    const result = await api<{ householdId: string; name: string }>(
      "/api/v1/households/invitations/accept",
      "POST",
      { token },
    );
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setError(null);
    setJoined(result.data);
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-[480px] gap-4 rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-6">
      <h1 className="text-xl font-semibold text-neutral-950">
        {t("household.accept.title")}
      </h1>
      {joined ? (
        <>
          <p role="status" className="text-sm text-neutral-800">
            {t("household.accept.success", { name: joined.name })}
          </p>
          <ButtonLink href={`/household/${joined.householdId}`}>
            {t("household.accept.goToGroup")}
          </ButtonLink>
        </>
      ) : (
        <>
          <p className="text-[13px] text-neutral-600">
            {t("household.accept.hint")}
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger"
            >
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Link
              href="/household"
              className="grid h-9 place-items-center px-3 text-sm text-neutral-700 hover:underline"
            >
              {t("common.actions.cancel")}
            </Link>
            <Button onClick={accept} disabled={busy || !token}>
              {t("household.accept.submit")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
