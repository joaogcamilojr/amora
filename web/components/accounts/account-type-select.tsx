"use client";

import { AccountType } from "@prisma/client";

import { ACCOUNT_TYPE_CONFIGURATIONS } from "@/lib/accounts/account-types";
import { useI18n } from "@/lib/i18n/client";

export function AccountTypeSelect({
  value,
  onChange,
  disabled,
}: {
  value: AccountType;
  onChange: (value: AccountType) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const config = ACCOUNT_TYPE_CONFIGURATIONS[value];
  return (
    <label>
      {t("common.fields.type")}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as AccountType)}
      >
        {Object.values(ACCOUNT_TYPE_CONFIGURATIONS).map((item) => (
          <option value={item.value} key={item.value}>
            {t(`enums.accountType.${item.value}.label`)}
          </option>
        ))}
      </select>
      {config && (
        <span className="field-note">
          {t(`enums.accountType.${config.value}.description`)}
        </span>
      )}
    </label>
  );
}
