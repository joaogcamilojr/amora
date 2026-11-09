"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ds/button";
import { Dialog } from "@/components/ds/dialog";
import { Field, Input } from "@/components/ds/field";
import { IconPlus } from "@/components/ds/icons";
import { api } from "@/lib/finance/client";
import { useI18n } from "@/lib/i18n/client";

export function NewTrip() {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const result = await api("/api/v1/trips", "POST", {
      name: text("name"),
      tag: text("tag") || undefined,
      startsOn: text("startsOn") || undefined,
      endsOn: text("endsOn") || undefined,
      countryCodes: text("countries")
        .split(/[,\s]+/)
        .filter(Boolean),
    });
    if (!result.ok) return setError(result.error);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <IconPlus size={16} /> {t("trips.newTrip.button")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("trips.newTrip.title")}
        description={t("trips.newTrip.description")}
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Field label={t("trips.newTrip.name")}>
            <Input
              name="name"
              required
              maxLength={80}
              placeholder={t("trips.newTrip.namePlaceholder")}
            />
          </Field>
          <Field
            label={t("trips.newTrip.tag")}
            hint={t("trips.newTrip.tagHint")}
          >
            <Input
              name="tag"
              maxLength={64}
              placeholder={t("trips.newTrip.tagPlaceholder")}
            />
          </Field>
          <Field label={t("trips.newTrip.startsOn")}>
            <Input type="date" name="startsOn" />
          </Field>
          <Field label={t("trips.newTrip.endsOn")}>
            <Input type="date" name="endsOn" />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label={t("trips.newTrip.countries")}
              hint={t("trips.newTrip.countriesHint")}
            >
              <Input
                name="countries"
                placeholder={t("trips.newTrip.countriesPlaceholder")}
              />
            </Field>
          </div>
          {error && (
            <p className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit">{t("common.actions.save")}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
