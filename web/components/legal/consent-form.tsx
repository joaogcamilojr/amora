"use client";

import { useState, type FormEvent } from "react";

import { Button, buttonClasses } from "@/components/ds/button";
import { api } from "@/lib/finance/client";
import { useI18n } from "@/lib/i18n/client";

import { AcceptLinks } from "./accept-links";

/** Navegação completa: o aceite muda o que o layout autenticado decide. */
const leave = (href: string) => window.location.assign(href);

export function ConsentForm({
  versions,
}: {
  versions: { terms: string; privacy: string };
}) {
  const { t } = useI18n();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await api("/api/v1/me/consents", "POST", { accept: true });
    if (!result.ok) {
      setBusy(false);
      return setError(result.error);
    }
    leave("/dashboard");
  }

  async function signOut() {
    await api("/api/v1/auth/logout", "POST");
    leave("/login");
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-5 rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-6"
    >
      <p className="text-sm text-neutral-600">
        {t("legal.consent.description")}
      </p>
      <label className="flex items-start gap-2 text-sm text-neutral-800 [&_a]:font-medium [&_a]:text-brand-700 [&_a]:underline">
        <input
          type="checkbox"
          className="mt-1"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          required
        />
        <span>
          <AcceptLinks />
        </span>
      </label>
      <p className="text-[12px] text-neutral-500">
        {t("legal.consent.versionNote", versions)}
      </p>
      {error && (
        <p className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !checked}>
          {busy ? t("legal.consent.saving") : t("legal.consent.submit")}
        </Button>
        <a
          href="/api/v1/me/export"
          download
          className={buttonClasses("secondary")}
        >
          {t("legal.consent.exportData")}
        </a>
        <Button
          variant="tertiary"
          onClick={() => void signOut()}
          disabled={busy}
        >
          {t("legal.consent.signOut")}
        </Button>
      </div>
      <p className="text-[12px] text-neutral-500">
        {t("legal.consent.rights")}
      </p>
    </form>
  );
}
