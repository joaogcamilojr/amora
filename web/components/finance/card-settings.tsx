"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ds/button";
import { Dialog } from "@/components/ds/dialog";
import { Field, Input, Select } from "@/components/ds/field";
import { api, decimalInput } from "@/lib/finance/client";
import type { AccountView } from "@/lib/finance/types";
import { useI18n } from "@/lib/i18n/client";

export function CardSettings({
  card,
  payers,
  defaultLimitAssetId,
}: {
  card: AccountView;
  payers: { id: string; name: string }[];
  defaultLimitAssetId: string | null;
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const c = card.card;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!c) return;
    setError(null);
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const limit = decimalInput(text("limit"));
    const closingDay = Number(text("closingDay"));
    const dueDay = Number(text("dueDay"));
    const cashbackPct = text("cashback") ? decimalInput(text("cashback")) : "0";
    if (
      !limit ||
      !(closingDay >= 1 && closingDay <= 31) ||
      !(dueDay >= 1 && dueDay <= 31) ||
      cashbackPct === null
    )
      return setError(t("cards.settings.invalid"));
    setSaving(true);
    const result = await api(`/api/v1/accounts/${card.id}`, "PATCH", {
      notes: text("notes") || null,
      card: {
        type: c.type,
        brand: c.brand,
        lastFour: c.lastFour,
        closingDay,
        dueDay,
        creditLimit: limit,
        limitAssetId: c.limitAssetId ?? defaultLimitAssetId,
        cashbackRate: (Number(cashbackPct) / 100)
          .toFixed(6)
          .replace(/0+$/, "")
          .replace(/\.$/, ""),
        paymentAccountId: text("paymentAccountId") || null,
      },
    });
    setSaving(false);
    if (!result.ok) return setError(result.error);
    setOpen(false);
    router.refresh();
  }

  if (!c || !card.isOwner) return null;

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t("cards.settings.open")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("cards.settings.title", { name: card.name })}
        description={t("cards.settings.description")}
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Field label={t("cards.settings.limit")}>
            <Input
              name="limit"
              inputMode="decimal"
              defaultValue={c.creditLimit ?? 0}
              required
            />
          </Field>
          <Field
            label={t("cards.settings.cashback")}
            hint={t("cards.settings.cashbackHint")}
          >
            <Input
              name="cashback"
              inputMode="decimal"
              defaultValue={
                c.cashbackRate
                  ? fmt.number(+(c.cashbackRate * 100).toFixed(4), 4)
                  : ""
              }
            />
          </Field>
          <Field label={t("cards.settings.closingDay")}>
            <Input
              name="closingDay"
              type="number"
              min={1}
              max={31}
              defaultValue={c.closingDay ?? ""}
              required
            />
          </Field>
          <Field label={t("cards.settings.dueDay")}>
            <Input
              name="dueDay"
              type="number"
              min={1}
              max={31}
              defaultValue={c.dueDay ?? ""}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("cards.settings.paymentAccount")}>
              <Select
                name="paymentAccountId"
                defaultValue={c.paymentAccountId ?? ""}
              >
                <option value="">{t("common.states.none")}</option>
                {payers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label={t("cards.settings.notes")}>
              <Input
                name="notes"
                defaultValue={card.notes ?? ""}
                maxLength={1000}
                placeholder={t("cards.settings.notesPlaceholder")}
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
            <Button type="submit" disabled={saving}>
              {saving ? t("common.actions.saving") : t("common.actions.save")}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
