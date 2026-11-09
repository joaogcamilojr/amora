"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button, buttonClasses } from "@/components/ds/button";
import { Field, Input } from "@/components/ds/field";
import { useToast } from "@/components/ui/toast-provider";
import { api } from "@/lib/finance/client";
import { useI18n } from "@/lib/i18n/client";

export interface DeletionStatus {
  graceDays: number;
  pending: { scheduledFor: string | null } | null;
  sharedAccounts: number;
}

export function PrivacyPanel({ email, status }: { email: string; status: DeletionStatus }) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const matches = confirm.trim().toLowerCase() === email.toLowerCase();

  async function run(request: () => ReturnType<typeof api>, success: string) {
    setBusy(true);
    const result = await request();
    setBusy(false);
    if (!result.ok) return toast({ variant: "error", title: t("privacy.deletion.failed"), description: result.error });
    toast({ variant: "success", title: success });
    setConfirm("");
    router.refresh();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => api("/api/v1/me/data-deletion", "POST", { confirmEmail: confirm }), t("privacy.deletion.requested"));
  }

  const downloads = [
    { href: "/api/v1/me/export?format=json", label: t("privacy.export.json") },
    { href: "/api/v1/me/export?format=csv&dataset=transactions", label: t("privacy.export.csvTransactions") },
    { href: "/api/v1/me/export?format=csv&dataset=accounts", label: t("privacy.export.csvAccounts") },
  ];

  return (
    <div id="privacy" className="mt-6 grid scroll-mt-6 gap-6">
      <section className="grid gap-3 rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">{t("privacy.export.title")}</h2>
          <p className="text-sm text-neutral-600">{t("privacy.export.description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {downloads.map((d) => (
            <a key={d.href} href={d.href} download className={buttonClasses("secondary")}>
              {d.label}
            </a>
          ))}
        </div>
        <p className="text-[12px] text-neutral-500">{t("privacy.export.hint")}</p>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">{t("privacy.deletion.title")}</h2>
          <p className="text-sm text-neutral-600">{t("privacy.deletion.description", { days: status.graceDays })}</p>
        </div>
        {status.pending ? (
          <div className="grid gap-3 rounded-[var(--radius-control)] bg-warning-bg p-4">
            <p className="text-sm font-medium text-warning">{t("privacy.deletion.pendingTitle")}</p>
            <p className="text-[13px] text-neutral-800">
              {t("privacy.deletion.pendingBody", {
                date: status.pending.scheduledFor ? fmt.civilDate(status.pending.scheduledFor.slice(0, 10)) : "—",
              })}
            </p>
            <div>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void run(() => api("/api/v1/me/data-deletion", "DELETE"), t("privacy.deletion.canceled"))}
              >
                {t("privacy.deletion.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            <div>
              <p className="mb-1 text-[12px] font-medium text-neutral-800">{t("privacy.deletion.consequences.title")}</p>
              <ul className="list-disc pl-5 text-[13px] text-neutral-600">
                <li>{t("privacy.deletion.consequences.anonymized")}</li>
                <li>{t("privacy.deletion.consequences.archived")}</li>
                <li>{t("privacy.deletion.consequences.history")}</li>
                <li>{t("privacy.deletion.consequences.irreversible")}</li>
              </ul>
            </div>
            {status.sharedAccounts > 0 && (
              <p className="rounded-[var(--radius-control)] bg-warning-bg p-3 text-[13px] text-warning">
                {t("privacy.deletion.shared", { count: status.sharedAccounts })}
              </p>
            )}
            <Field label={t("privacy.deletion.confirmLabel", { email })}>
              <Input
                type="email"
                value={confirm}
                autoComplete="off"
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            <div>
              <Button type="submit" variant="danger" disabled={busy || !matches}>
                {t("privacy.deletion.request")}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
