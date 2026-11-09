import { AccountMemberRole, HouseholdRole, type Prisma } from "@prisma/client";

/**
 * Regra única de acesso a contas: dono, vínculo direto (`account_members`) ou membro do grupo familiar
 * (`households`) ao qual a conta pertence. Grupo arquivado não concede acesso.
 */
export function accountAccessWhere(userId: string): Prisma.accountsWhereInput {
  return {
    OR: [
      { owner_id: userId },
      { members: { some: { user_id: userId } } },
      {
        household: {
          archived_at: null,
          members: { some: { user_id: userId } },
        },
      },
    ],
  };
}

/** Relações necessárias para `resolveAccountRole`, já filtradas pelo usuário. */
export function accountRoleInclude(userId: string) {
  return {
    members: { where: { user_id: userId }, select: { role: true } },
    household: {
      select: {
        archived_at: true,
        members: { where: { user_id: userId }, select: { role: true } },
      },
    },
  } satisfies Prisma.accountsInclude;
}

type AccountForRole = {
  owner_id: string;
  members: { role: AccountMemberRole }[];
  household: {
    archived_at: Date | null;
    members: { role: HouseholdRole }[];
  } | null;
};

const RANK: Record<AccountMemberRole, number> = {
  [AccountMemberRole.OWNER]: 3,
  [AccountMemberRole.TRANSACTION_MANAGER]: 2,
  [AccountMemberRole.VIEWER]: 1,
};

/** ADMIN e MEMBER do grupo lançam; VIEWER só lê. Gerir a conta continua sendo do dono. */
function roleFromHousehold(role: HouseholdRole): AccountMemberRole {
  return role === HouseholdRole.VIEWER
    ? AccountMemberRole.VIEWER
    : AccountMemberRole.TRANSACTION_MANAGER;
}

/** Papel efetivo do usuário na conta: o mais permissivo entre dono, vínculo direto e grupo. */
export function resolveAccountRole(
  userId: string,
  account: AccountForRole,
): AccountMemberRole | null {
  if (account.owner_id === userId) return AccountMemberRole.OWNER;
  const roles: AccountMemberRole[] = account.members.map((m) => m.role);
  if (account.household && !account.household.archived_at)
    for (const member of account.household.members)
      roles.push(roleFromHousehold(member.role));
  return roles.sort((a, b) => RANK[b] - RANK[a])[0] ?? null;
}
