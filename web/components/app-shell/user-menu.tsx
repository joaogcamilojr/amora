"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { IconLogout } from "@/components/ds/icons";
import { useToast } from "@/components/ui/toast-provider";
import { cx } from "@/lib/cx";
import { api } from "@/lib/finance/client";
import { useI18n } from "@/lib/i18n/client";

export type Workspaces = {
  activeHouseholdId: string | null;
  households: { id: string; name: string }[];
};

export function UserMenu({
  name,
  email,
  workspaces,
  compact = false,
}: {
  name?: string | null;
  email: string;
  workspaces: Workspaces;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const display = name || email;
  const initials = display
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function switchWorkspace(householdId: string) {
    const result = await api("/api/v1/me/active-household", "PUT", {
      householdId: householdId || null,
    });
    if (!result.ok) {
      toast({ variant: "error", title: result.error });
      return;
    }
    toast({ variant: "success", title: t("household.workspace.changed") });
    setOpen(false);
    router.refresh();
  }

  async function logout() {
    setBusy(true);
    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      window.location.href = "/login";
    } catch {
      setBusy(false);
      toast({
        variant: "error",
        title: t("shell.signOutFailed"),
        description: t("shell.signOutFailedHint"),
      });
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("shell.userMenu")}
        onClick={() => setOpen(!open)}
        className={cx(
          "flex w-full items-center gap-3 rounded-[var(--radius-control)] p-2 text-left hover:bg-white/5",
          compact && "w-auto p-1",
        )}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-[12px] font-semibold text-white">
          {initials}
        </span>
        {!compact && (
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-medium text-white">
              {display}
            </span>
            <span className="block truncate text-[12px] text-neutral-500">
              {email}
            </span>
          </span>
        )}
      </button>
      {open && (
        <div
          className={cx(
            "absolute z-30 w-56 rounded-[var(--radius-control)] border border-neutral-200 bg-surface p-2 text-neutral-800 shadow-[var(--shadow-popover)]",
            compact ? "top-full right-0 mt-2" : "bottom-full left-0 mb-2",
          )}
        >
          <p className="truncate px-2 pt-1 text-[13px] font-semibold text-neutral-950">
            {display}
          </p>
          <p className="truncate px-2 pb-2 text-[12px] text-neutral-500">
            {email}
          </p>
          {workspaces.households.length > 0 && (
            <label className="mb-1 flex flex-col gap-1 px-2 pb-2">
              <span className="text-[12px] text-neutral-500">
                {t("household.workspace.label")}
              </span>
              <select
                value={workspaces.activeHouseholdId ?? ""}
                onChange={(e) => switchWorkspace(e.target.value)}
                className="h-8 rounded-[6px] border border-neutral-200 bg-surface px-2 text-[13px] text-neutral-800"
              >
                <option value="">{t("household.workspace.all")}</option>
                {workspaces.households.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Link
            href="/household"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-[13px] hover:bg-neutral-100"
          >
            {t("nav.items.household")}
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-[13px] hover:bg-neutral-100"
          >
            {t("shell.preferences")}
          </Link>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-[13px] hover:bg-neutral-100 disabled:opacity-50"
          >
            <IconLogout size={16} />
            {busy ? t("shell.signingOut") : t("shell.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
