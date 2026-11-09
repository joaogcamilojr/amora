"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ds/button";
import { Dialog } from "@/components/ds/dialog";
import { Field, Input, Select } from "@/components/ds/field";
import { IconPlus } from "@/components/ds/icons";
import { cx } from "@/lib/cx";
import { api, decimalInput } from "@/lib/finance/client";
import { splitPocket, type Pocket } from "@/lib/finance/pockets";
import type { CategoryView } from "@/lib/finance/types";
import { useI18n } from "@/lib/i18n/client";

type Mode = "entry" | "transfer";

export function NewTransaction({
  pockets,
  categories,
  baseCode: baseCodeProp,
  openInitially,
  returnTo = "/transactions",
}: {
  pockets: Pocket[];
  categories: CategoryView[];
  baseCode?: string;
  openInitially?: boolean;
  returnTo?: string;
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const baseCode = baseCodeProp ?? fmt.baseCurrency;
  const [open, setOpen] = useState(Boolean(openInitially));
  const [mode, setMode] = useState<Mode>("entry");
  const [direction, setDirection] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const today = fmt.today();

  function close() {
    setOpen(false);
    setError(null);
    if (openInitially) router.replace(returnTo);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const fee = text("fee") ? decimalInput(text("fee")) : undefined;
    let url: string;
    let payload: Record<string, unknown>;
    if (mode === "entry") {
      const amount = decimalInput(text("amount"));
      if (!amount) return setError(t("transactions.form.errors.invalidAmount"));
      const { accountId, assetId } = splitPocket(text("pocket"));
      url = "/api/v1/transactions";
      payload = {
        date: text("date"),
        accountId,
        assetId,
        description: text("description"),
        amount,
        direction,
        categoryId: text("categoryId") || undefined,
        fxFeeBase: fee ?? undefined,
        tags: text("tags")
          .split(",")
          .map((tag) => tag.trim().replace(/^#/, ""))
          .filter(Boolean),
      };
    } else {
      const fromAmount = decimalInput(text("fromAmount"));
      if (!fromAmount)
        return setError(t("transactions.form.errors.invalidFromAmount"));
      const toAmount = text("toAmount")
        ? decimalInput(text("toAmount"))
        : fromAmount;
      if (!toAmount)
        return setError(t("transactions.form.errors.invalidToAmount"));
      const from = splitPocket(text("from"));
      const to = splitPocket(text("to"));
      url = "/api/v1/transfers";
      payload = {
        date: text("date"),
        description: text("description") || undefined,
        fromAccountId: from.accountId,
        fromAssetId: from.assetId,
        fromAmount,
        toAccountId: to.accountId,
        toAssetId: to.assetId,
        toAmount,
        fxFeeBase: fee ?? undefined,
      };
    }
    setSaving(true);
    const result = await api(url, "POST", payload);
    setSaving(false);
    if (!result.ok) return setError(result.error);
    close();
    router.refresh();
  }

  const kind = direction === "DEBIT" ? "EXPENSE" : "INCOME";

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <IconPlus size={16} /> {t("transactions.form.open")}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={t("transactions.form.title")}
        description={t("transactions.form.description", { currency: baseCode })}
      >
        <div
          role="tablist"
          className="mb-5 inline-flex rounded-[var(--radius-control)] bg-neutral-100 p-1 text-[13px]"
        >
          {(["entry", "transfer"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cx(
                "h-8 rounded-[6px] px-3 font-medium",
                mode === m
                  ? "bg-surface text-neutral-950 shadow-[var(--shadow-hover)]"
                  : "text-neutral-600",
              )}
            >
              {t(`transactions.form.modes.${m}`)}
            </button>
          ))}
        </div>

        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Field label={t("common.fields.date")}>
            <Input type="date" name="date" defaultValue={today} required />
          </Field>

          {mode === "entry" ? (
            <>
              <Field label={t("common.fields.account")}>
                <Select name="pocket" required>
                  {pockets.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("common.fields.description")}>
                  <Input
                    name="description"
                    required
                    maxLength={200}
                    placeholder={t("transactions.form.descriptionPlaceholder")}
                  />
                </Field>
              </div>
              <Field label={t("transactions.form.direction")}>
                <Select
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as "DEBIT" | "CREDIT")
                  }
                >
                  <option value="DEBIT">{t("transactions.form.debit")}</option>
                  <option value="CREDIT">
                    {t("transactions.form.credit")}
                  </option>
                </Select>
              </Field>
              <Field label={t("common.fields.amount")}>
                <Input
                  name="amount"
                  inputMode="decimal"
                  required
                  placeholder={t("transactions.form.amountPlaceholder")}
                />
              </Field>
              <Field
                label={t("common.fields.category")}
                hint={t("transactions.form.categoryHint")}
              >
                <Select name="categoryId" defaultValue="">
                  <option value="">{t("transactions.form.automatic")}</option>
                  {categories
                    .filter((c) => c.kind === kind)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field
                label={t("transactions.form.fee", { currency: baseCode })}
                hint={t("transactions.form.feeHint")}
              >
                <Input
                  name="fee"
                  inputMode="decimal"
                  placeholder={t("transactions.form.amountPlaceholder")}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label={t("common.fields.tags")}
                  hint={t("transactions.form.tagsHint")}
                >
                  <Input
                    name="tags"
                    placeholder={t("transactions.form.tagsPlaceholder")}
                  />
                </Field>
              </div>
            </>
          ) : (
            <>
              <Field label={t("common.fields.description")}>
                <Input
                  name="description"
                  maxLength={200}
                  placeholder={t(
                    "transactions.form.transferDescriptionPlaceholder",
                  )}
                />
              </Field>
              <Field label={t("transactions.form.from")}>
                <Select name="from" required>
                  {pockets
                    .filter((p) => !p.isCard)
                    .map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label={t("transactions.form.fromAmount")}>
                <Input
                  name="fromAmount"
                  inputMode="decimal"
                  required
                  placeholder={t("transactions.form.fromAmountPlaceholder")}
                />
              </Field>
              <Field
                label={t("transactions.form.to")}
                hint={t("transactions.form.toHint")}
              >
                <Select name="to" required>
                  {pockets.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label={t("transactions.form.toAmount")}
                hint={t("transactions.form.toAmountHint")}
              >
                <Input
                  name="toAmount"
                  inputMode="decimal"
                  placeholder={t("transactions.form.toAmountPlaceholder")}
                />
              </Field>
              <Field
                label={t("transactions.form.transferFee", {
                  currency: baseCode,
                })}
              >
                <Input
                  name="fee"
                  inputMode="decimal"
                  placeholder={t("transactions.form.amountPlaceholder")}
                />
              </Field>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger sm:col-span-2"
            >
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={close}>
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
