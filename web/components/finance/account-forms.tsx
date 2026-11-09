"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ds/button";
import { Dialog } from "@/components/ds/dialog";
import { Field, Input, Select } from "@/components/ds/field";
import { useToast } from "@/components/ui/toast-provider";
import { api, decimalInput } from "@/lib/finance/client";
import { useI18n } from "@/lib/i18n/client";

/**
 * Ajusta o saldo para bater com o banco: grava um lançamento ADJUSTMENT com a diferença.
 * Não altera o saldo inicial nem apaga histórico.
 */
export function AdjustBalance({
  accountId,
  accountName,
  assetId,
  assetCode,
  current,
}: {
  accountId: string;
  accountName: string;
  assetId: string;
  assetCode: string;
  current: number;
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [negative, setNegative] = useState(current < 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const absolute = decimalInput(text("real"));
    if (absolute === null) return setError(t("accounts.adjust.invalid"));
    const target = (negative ? -1 : 1) * Number(absolute);
    const diff = Math.round((target - current) * 1e8) / 1e8;
    if (diff === 0) return setOpen(false);
    const result = await api("/api/v1/transactions", "POST", {
      date: text("date"),
      accountId,
      assetId,
      description: t("accounts.adjust.transactionDescription"),
      amount: Math.abs(diff).toFixed(8).replace(/0+$/, "").replace(/\.$/, ""),
      direction: diff > 0 ? "CREDIT" : "DEBIT",
      type: "ADJUSTMENT",
    });
    if (!result.ok) return setError(result.error);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="tertiary" size="compact" onClick={() => setOpen(true)}>
        {t("accounts.adjust.button")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("accounts.adjust.title", {
          account: accountName,
          code: assetCode,
        })}
        description={t("accounts.adjust.description", {
          amount: fmt.money(current, assetCode),
        })}
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <Field label={t("accounts.adjust.realBalance", { code: assetCode })}>
            <Input
              name="real"
              inputMode="decimal"
              required
              defaultValue={Math.abs(current)}
            />
          </Field>
          <Field label={t("accounts.adjust.sign")}>
            <Select
              value={negative ? "-" : "+"}
              onChange={(e) => setNegative(e.target.value === "-")}
            >
              <option value="+">{t("accounts.adjust.positive")}</option>
              <option value="-">{t("accounts.adjust.negative")}</option>
            </Select>
          </Field>
          <Field label={t("common.fields.date")}>
            <Input
              type="date"
              name="date"
              defaultValue={fmt.today()}
              required
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
            <Button type="submit">{t("accounts.adjust.submit")}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function NewRate({
  currencies,
  baseCode,
}: {
  currencies: string[];
  baseCode: string;
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const rate = decimalInput(text("rate"));
    if (!rate) return setError(t("accounts.rates.invalid"));
    setSaving(true);
    const result = await api("/api/v1/exchange-rates", "POST", {
      from: text("from"),
      to: baseCode,
      rate,
      date: text("date"),
    });
    setSaving(false);
    if (!result.ok) return setError(result.error);
    setError(null);
    form.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
    >
      <Field label={t("common.fields.date")}>
        <Input type="date" name="date" defaultValue={fmt.today()} required />
      </Field>
      <Field label={t("common.fields.currency")}>
        <Select name="from">
          {currencies
            .filter((c) => c !== baseCode)
            .map((c) => (
              <option key={c}>{c}</option>
            ))}
        </Select>
      </Field>
      <Field label={t("accounts.rates.perUnit", { base: baseCode })}>
        <Input
          name="rate"
          inputMode="decimal"
          required
          placeholder={t("accounts.rates.ratePlaceholder")}
        />
      </Field>
      <Button type="submit" variant="secondary" disabled={saving}>
        {t("accounts.rates.submit")}
      </Button>
      {error && (
        <p className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger sm:col-span-4">
          {error}
        </p>
      )}
    </form>
  );
}

export function DeactivateRate({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    const result = await api(`/api/v1/exchange-rates/${id}`, "DELETE");
    setBusy(false);
    if (!result.ok) return toast({ variant: "error", title: result.error });
    toast({ variant: "success", title: t("accounts.rates.deactivated") });
    router.refresh();
  }
  return (
    <Button variant="tertiary" size="compact" onClick={run} disabled={busy}>
      {t("accounts.rates.deactivate")}
    </Button>
  );
}
