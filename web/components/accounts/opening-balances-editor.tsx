"use client";

import { AccountType, AssetType } from "@prisma/client";

import { getAccountTypeConfiguration } from "@/lib/accounts/account-types";
import { useI18n } from "@/lib/i18n/client";

export type Asset = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  type: AssetType;
};

export type OpeningBalanceFormItem = {
  localId: string;
  assetId: string;
  amount: string;
  openingDate: string;
};

export function OpeningBalancesEditor({
  type,
  assets,
  items,
  onChange,
}: {
  type: AccountType;
  assets: Asset[];
  items: OpeningBalanceFormItem[];
  onChange: (items: OpeningBalanceFormItem[]) => void;
}) {
  const { t, fmt } = useI18n();
  const config = getAccountTypeConfiguration(type);
  const compatible = assets.filter((asset) =>
    config.allowedAssetTypes.includes(asset.type),
  );
  const add = () =>
    onChange([
      ...items,
      {
        localId: crypto.randomUUID(),
        assetId: "",
        amount: "0",
        openingDate: fmt.today(),
      },
    ]);
  const catalogMessage =
    assets.length === 0
      ? t("accounts.opening.emptyCatalog")
      : t("accounts.opening.noCompatible", {
          type: t(`enums.accountType.${config.value}.label`),
        });
  return (
    <div className="opening-editor">
      {items.map((item, index) => (
        <div className="opening-row" key={item.localId}>
          <label>
            {t("accounts.opening.asset")}
            <select
              required
              value={item.assetId}
              disabled={!compatible.length}
              onChange={(event) =>
                onChange(
                  items.map((current) =>
                    current.localId === item.localId
                      ? { ...current, assetId: event.target.value }
                      : current,
                  ),
                )
              }
            >
              <option value="">
                {compatible.length
                  ? t("accounts.opening.selectCurrency")
                  : t("accounts.opening.noCurrencies")}
              </option>
              {compatible
                .filter(
                  (asset) =>
                    !items.some(
                      (other, otherIndex) =>
                        otherIndex !== index && other.assetId === asset.id,
                    ),
                )
                .map((asset) => (
                  <option value={asset.id} key={asset.id}>
                    {asset.symbol} {asset.code} — {asset.name}{" "}
                    {t("accounts.opening.decimals", { count: asset.decimals })}
                  </option>
                ))}
            </select>
          </label>
          <label>
            {t("accounts.opening.openingBalance")}
            <input
              required
              inputMode="decimal"
              value={item.amount}
              onChange={(event) =>
                onChange(
                  items.map((current) =>
                    current.localId === item.localId
                      ? { ...current, amount: event.target.value }
                      : current,
                  ),
                )
              }
            />
          </label>
          <label>
            {t("common.fields.date")}
            <input
              required
              type="date"
              value={item.openingDate}
              onChange={(event) =>
                onChange(
                  items.map((current) =>
                    current.localId === item.localId
                      ? { ...current, openingDate: event.target.value }
                      : current,
                  ),
                )
              }
            />
          </label>
          {config.assetSelection === "multiple" && (
            <button
              type="button"
              className="remove-row"
              onClick={() =>
                onChange(
                  items.filter((current) => current.localId !== item.localId),
                )
              }
            >
              {t("accounts.opening.remove")}
            </button>
          )}
        </div>
      ))}
      {!items.length && (
        <p className="field-note">{t("accounts.opening.none")}</p>
      )}
      {config.assetSelection === "multiple" && (
        <button
          type="button"
          className="button button-small secondary"
          disabled={!compatible.length || items.length >= compatible.length}
          onClick={add}
        >
          {t("accounts.opening.addCurrency")}
        </button>
      )}
      {!compatible.length && <p className="field-note">{catalogMessage}</p>}
    </div>
  );
}
