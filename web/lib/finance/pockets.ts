import type { AccountView } from "./types";

/** "Bolso" = conta + moeda. Contas multimoeda (Wise, Prex, carteira) têm um bolso por moeda. */
export interface Pocket {
  key: string;
  accountId: string;
  assetId: string;
  assetCode: string;
  label: string;
  isCard: boolean;
}

export function pockets(accounts: AccountView[]): Pocket[] {
  return accounts
    .filter((a) => a.status === "ACTIVE" && a.canPost)
    .flatMap((a) =>
      a.balances.map((b) => ({
        key: `${a.id}:${b.asset.id}`,
        accountId: a.id,
        assetId: b.asset.id,
        assetCode: b.asset.code,
        label: `${a.name} · ${b.asset.code}`,
        isCard: a.type === "CREDIT_CARD",
      })),
    );
}

export function splitPocket(key: string) {
  const [accountId, assetId] = key.split(":");
  return { accountId, assetId };
}
