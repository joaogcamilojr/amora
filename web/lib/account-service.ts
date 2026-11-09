import {
  AccountMemberRole,
  AccountStatus,
  type AccountType,
  AssetType,
  Prisma,
} from "@prisma/client";

import { getAccountTypeConfiguration } from "@/lib/accounts/account-types";
import { accountAccessWhere, accountRoleInclude, resolveAccountRole } from "@/lib/auth/access";
import { getAccountAccess } from "@/lib/auth/authorization";
import { assertAssetsAllowed, assertCanCreateAccount, assertCanWrite } from "@/lib/finance/billing";
import { i18nForUser } from "@/lib/i18n/server";
import { positive, validateScale } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import type { cardInput, parseCreateAccountInput } from "@/lib/validation";

type Opening = {
  asset: { id: string; code: string; decimals: number };
  amount: Prisma.Decimal;
  occurredAt: Date;
};

export async function createAccount(
  userId: string,
  input: ReturnType<typeof parseCreateAccountInput> & {
    type: AccountType;
    household_id?: string | null;
    holder_member_id?: string | null;
  },
  card: ReturnType<typeof cardInput>,
  openings: Opening[],
) {
  await assertCanWrite(userId);
  await assertCanCreateAccount(userId);
  await assertAssetsAllowed(userId, openings.map((o) => o.asset.id));
  const { t } = await i18nForUser(userId);
  return prisma.$transaction(
    async (tx) => {
      const account = await tx.accounts.create({
        data: {
          ...input,
          owner_id: userId,
          members: {
            create: { user_id: userId, role: AccountMemberRole.OWNER },
          },
          card_profile: card ? { create: card } : undefined,
        },
      });
      for (const opening of openings) {
        const balance = await tx.account_balances.create({
          data: {
            account_id: account.id,
            asset_id: opening.asset.id,
            current_balance: opening.amount,
            available_balance: opening.amount,
          },
        });
        if (opening.amount.gt(0)) {
          positive(opening.amount, "openingBalance");
          await tx.ledger_transactions.create({
            data: {
              created_by_user_id: userId,
              account_id: account.id,
              type: "OPENING_BALANCE",
              description: t("errors.generated.openingBalance"),
              occurred_at: opening.occurredAt,
              entries: {
                create: {
                  account_id: account.id,
                  account_balance_id: balance.id,
                  asset_id: opening.asset.id,
                  direction: "CREDIT",
                  amount: opening.amount,
                  balance_after: opening.amount,
                },
              },
            },
          });
        }
      }
      return tx.accounts.findUniqueOrThrow({
        where: { id: account.id },
        include: {
          balances: {
            include: {
              asset: true,
              entries: {
                include: { transaction: true },
                where: { transaction: { type: "OPENING_BALANCE" } },
                orderBy: { created_at: "asc" },
                take: 1,
              },
            },
          },
          card_profile: true,
          members: true,
        },
      });
    },
    { timeout: 15000 },
  );
}

export async function accountDetails(userId: string, accountId: string) {
  return getAccountAccess(userId, accountId);
}

export async function accountDetailsForForm(userId: string, accountId: string) {
  const account = await prisma.accounts.findFirst({
    where: {
      id: accountId,
      ...accountAccessWhere(userId),
    },
    include: {
      ...accountRoleInclude(userId),
      balances: {
        include: {
          asset: true,
          entries: {
            where: { transaction: { type: "OPENING_BALANCE" } },
            include: { transaction: true },
            orderBy: { created_at: "asc" },
            take: 1,
          },
        },
      },
      card_profile: true,
    },
  });
  if (!account) return null;
  const role = resolveAccountRole(userId, account);
  return role ? { account, role } : null;
}

export async function deleteEmptyAccount(userId: string, accountId: string) {
  const access = await getAccountAccess(userId, accountId);
  if (!access || access.role !== AccountMemberRole.OWNER)
    throw new Error("FORBIDDEN");
  const history = await prisma.ledger_entries.count({
    where: { account_id: accountId },
  });
  const invitations = await prisma.account_share_invitations.count({
    where: { account_id: accountId, status: { not: "REVOKED" } },
  });
  const members = await prisma.account_members.count({
    where: { account_id: accountId },
  });
  if (history || invitations || members > 1)
    throw new Error("ACCOUNT_NOT_EMPTY");
  await prisma.accounts.delete({ where: { id: accountId } });
}

export async function postOpeningBalance(
  userId: string,
  accountId: string,
  balanceId: string,
  amount: Prisma.Decimal,
  asset: { id: string; decimals: number; code: string },
  occurredAt: Date,
) {
  validateScale(amount, asset, "amount");
  positive(amount);
  const access = await getAccountAccess(userId, accountId);
  if (!access || access.role === AccountMemberRole.VIEWER)
    throw new Error("FORBIDDEN");
  if (access.account.status !== AccountStatus.ACTIVE)
    throw new Error("ACCOUNT_ARCHIVED");
  const { t } = await i18nForUser(userId);
  return prisma.$transaction(
    async (tx) => {
      const current = await tx.account_balances.findUniqueOrThrow({
        where: { id: balanceId },
      });
      const next = current.current_balance.add(amount);
      await tx.account_balances.update({
        where: { id: balanceId },
        data: {
          current_balance: next,
          available_balance: next,
          last_calculated_at: new Date(),
        },
      });
      return tx.ledger_transactions.create({
        data: {
          created_by_user_id: userId,
          account_id: accountId,
          type: "ADJUSTMENT",
          description: t("errors.generated.balanceAdjustment"),
          occurred_at: occurredAt,
          entries: {
            create: {
              account_id: accountId,
              account_balance_id: balanceId,
              asset_id: asset.id,
              direction: "CREDIT",
              amount,
              balance_after: next,
            },
          },
        },
      });
    },
    { timeout: 15000 },
  );
}

export async function addAccountBalance(
  userId: string,
  accountId: string,
  assetId: string,
  amount: Prisma.Decimal,
  occurredAt: Date,
) {
  await assertCanWrite(userId);
  await assertAssetsAllowed(userId, [assetId]);
  const access = await getAccountAccess(userId, accountId);
  if (!access || access.role !== AccountMemberRole.OWNER)
    throw new Error("FORBIDDEN");
  if (access.account.status !== AccountStatus.ACTIVE)
    throw new Error("ACCOUNT_ARCHIVED");
  const config = getAccountTypeConfiguration(access.account.type);
  if (config.assetSelection !== "multiple")
    throw new Error("MULTIPLE_ASSETS_NOT_ALLOWED");
  const asset = await prisma.assets.findFirst({
    where: { id: assetId, active: true },
  });
  if (!asset || !config.allowedAssetTypes.includes(asset.type as AssetType))
    throw new Error("ASSET_NOT_ALLOWED");
  validateScale(amount, asset, "amount");
  if (amount.lt(0)) throw new Error("VALIDATION_ERROR");
  const { t } = await i18nForUser(userId);
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.account_balances.findUnique({
        where: {
          account_id_asset_id: { account_id: accountId, asset_id: assetId },
        },
      });
      if (existing) throw new Error("CONFLICT");
      const balance = await tx.account_balances.create({
        data: {
          account_id: accountId,
          asset_id: assetId,
          current_balance: amount,
          available_balance: amount,
        },
      });
      if (amount.gt(0))
        await tx.ledger_transactions.create({
          data: {
            created_by_user_id: userId,
            account_id: accountId,
            type: "OPENING_BALANCE",
            description: t("errors.generated.openingBalance"),
            occurred_at: occurredAt,
            entries: {
              create: {
                account_id: accountId,
                account_balance_id: balance.id,
                asset_id: assetId,
                direction: "CREDIT",
                amount,
                balance_after: amount,
              },
            },
          },
        });
      return tx.accounts.findUniqueOrThrow({
        where: { id: accountId },
        include: {
          balances: {
            include: {
              asset: true,
              entries: {
                include: { transaction: true },
                where: { transaction: { type: "OPENING_BALANCE" } },
                orderBy: { created_at: "asc" },
                take: 1,
              },
            },
          },
          card_profile: true,
        },
      });
    },
    { timeout: 15000 },
  );
}
