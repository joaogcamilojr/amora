"use client";

import { useMemo } from "react";

import { getCountryOptions } from "@/lib/countries";
import { useI18n } from "@/lib/i18n/client";

export function CountrySelect({
  value,
  onChange,
  required,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  const { t, fmt } = useI18n();
  const options = useMemo(() => getCountryOptions(fmt.locale), [fmt.locale]);
  return (
    <label>
      {t("common.fields.country")}
      {required && t("accounts.form.requiredMark")}
      <select
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t("accounts.form.countryPlaceholder")}</option>
        {options.map((country) => (
          <option value={country.value} key={country.value}>
            {country.label} — {country.value}
          </option>
        ))}
      </select>
    </label>
  );
}
