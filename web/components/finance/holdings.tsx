"use client";

import type { HoldingClass } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ds/button";
import { ConfirmDialog, Dialog } from "@/components/ds/dialog";
import { Field, Input, Select } from "@/components/ds/field";
import { IconPlus, IconTrash } from "@/components/ds/icons";
import { api, decimalInput } from "@/lib/finance/client";
import { getCountryOptions } from "@/lib/countries";
import type { HoldingView } from "@/lib/finance/types";
import { useI18n } from "@/lib/i18n/client";

const HOLDING_CLASSES: HoldingClass[] = [
  "REAL_ESTATE",
  "VEHICLE",
  "FIXED_INCOME",
  "EQUITY",
  "INTERNATIONAL",
  "CRYPTO",
  "PENSION",
  "OTHER",
];

function HoldingForm({
  initial,
  currencies,
  homeCountry,
  onSave,
  onCancel,
}: {
  initial?: HoldingView;
  currencies: string[];
  homeCountry: string | null;
  onSave: (payload: Record<string, unknown>) => Promise<string | null>;
  onCancel: () => void;
}) {
  const { t, fmt } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string | null }[]>(
    [],
  );
  useEffect(() => {
    api<{ members: { id: string; name: string | null }[] }>(
      "/api/v1/households/options",
      "GET",
    ).then((result) => {
      if (result.ok) setMembers(result.data.members);
    });
  }, []);
  const countries = useMemo(() => getCountryOptions(fmt.locale), [fmt.locale]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const value = decimalInput(text("value"));
    if (value === null) return setError(t("holdings.form.invalidValue"));
    const quantity = text("quantity") ? decimalInput(text("quantity")) : null;
    if (text("quantity") && quantity === null)
      return setError(t("holdings.form.invalidQuantity"));
    setError(
      await onSave({
        name: text("name"),
        class: text("class"),
        holderName: text("holderName") || null,
        ...(members.length
          ? { holderMemberId: text("holderMemberId") || null }
          : {}),
        assetId: text("currency"),
        value,
        quantity,
        ticker: text("ticker") || null,
        countryCode: text("countryCode") || null,
        valuedAt: fmt.today(),
      }),
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label={t("holdings.form.description")}>
          <Input
            name="name"
            required
            maxLength={120}
            defaultValue={initial?.name}
            placeholder={t("holdings.form.namePlaceholder")}
          />
        </Field>
      </div>
      <Field label={t("holdings.form.class")}>
        <Select name="class" defaultValue={initial?.class ?? "FIXED_INCOME"}>
          {HOLDING_CLASSES.map((v) => (
            <option key={v} value={v}>
              {t(`enums.holdingClass.${v}`)}
            </option>
          ))}
        </Select>
      </Field>
      {members.length > 0 && (
        <Field
          label={t("household.accountForm.holder")}
          hint={t("household.accountForm.holderHint")}
        >
          <Select
            name="holderMemberId"
            defaultValue={initial?.holderMemberId ?? ""}
          >
            <option value="">{t("household.accountForm.holderNone")}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? t("household.detail.unnamedMember")}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label={t("holdings.form.holder")}>
        <Input
          name="holderName"
          maxLength={80}
          defaultValue={initial?.holderName ?? ""}
          placeholder={t("holdings.form.holderPlaceholder")}
        />
      </Field>
      <Field label={t("holdings.form.value")}>
        <Input
          name="value"
          inputMode="decimal"
          required
          defaultValue={initial?.value}
        />
      </Field>
      <Field label={t("holdings.form.currency")}>
        <Select
          name="currency"
          defaultValue={initial?.assetCode ?? fmt.baseCurrency}
        >
          {currencies.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field
        label={t("holdings.form.quantity")}
        hint={t("holdings.form.quantityHint")}
      >
        <Input
          name="quantity"
          inputMode="decimal"
          defaultValue={initial?.quantity ?? ""}
        />
      </Field>
      <Field label={t("holdings.form.ticker")}>
        <Input
          name="ticker"
          maxLength={32}
          defaultValue={initial?.ticker ?? ""}
          placeholder={t("holdings.form.tickerPlaceholder")}
        />
      </Field>
      <Field label={t("holdings.form.country")}>
        <Select
          name="countryCode"
          defaultValue={initial?.countryCode ?? homeCountry ?? ""}
        >
          <option value="">—</option>
          {countries.map((country) => (
            <option key={country.value} value={country.value}>
              {country.label}
            </option>
          ))}
        </Select>
      </Field>
      {error && (
        <p className="rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="secondary" onClick={onCancel}>
          {t("common.actions.cancel")}
        </Button>
        <Button type="submit">{t("common.actions.save")}</Button>
      </div>
    </form>
  );
}

export function NewHolding({
  currencies,
  homeCountry,
}: {
  currencies: string[];
  homeCountry: string | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <IconPlus size={16} /> {t("holdings.form.newButton")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("holdings.form.newTitle")}
      >
        {open && (
          <HoldingForm
            currencies={currencies}
            homeCountry={homeCountry}
            onCancel={() => setOpen(false)}
            onSave={async (payload) => {
              const result = await api("/api/v1/holdings", "POST", payload);
              if (!result.ok) return result.error;
              setOpen(false);
              router.refresh();
              return null;
            }}
          />
        )}
      </Dialog>
    </>
  );
}

export function HoldingsTable({
  rows,
  currencies,
  baseCode,
  homeCountry,
}: {
  rows: HoldingView[];
  currencies: string[];
  baseCode: string;
  homeCountry: string | null;
}) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const [editing, setEditing] = useState<HoldingView | null>(null);
  const [archiving, setArchiving] = useState<HoldingView | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-[13px] leading-[18px]">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-[12px] text-neutral-600">
            <th className="px-5 py-2.5 font-medium">
              {t("holdings.table.description")}
            </th>
            <th className="px-3 py-2.5 font-medium">
              {t("holdings.table.class")}
            </th>
            <th className="px-3 py-2.5 font-medium">
              {t("holdings.table.holder")}
            </th>
            <th className="px-3 py-2.5 text-right font-medium">
              {t("holdings.table.value")}
            </th>
            <th className="px-3 py-2.5 font-medium">
              {t("holdings.table.updated")}
            </th>
            <th
              className="w-10 px-3 py-2.5"
              aria-label={t("holdings.table.actions")}
            />
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr
              key={h.id}
              className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
            >
              <td className="px-5 py-2.5">
                <button
                  type="button"
                  onClick={() => setEditing(h)}
                  className="text-left text-neutral-950 hover:text-brand-700 hover:underline"
                >
                  {h.name}
                </button>
                {(h.ticker || h.quantity !== null) && (
                  <p className="text-[12px] text-neutral-500">
                    {[
                      h.ticker,
                      h.quantity !== null &&
                        t("holdings.table.units", {
                          quantity: fmt.number(h.quantity, 8),
                        }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </td>
              <td className="px-3 py-2.5">
                {t(`enums.holdingClass.${h.class}`)}
              </td>
              <td className="px-3 py-2.5">{h.holderName ?? "—"}</td>
              <td className="tabular px-3 py-2.5 text-right">
                <span className="font-medium text-neutral-950">
                  {fmt.money(h.value, h.assetCode)}
                </span>
                {h.assetCode !== baseCode && (
                  <span className="block text-[12px] text-neutral-500">
                    {h.base === null
                      ? t("common.noRate")
                      : t("accounts.list.approxBase", {
                          amount: fmt.money(h.base, baseCode),
                        })}
                  </span>
                )}
              </td>
              <td className="tabular px-3 py-2.5 text-neutral-600">
                {fmt.civilDate(h.valuedAt)}
              </td>
              <td className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setArchiving(h)}
                  aria-label={t("holdings.table.archiveAria", { name: h.name })}
                  title={t("common.actions.archive")}
                  className="grid h-8 w-8 place-items-center rounded-[var(--radius-control)] text-neutral-500 hover:bg-danger-bg hover:text-danger"
                >
                  <IconTrash size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t("holdings.form.editTitle")}
      >
        {editing && (
          <HoldingForm
            key={editing.id}
            initial={editing}
            currencies={currencies}
            homeCountry={homeCountry}
            onCancel={() => setEditing(null)}
            onSave={async (payload) => {
              const result = await api(
                `/api/v1/holdings/${editing.id}`,
                "PATCH",
                payload,
              );
              if (!result.ok) return result.error;
              setEditing(null);
              router.refresh();
              return null;
            }}
          />
        )}
      </Dialog>
      <ConfirmDialog
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={async () => {
          if (!archiving) return;
          await api(`/api/v1/holdings/${archiving.id}`, "DELETE");
          setArchiving(null);
          router.refresh();
        }}
        title={t("holdings.archive.title")}
        confirmLabel={t("common.actions.archive")}
        description={
          archiving
            ? t("holdings.archive.description", { name: archiving.name })
            : ""
        }
      />
    </div>
  );
}
