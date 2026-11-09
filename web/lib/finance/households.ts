import { randomBytes } from "node:crypto";

import { HouseholdRole, InvitationStatus, type Prisma } from "@prisma/client";

import { hashToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  cuidValue,
  emailValue,
  enumValue,
  stringValue,
  ValidationError,
} from "@/lib/validation";

import { assertHouseholdAllowed, assertHouseholdCapacity } from "./billing";

type Tx = Prisma.TransactionClient;

const INVITATION_TTL_MS = 7 * 86_400_000;
const ROLES = Object.values(HouseholdRole);
const notFound = () =>
  new ValidationError("RESOURCE_NOT_FOUND", "errors.household.notFound");
const forbidden = (
  key: "errors.household.adminOnly" | "errors.household.cannotPostAccounts",
) => new ValidationError("FORBIDDEN", key);

const optionalName = (value: unknown, field: string) => {
  const name = value == null ? "" : stringValue(value, field, 80, false);
  return name || null;
};

/** Vínculo ativo do usuário num grupo não arquivado. */
async function membership(
  db: Tx | typeof prisma,
  userId: string,
  householdId: string,
) {
  const member = await db.household_members.findFirst({
    where: {
      household_id: householdId,
      user_id: userId,
      household: { archived_at: null },
    },
  });
  if (!member) throw notFound();
  return member;
}

async function adminMembership(
  db: Tx | typeof prisma,
  userId: string,
  householdId: string,
) {
  const member = await membership(db, userId, householdId);
  if (member.role !== HouseholdRole.ADMIN)
    throw forbidden("errors.household.adminOnly");
  return member;
}

async function otherAdmins(
  tx: Tx,
  householdId: string,
  exceptMemberId: string,
) {
  return tx.household_members.count({
    where: {
      household_id: householdId,
      role: HouseholdRole.ADMIN,
      user_id: { not: null },
      id: { not: exceptMemberId },
    },
  });
}

/** Membro para a tela. O e-mail só vai para admins e para o próprio usuário. */
type MemberRow = Prisma.household_membersGetPayload<{
  include: { user: { select: { display_name: true; email: true } } };
}>;

function memberView(row: MemberRow, viewerIsAdmin: boolean, viewerId: string) {
  return {
    id: row.id,
    displayName: row.display_name ?? row.user?.display_name ?? null,
    email:
      row.user && (viewerIsAdmin || row.user_id === viewerId)
        ? row.user.email
        : null,
    hasLogin: row.user_id != null,
    isMe: row.user_id === viewerId,
    role: row.role,
  };
}

export async function listHouseholds(userId: string) {
  const [rows, user] = await Promise.all([
    prisma.household_members.findMany({
      where: { user_id: userId, household: { archived_at: null } },
      include: {
        household: {
          include: { _count: { select: { members: true, accounts: true } } },
        },
      },
      orderBy: { created_at: "asc" },
    }),
    prisma.users.findUnique({
      where: { id: userId },
      select: { active_household_id: true },
    }),
  ]);
  return {
    activeHouseholdId: user?.active_household_id ?? null,
    households: rows.map((m) => ({
      id: m.household_id,
      name: m.household.name,
      role: m.role,
      memberCount: m.household._count.members,
      accountCount: m.household._count.accounts,
    })),
  };
}

export async function createHousehold(
  userId: string,
  b: Record<string, unknown>,
) {
  await assertHouseholdAllowed(userId);
  const name = stringValue(b.name, "name", 80);
  return prisma.$transaction(async (tx) => {
    const household = await tx.households.create({
      data: {
        name,
        created_by_user_id: userId,
        members: { create: { user_id: userId, role: HouseholdRole.ADMIN } },
      },
    });
    await tx.users.updateMany({
      where: { id: userId, active_household_id: null },
      data: { active_household_id: household.id },
    });
    return { id: household.id, name: household.name };
  });
}

export async function getHousehold(userId: string, id: string) {
  const me = await membership(prisma, userId, id);
  const isAdmin = me.role === HouseholdRole.ADMIN;
  const household = await prisma.households.findUniqueOrThrow({
    where: { id },
    include: {
      members: {
        include: { user: { select: { display_name: true, email: true } } },
        orderBy: { created_at: "asc" },
      },
      invitations: isAdmin
        ? {
            where: {
              status: InvitationStatus.PENDING,
              expires_at: { gt: new Date() },
            },
            orderBy: { created_at: "desc" },
          }
        : false,
      accounts: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          holder_member_id: true,
          owner_id: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });
  return {
    id: household.id,
    name: household.name,
    role: me.role,
    myMemberId: me.id,
    members: household.members.map((m) => memberView(m, isAdmin, userId)),
    invitations: (household.invitations || []).map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expires_at.toISOString(),
    })),
    accounts: household.accounts.map((a) => ({
      id: a.id,
      name: a.name,
      holderMemberId: a.holder_member_id,
      isMine: a.owner_id === userId,
    })),
  };
}

export async function updateHousehold(
  userId: string,
  id: string,
  b: Record<string, unknown>,
) {
  await adminMembership(prisma, userId, id);
  const household = await prisma.households.update({
    where: { id },
    data: { name: stringValue(b.name, "name", 80) },
  });
  return { id: household.id, name: household.name };
}

/** Arquivar mantém o histórico; o grupo deixa de conceder acesso às contas. */
export async function archiveHousehold(userId: string, id: string) {
  await adminMembership(prisma, userId, id);
  await prisma.$transaction([
    prisma.households.update({
      where: { id },
      data: { archived_at: new Date() },
    }),
    prisma.users.updateMany({
      where: { active_household_id: id },
      data: { active_household_id: null },
    }),
  ]);
  return { archived: true };
}

/** Titular sem login (cônjuge, filho): serve só para identificar de quem é a conta ou o bem. */
export async function addHolder(
  userId: string,
  householdId: string,
  b: Record<string, unknown>,
) {
  await adminMembership(prisma, userId, householdId);
  const member = await prisma.household_members.create({
    data: {
      household_id: householdId,
      display_name: stringValue(b.displayName, "displayName", 80),
      role: HouseholdRole.VIEWER,
    },
    include: { user: { select: { display_name: true, email: true } } },
  });
  return memberView(member, true, userId);
}

export async function updateMember(
  userId: string,
  householdId: string,
  memberId: string,
  b: Record<string, unknown>,
) {
  await adminMembership(prisma, userId, householdId);
  return prisma.$transaction(async (tx) => {
    const target = await tx.household_members.findFirst({
      where: { id: cuidValue(memberId, "memberId"), household_id: householdId },
    });
    if (!target)
      throw new ValidationError(
        "RESOURCE_NOT_FOUND",
        "errors.household.memberNotFound",
      );
    const data: Prisma.household_membersUpdateInput = {};
    if ("displayName" in b)
      data.display_name = optionalName(b.displayName, "displayName");
    if ("role" in b) {
      if (!target.user_id)
        throw new ValidationError(
          "VALIDATION_ERROR",
          "errors.household.holderHasNoRole",
        );
      const role = enumValue(b.role, ROLES, "role");
      if (
        target.role === HouseholdRole.ADMIN &&
        role !== HouseholdRole.ADMIN &&
        !(await otherAdmins(tx, householdId, target.id))
      )
        throw new ValidationError("CONFLICT", "errors.household.lastAdmin");
      data.role = role;
    }
    const updated = await tx.household_members.update({
      where: { id: target.id },
      data,
      include: { user: { select: { display_name: true, email: true } } },
    });
    return memberView(updated, true, userId);
  });
}

/**
 * Remove um membro (admin) ou sai do grupo (o próprio usuário). O último admin não sai.
 * Contas do usuário que saiu deixam de pertencer ao grupo.
 */
export async function removeMember(
  userId: string,
  householdId: string,
  memberId: string,
) {
  const me = await membership(prisma, userId, householdId);
  return prisma.$transaction(async (tx) => {
    const target = await tx.household_members.findFirst({
      where: { id: cuidValue(memberId, "memberId"), household_id: householdId },
    });
    if (!target)
      throw new ValidationError(
        "RESOURCE_NOT_FOUND",
        "errors.household.memberNotFound",
      );
    const isSelf = target.user_id === userId;
    if (!isSelf && me.role !== HouseholdRole.ADMIN)
      throw forbidden("errors.household.adminOnly");
    if (
      target.role === HouseholdRole.ADMIN &&
      target.user_id &&
      !(await otherAdmins(tx, householdId, target.id))
    )
      throw new ValidationError("CONFLICT", "errors.household.lastAdmin");
    if (target.user_id) {
      await tx.accounts.updateMany({
        where: { household_id: householdId, owner_id: target.user_id },
        data: { household_id: null, holder_member_id: null },
      });
      await tx.users.updateMany({
        where: { id: target.user_id, active_household_id: householdId },
        data: { active_household_id: null },
      });
    }
    await tx.household_members.delete({ where: { id: target.id } });
    return { removed: true };
  });
}

/** Cria o convite. O token em claro só aparece nesta resposta; no banco fica o hash. */
export async function inviteMember(
  userId: string,
  householdId: string,
  b: Record<string, unknown>,
) {
  await adminMembership(prisma, userId, householdId);
  await assertHouseholdAllowed(userId);
  await assertHouseholdCapacity(householdId);
  const email = emailValue(b.email);
  const role = enumValue(b.role ?? HouseholdRole.MEMBER, ROLES, "role");
  const already = await prisma.household_members.findFirst({
    where: { household_id: householdId, user: { email } },
    select: { id: true },
  });
  if (already)
    throw new ValidationError("CONFLICT", "errors.household.alreadyMember");
  const token = randomBytes(32).toString("base64url");
  const invitation = await prisma.$transaction(async (tx) => {
    await tx.household_invitations.updateMany({
      where: {
        household_id: householdId,
        email,
        status: InvitationStatus.PENDING,
      },
      data: { status: InvitationStatus.REVOKED },
    });
    return tx.household_invitations.create({
      data: {
        household_id: householdId,
        invited_by_user_id: userId,
        email,
        role,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + INVITATION_TTL_MS),
      },
    });
  });
  return {
    id: invitation.id,
    email,
    role,
    expiresAt: invitation.expires_at.toISOString(),
    acceptPath: `/household/accept?token=${token}`,
  };
}

export async function revokeInvitation(
  userId: string,
  householdId: string,
  invitationId: string,
) {
  await adminMembership(prisma, userId, householdId);
  const result = await prisma.household_invitations.updateMany({
    where: {
      id: cuidValue(invitationId, "invitationId"),
      household_id: householdId,
      status: InvitationStatus.PENDING,
    },
    data: { status: InvitationStatus.REVOKED },
  });
  if (!result.count)
    throw new ValidationError(
      "RESOURCE_NOT_FOUND",
      "errors.household.invitationNotFound",
    );
  return { revoked: true };
}

/** Aceita o convite: o token precisa estar válido e ser do e-mail do usuário logado. */
export async function acceptInvitation(
  userId: string,
  b: Record<string, unknown>,
) {
  const token = stringValue(b.token, "token", 200);
  const invitation = await prisma.household_invitations.findUnique({
    where: { token_hash: hashToken(token) },
    include: { household: true },
  });
  const invalid = () =>
    new ValidationError(
      "VALIDATION_ERROR",
      "errors.household.invitationInvalid",
    );
  if (
    !invitation ||
    invitation.status !== InvitationStatus.PENDING ||
    invitation.household.archived_at
  )
    throw invalid();
  if (invitation.expires_at <= new Date()) {
    await prisma.household_invitations.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    throw invalid();
  }
  await assertHouseholdCapacity(invitation.household_id, {
    countPending: false,
  });
  const user = await prisma.users.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });
  if (user.email.toLowerCase() !== invitation.email.toLowerCase())
    throw new ValidationError(
      "FORBIDDEN",
      "errors.household.invitationEmailMismatch",
    );
  await prisma.$transaction(async (tx) => {
    await tx.household_members.upsert({
      where: {
        household_id_user_id: {
          household_id: invitation.household_id,
          user_id: userId,
        },
      },
      create: {
        household_id: invitation.household_id,
        user_id: userId,
        role: invitation.role,
      },
      update: {},
    });
    await tx.household_invitations.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED, accepted_at: new Date() },
    });
    await tx.users.updateMany({
      where: { id: userId, active_household_id: null },
      data: { active_household_id: invitation.household_id },
    });
  });
  return {
    householdId: invitation.household_id,
    name: invitation.household.name,
  };
}

/** Troca o workspace ativo. `null` volta para "todas as contas". */
export async function setActiveHousehold(
  userId: string,
  b: Record<string, unknown>,
) {
  const id =
    b.householdId == null || b.householdId === ""
      ? null
      : cuidValue(String(b.householdId), "householdId");
  if (id) await membership(prisma, userId, id);
  await prisma.users.update({
    where: { id: userId },
    data: { active_household_id: id },
  });
  return { activeHouseholdId: id };
}

/**
 * Vínculo da conta com o grupo e o titular (campos `householdId` e `holderMemberId` do corpo).
 * Só o dono da conta chama; ele precisa poder lançar no grupo (ADMIN ou MEMBER).
 * Devolve só os campos enviados; trocar de grupo limpa o titular que não pertence ao novo.
 */
export async function accountHouseholdData(
  userId: string,
  b: Record<string, unknown>,
  current?: { household_id: string | null; holder_member_id: string | null },
) {
  const hasHousehold = "householdId" in b;
  const hasHolder = "holderMemberId" in b;
  if (!hasHousehold && !hasHolder) return {};
  let householdId = current?.household_id ?? null;
  if (hasHousehold) {
    householdId =
      b.householdId == null || b.householdId === ""
        ? null
        : cuidValue(String(b.householdId), "householdId");
    if (householdId && householdId !== current?.household_id) {
      const member = await membership(prisma, userId, householdId);
      if (member.role === HouseholdRole.VIEWER)
        throw forbidden("errors.household.cannotPostAccounts");
    }
  }
  let holderId = hasHolder
    ? b.holderMemberId == null || b.holderMemberId === ""
      ? null
      : cuidValue(String(b.holderMemberId), "holderMemberId")
    : (current?.holder_member_id ?? null);
  if (holderId) {
    const holder = householdId
      ? await prisma.household_members.findFirst({
          where: { id: holderId, household_id: householdId },
        })
      : null;
    if (!holder) {
      if (hasHolder)
        throw new ValidationError(
          "VALIDATION_ERROR",
          "errors.household.invalidHolder",
        );
      holderId = null;
    }
  }
  return { household_id: householdId, holder_member_id: holderId };
}

/** Titular de um bem: membro de um grupo do qual o usuário também faz parte. */
export async function holdingHolderId(userId: string, value: unknown) {
  if (value == null || value === "") return null;
  const id = cuidValue(String(value), "holderMemberId");
  const found = await prisma.household_members.findFirst({
    where: {
      id,
      household: { archived_at: null, members: { some: { user_id: userId } } },
    },
    select: { id: true },
  });
  if (!found)
    throw new ValidationError(
      "VALIDATION_ERROR",
      "errors.household.invalidHolder",
    );
  return id;
}

/** Grupos (onde o usuário pode vincular contas) e membros, para os seletores de grupo e titular. */
export async function householdOptions(userId: string) {
  const [memberships, members] = await Promise.all([
    prisma.household_members.findMany({
      where: { user_id: userId, household: { archived_at: null } },
      include: { household: { select: { id: true, name: true } } },
      orderBy: { created_at: "asc" },
    }),
    holderOptions(userId),
  ]);
  return {
    households: memberships.map((m) => ({
      id: m.household.id,
      name: m.household.name,
      canLinkAccounts: m.role !== HouseholdRole.VIEWER,
    })),
    members,
  };
}

/** Membros dos grupos do usuário, para os seletores de titular. */
export async function holderOptions(userId: string) {
  const rows = await prisma.household_members.findMany({
    where: {
      household: { archived_at: null, members: { some: { user_id: userId } } },
    },
    include: {
      user: { select: { display_name: true } },
      household: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "asc" },
  });
  return rows.map((m) => ({
    id: m.id,
    householdId: m.household_id,
    householdName: m.household.name,
    name: m.display_name ?? m.user?.display_name ?? null,
  }));
}
