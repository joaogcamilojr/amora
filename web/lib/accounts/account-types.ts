import { AccountType, AssetType, CardType } from "@prisma/client";

/** Regras por tipo de conta. Rótulo e descrição vêm do catálogo: `t(`enums.accountType.${type}.label`)`. */

export type AccountTypeConfiguration = {
  value: AccountType;
  allowedAssetTypes: AssetType[];
  assetSelection: "single" | "multiple";
  requiresCountry: boolean;
  allowsCountry: boolean;
  requiresInstitution: boolean;
  allowsInstitution: boolean;
  requiresCardProfile: boolean;
  allowsCardProfile: boolean;
  allowedCardTypes: CardType[];
  defaultIncludeInNetWorth: boolean;
  defaultIncludeInAvailableBalance: boolean;
};

const fiat = [AssetType.FIAT];
const fiatPoints = [AssetType.FIAT, AssetType.POINTS];

export const ACCOUNT_TYPE_CONFIGURATIONS: Record<
  AccountType,
  AccountTypeConfiguration
> = {
  CASH_WALLET: {
    value: AccountType.CASH_WALLET,
    allowedAssetTypes: fiat,
    assetSelection: "single",
    requiresCountry: false,
    allowsCountry: true,
    requiresInstitution: false,
    allowsInstitution: false,
    requiresCardProfile: false,
    allowsCardProfile: false,
    allowedCardTypes: [],
    defaultIncludeInNetWorth: true,
    defaultIncludeInAvailableBalance: true,
  },
  BANK_ACCOUNT: {
    value: AccountType.BANK_ACCOUNT,
    allowedAssetTypes: fiat,
    assetSelection: "single",
    requiresCountry: true,
    allowsCountry: true,
    requiresInstitution: true,
    allowsInstitution: true,
    requiresCardProfile: false,
    allowsCardProfile: false,
    allowedCardTypes: [],
    defaultIncludeInNetWorth: true,
    defaultIncludeInAvailableBalance: true,
  },
  INTERNATIONAL_ACCOUNT: {
    value: AccountType.INTERNATIONAL_ACCOUNT,
    allowedAssetTypes: fiat,
    assetSelection: "multiple",
    requiresCountry: true,
    allowsCountry: true,
    requiresInstitution: true,
    allowsInstitution: true,
    requiresCardProfile: false,
    allowsCardProfile: false,
    allowedCardTypes: [],
    defaultIncludeInNetWorth: true,
    defaultIncludeInAvailableBalance: true,
  },
  MULTI_CURRENCY_ACCOUNT: {
    value: AccountType.MULTI_CURRENCY_ACCOUNT,
    allowedAssetTypes: fiat,
    assetSelection: "multiple",
    requiresCountry: true,
    allowsCountry: true,
    requiresInstitution: true,
    allowsInstitution: true,
    requiresCardProfile: false,
    allowsCardProfile: false,
    allowedCardTypes: [],
    defaultIncludeInNetWorth: true,
    defaultIncludeInAvailableBalance: true,
  },
  BENEFIT_ACCOUNT: {
    value: AccountType.BENEFIT_ACCOUNT,
    allowedAssetTypes: fiatPoints,
    assetSelection: "single",
    requiresCountry: true,
    allowsCountry: true,
    requiresInstitution: true,
    allowsInstitution: true,
    requiresCardProfile: false,
    allowsCardProfile: true,
    allowedCardTypes: [CardType.BENEFIT, CardType.VIRTUAL],
    defaultIncludeInNetWorth: false,
    defaultIncludeInAvailableBalance: true,
  },
  GIFT_CARD: {
    value: AccountType.GIFT_CARD,
    allowedAssetTypes: fiatPoints,
    assetSelection: "single",
    requiresCountry: true,
    allowsCountry: true,
    requiresInstitution: true,
    allowsInstitution: true,
    requiresCardProfile: false,
    allowsCardProfile: true,
    allowedCardTypes: [CardType.GIFT, CardType.VIRTUAL],
    defaultIncludeInNetWorth: false,
    defaultIncludeInAvailableBalance: true,
  },
  DIGITAL_BALANCE: {
    value: AccountType.DIGITAL_BALANCE,
    allowedAssetTypes: [AssetType.FIAT, AssetType.POINTS, AssetType.OTHER],
    assetSelection: "single",
    requiresCountry: true,
    allowsCountry: true,
    requiresInstitution: true,
    allowsInstitution: true,
    requiresCardProfile: false,
    allowsCardProfile: false,
    allowedCardTypes: [],
    defaultIncludeInNetWorth: false,
    defaultIncludeInAvailableBalance: true,
  },
  CRYPTO_WALLET: {
    value: AccountType.CRYPTO_WALLET,
    allowedAssetTypes: [AssetType.CRYPTO],
    assetSelection: "multiple",
    requiresCountry: false,
    allowsCountry: true,
    requiresInstitution: false,
    allowsInstitution: true,
    requiresCardProfile: false,
    allowsCardProfile: false,
    allowedCardTypes: [],
    defaultIncludeInNetWorth: true,
    defaultIncludeInAvailableBalance: false,
  },
  CREDIT_CARD: {
    value: AccountType.CREDIT_CARD,
    allowedAssetTypes: fiat,
    assetSelection: "single",
    requiresCountry: true,
    allowsCountry: true,
    requiresInstitution: true,
    allowsInstitution: true,
    requiresCardProfile: true,
    allowsCardProfile: false,
    allowedCardTypes: [CardType.CREDIT],
    defaultIncludeInNetWorth: false,
    defaultIncludeInAvailableBalance: false,
  },
  PREPAID_CARD: {
    value: AccountType.PREPAID_CARD,
    allowedAssetTypes: fiat,
    assetSelection: "multiple",
    requiresCountry: true,
    allowsCountry: true,
    requiresInstitution: true,
    allowsInstitution: true,
    requiresCardProfile: true,
    allowsCardProfile: false,
    allowedCardTypes: [CardType.PREPAID, CardType.VIRTUAL],
    defaultIncludeInNetWorth: true,
    defaultIncludeInAvailableBalance: true,
  },
  OTHER: {
    value: AccountType.OTHER,
    allowedAssetTypes: [
      AssetType.FIAT,
      AssetType.CRYPTO,
      AssetType.POINTS,
      AssetType.OTHER,
    ],
    assetSelection: "multiple",
    requiresCountry: false,
    allowsCountry: true,
    requiresInstitution: false,
    allowsInstitution: true,
    requiresCardProfile: false,
    allowsCardProfile: true,
    allowedCardTypes: Object.values(CardType),
    defaultIncludeInNetWorth: true,
    defaultIncludeInAvailableBalance: true,
  },
};

export function getAccountTypeConfiguration(
  type: AccountType | string,
): AccountTypeConfiguration {
  return (
    ACCOUNT_TYPE_CONFIGURATIONS[type as AccountType] ??
    ACCOUNT_TYPE_CONFIGURATIONS.OTHER
  );
}
