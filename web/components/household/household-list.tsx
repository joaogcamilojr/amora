"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Dialog } from "@/components/ds/dialog";
import { Field, Input } from "@/components/ds/field";
import { IconPlus } from "@/components/ds/icons";
import { useToast } from "@/components/ui/toast-provider";
import { api } from "@/lib/finance/client";
import type { listHouseholds } from "@/lib/finance/households";
import { useI18n } from "@/lib/i18n/client";

type Households = Awaited<ReturnType<typeof listHouseholds>>["households"];

export function NewHousehold() {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(
      new FormData(event.currentTarget).get("name") ?? "",
    ).trim();
    const result = await api<{ id: string }>("/api/v1/households", "POST", {
      name,
    });
    if (!result.ok) return setError(result.error);
    toast({ variant: "success", title: t("household.created") });
    setOpen(false);
    router.push(`/household/${result.data.id}`);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <IconPlus size={16} /> {t("household.create.title")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("household.create.title")}
      >
        <form onSubmit={submit} className="grid gap-4">
          <Field label={t("household.create.name")}>
            <Input
              name="name"
              required
              maxLength={80}
              placeholder={t("household.create.namePlaceholder")}
            />
          </Field>
          {error && (
            <p className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit">{t("household.create.submit")}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function HouseholdList({ households }: { households: Households }) {
  const { t } = useI18n();
  if (!households.length)
    return (
      <div className="rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-8 text-center">
        <p className="text-sm font-medium text-neutral-900">
          {t("household.empty")}
        </p>
        <p className="mt-1 text-[13px] text-neutral-600">
          {t("household.emptyHint")}
        </p>
      </div>
    );
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {households.map((h) => (
        <li key={h.id}>
          <Link
            href={`/household/${h.id}`}
            className="flex h-full flex-col gap-2 rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-5 hover:border-brand-500"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-[15px] font-semibold text-neutral-950">
                {h.name}
              </span>
              <Badge tone={h.role === "ADMIN" ? "brand" : "neutral"}>
                {t(`enums.householdRole.${h.role}`)}
              </Badge>
            </span>
            <span className="text-[13px] text-neutral-600">
              {t("household.list.members", { count: h.memberCount })} ·{" "}
              {t("household.list.accounts", { count: h.accountCount })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
