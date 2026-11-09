"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ds/button";
import { Dialog } from "@/components/ds/dialog";
import { Field, Input } from "@/components/ds/field";
import { api, decimalInput } from "@/lib/finance/client";
import { useI18n } from "@/lib/i18n/client";

/** Registra o total e as datas oficiais da fatura (do PDF do emissor) para conciliação. */
export function StatementForm({
  accountId,
  month,
  closingDate,
  dueDate,
  total,
}: {
  accountId: string;
  month: string;
  closingDate: string;
  dueDate: string;
  total: number | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const value = text("total") ? decimalInput(text("total")) : null;
    if (text("total") && !value)
      return setError(t("cards.statementForm.invalidTotal"));
    const result = await api(`/api/v1/cards/${accountId}/statements`, "PUT", {
      month,
      closingDate: text("closingDate"),
      dueDate: text("dueDate"),
      total: value,
      source: "manual",
    });
    if (!result.ok) return setError(result.error);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="tertiary" size="compact" onClick={() => setOpen(true)}>
        {total === null
          ? t("cards.statementForm.register")
          : t("cards.statementForm.edit")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("cards.statementForm.title")}
        description={t("cards.statementForm.description")}
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <Field label={t("cards.statementForm.closing")}>
            <Input
              type="date"
              name="closingDate"
              defaultValue={closingDate}
              required
            />
          </Field>
          <Field label={t("cards.statementForm.due")}>
            <Input type="date" name="dueDate" defaultValue={dueDate} required />
          </Field>
          <Field label={t("common.fields.total")}>
            <Input
              name="total"
              inputMode="decimal"
              defaultValue={total ?? ""}
              placeholder={t("cards.statementForm.totalPlaceholder")}
            />
          </Field>
          {error && (
            <p className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger sm:col-span-3">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 sm:col-span-3">
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
