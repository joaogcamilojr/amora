import { AccountMemberRole, AccountStatus, type Prisma } from "@prisma/client";

import {
  accountAccessWhere,
  accountRoleInclude,
  resolveAccountRole,
} from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";

export type AccountAccess = {
  account: Prisma.accountsGetPayload<{
    include: { balances: { include: { asset: true } }; card_profile: true };
  }>;
  role: AccountMemberRole;
};

export async function getAccountAccess(
  userId: string,
  accountId: string,
): Promise<AccountAccess | null> {
  const account = await prisma.accounts.findFirst({
    where: {
      id: accountId,
      status: AccountStatus.ACTIVE,
      ...accountAccessWhere(userId),
    },
    include: {
      balances: { include: { asset: true } },
      card_profile: true,
      ...accountRoleInclude(userId),
    },
  });
  if (!account) return null;
  const role = resolveAccountRole(userId, account);
  return role ? { account, role } : null;
}

export function can(
  role: AccountMemberRole,
  action: "read" | "create_entry" | "manage",
) {
  if (action === "read") return true;
  if (action === "create_entry")
    return (
      role === AccountMemberRole.OWNER ||
      role === AccountMemberRole.TRANSACTION_MANAGER
    );
  return role === AccountMemberRole.OWNER;
}

export function forbidden(
  role: AccountMemberRole,
  action: "read" | "create_entry" | "manage",
) {
  return !can(role, action);
}
