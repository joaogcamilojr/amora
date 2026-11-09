"use client";

import { CardType } from "@prisma/client";

import { useI18n } from "@/lib/i18n/client";

export type CardForm = {
  type: CardType;
  brand: string;
  lastFour: string;
  closingDay: string;
  dueDay: string;
  creditLimit: string;
  limitAssetId: string;
};

export function CardProfileFields({
  value,
  onChange,
  types,
  assets,
}: {
  value: CardForm;
  onChange: (value: CardForm) => void;
  types: CardType[];
  assets: Array<{ id: string; code: string }>;
}) {
  const { t } = useI18n();
  const set = (key: keyof CardForm, next: string) =>
    onChange({ ...value, [key]: next });
  const noCycle = types.every((type) =>
    (
      [
        CardType.GIFT,
        CardType.BENEFIT,
        CardType.PREPAID,
        CardType.VIRTUAL,
      ] as CardType[]
    ).includes(type),
  );
  return (
    <div className="card-fields">
      <div className="form-two">
        <label>
          {t("accounts.card.cardType")}
          <select
            value={value.type}
            onChange={(event) => set("type", event.target.value)}
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {t(`enums.cardType.${type}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("accounts.card.brand")}
          <input
            value={value.brand}
            onChange={(event) => set("brand", event.target.value)}
            placeholder={t("accounts.card.brandPlaceholder")}
          />
        </label>
      </div>
      <div className="form-two">
        <label>
          {t("accounts.card.lastFour")}
          <input
            inputMode="numeric"
            maxLength={4}
            value={value.lastFour}
            onChange={(event) => set("lastFour", event.target.value)}
            placeholder={t("accounts.card.optional")}
          />
        </label>
        {!noCycle && (
          <label>
            {t("accounts.card.closingDay")}
            <input
              type="number"
              min="1"
              max="31"
              value={value.closingDay}
              onChange={(event) => set("closingDay", event.target.value)}
            />
          </label>
        )}
      </div>
      {!noCycle && (
        <div className="form-two">
          <label>
            {t("accounts.card.dueDay")}
            <input
              type="number"
              min="1"
              max="31"
              value={value.dueDay}
              onChange={(event) => set("dueDay", event.target.value)}
            />
          </label>
          <label>
            {t("accounts.card.limit")}
            <input
              inputMode="decimal"
              value={value.creditLimit}
              onChange={(event) => set("creditLimit", event.target.value)}
              placeholder={t("accounts.card.optional")}
            />
          </label>
        </div>
      )}
      {value.creditLimit && (
        <label>
          {t("accounts.card.limitAsset")}
          <select
            required
            value={value.limitAssetId}
            onChange={(event) => set("limitAssetId", event.target.value)}
          >
            <option value="">{t("accounts.card.select")}</option>
            {assets.map((asset) => (
              <option value={asset.id} key={asset.id}>
                {asset.code}
              </option>
            ))}
          </select>
        </label>
      )}
      <span className="field-note">{t("accounts.card.securityNote")}</span>
    </div>
  );
}
