import type { Prisma } from "@prisma/client";

import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";

import { cancelBillingForDeletion } from "./billing";
import { deletionRecipient, notifyDeletion } from "./privacy-notify";

/** Carência entre o pedido e a anonimização; nesse prazo a pessoa pode cancelar. */
export const DELETION_GRACE_DAYS = 30;
const REDACTED_FILE = "-";
const REDACTED_EMAIL = "redacted@deleted.invalid";

export async function getDeletionStatus(userId: string) {
  const [pending, sharedAccounts] = await Promise.all([
    prisma.privacy_requests.findFirst({
      where: { user_id: userId, type: "DELETION", status: "PENDING" },
      orderBy: { requested_at: "desc" },
      select: { requested_at: true, scheduled_for: true },
    }),
    prisma.accounts.count({
      where: {
        owner_id: userId,
        status: "ACTIVE",
        OR: [
          { household_id: { not: null } },
          { members: { some: { user_id: { not: userId } } } },
        ],
      },
    }),
  ]);
  return { graceDays: DELETION_GRACE_DAYS, pending, sharedAccounts };
}

export async function requestDeletion(
  userId: string,
  body: Record<string, unknown>,
) {
  const user = await prisma.users.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });
  const confirm =
    typeof body.confirmEmail === "string"
      ? body.confirmEmail.trim().toLowerCase()
      : "";
  if (confirm !== user.email.toLowerCase())
    throw new ValidationError(
      "VALIDATION_ERROR",
      "errors.privacy.emailMismatch",
    );
  const existing = await prisma.privacy_requests.findFirst({
    where: { user_id: userId, type: "DELETION", status: "PENDING" },
    select: { id: true },
  });
  if (existing)
    throw new ValidationError("CONFLICT", "errors.privacy.alreadyPending");
  const scheduledFor = new Date(Date.now() + DELETION_GRACE_DAYS * 86_400_000);
  const request = await prisma.privacy_requests.create({
    data: { user_id: userId, type: "DELETION", scheduled_for: scheduledFor },
  });
  await notifyDeletion({
    userId,
    event: "requested",
    requestId: request.id,
    recipient: { to: user.email, name: user.email.split("@")[0] },
    scheduledFor,
  });
  return getDeletionStatus(userId);
}

export async function cancelDeletion(userId: string) {
  const pending = await prisma.privacy_requests.findFirst({
    where: { user_id: userId, type: "DELETION", status: "PENDING" },
    select: { id: true },
  });
  const canceled = await prisma.privacy_requests.updateMany({
    where: { user_id: userId, type: "DELETION", status: "PENDING" },
    data: { status: "CANCELED", canceled_at: new Date() },
  });
  if (canceled.count === 0 || !pending)
    throw new ValidationError(
      "RESOURCE_NOT_FOUND",
      "errors.privacy.nothingPending",
    );
  await notifyDeletion({
    userId,
    event: "canceled",
    requestId: pending.id,
    recipient: await deletionRecipient(userId),
  });
  return getDeletionStatus(userId);
}

/**
 * Exclusão lógica: nada é apagado do ledger. O usuário é arquivado e perde os dados pessoais (e-mail, nome, país,
 * sessões, códigos, notas, titulares, nomes de arquivo importado, e-mails de convites; a assinatura é cancelada e o
 * cliente apagado no Stripe). Contas e grupos ficam
 * arquivados, regras desligadas e vínculos de outros usuários removidos; lançamentos, saldos e histórico permanecem
 * para auditoria, sem ligação com uma pessoa identificável.
 */
export async function anonymizeUser(userId: string, requestId: string) {
  await cancelBillingForDeletion(userId);
  const recipient = await deletionRecipient(userId);
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.users.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, archived_at: true },
    });
    const now = new Date();
    if (!user.archived_at) {
      const memberships = await tx.household_members.findMany({
        where: { user_id: userId },
        include: {
          household: {
            include: {
              members: { select: { id: true, user_id: true, role: true } },
            },
          },
        },
      });
      for (const m of memberships) {
        const others = m.household.members.filter(
          (x) => x.id !== m.id && x.user_id,
        );
        // Sem outro ADMIN com login ninguém administraria o grupo: ele é arquivado (histórico preservado).
        if (!others.some((x) => x.role === "ADMIN") && !m.household.archived_at)
          await tx.households.update({
            where: { id: m.household_id },
            data: { archived_at: now },
          });
        await tx.household_members.update({
          where: { id: m.id },
          data: { user_id: null, display_name: null, role: "MEMBER" },
        });
      }
      const invited = {
        OR: [
          { invited_by_user_id: userId },
          { email: user.email, status: "PENDING" as const },
        ],
      };
      await tx.household_invitations.updateMany({
        where: invited,
        data: { status: "REVOKED", email: REDACTED_EMAIL },
      });
      await tx.account_share_invitations.updateMany({
        where: invited,
        data: { status: "REVOKED", email: REDACTED_EMAIL, token_hash: null },
      });
      await tx.account_members.deleteMany({
        where: { user_id: userId, role: { not: "OWNER" } },
      });
      await tx.accounts.updateMany({
        where: { owner_id: userId, status: "ACTIVE" },
        data: { status: "ARCHIVED", archived_at: now },
      });
      await tx.accounts.updateMany({
        where: { owner_id: userId },
        data: { notes: null, holder_name: null },
      });
      await tx.ledger_transactions.updateMany({
        where: { created_by_user_id: userId },
        data: { notes: null },
      });
      await tx.recurring_items.updateMany({
        where: { owner_id: userId },
        data: { active: false, notes: null },
      });
      await tx.categories.updateMany({
        where: { owner_id: userId, archived_at: null },
        data: { archived_at: now },
      });
      await tx.classification_rules.updateMany({
        where: { owner_id: userId },
        data: { active: false },
      });
      await tx.holdings.updateMany({
        where: { owner_id: userId },
        data: { archived_at: now, notes: null, holder_name: null },
      });
      await tx.trips.updateMany({
        where: { owner_id: userId },
        data: { notes: null },
      });
      await tx.import_batches.updateMany({
        where: { owner_id: userId },
        data: { file_name: REDACTED_FILE },
      });
      await tx.auth_sessions.deleteMany({ where: { user_id: userId } });
      await tx.auth_refresh_tokens.deleteMany({ where: { user_id: userId } });
      await tx.login_codes.deleteMany({ where: { user_id: userId } });
      await tx.email_verification_tokens.deleteMany({
        where: { user_id: userId },
      });
      await tx.waitlist_entries.deleteMany({ where: { email: user.email } });
      await tx.subscriptions.updateMany({
        where: { user_id: userId },
        data: {
          status: "CANCELED",
          current_period_end: null,
          cancel_at_period_end: false,
          stripe_customer_id: null,
          stripe_subscription_id: null,
        },
      });
      await tx.users.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.invalid`,
          display_name: null,
          country_code: null,
          active_household_id: null,
          email_verified_at: null,
          archived_at: now,
        },
      });
    }
    await tx.privacy_requests.update({
      where: { id: requestId },
      data: { status: "COMPLETED", processed_at: now },
    });
  });
  // Depois da anonimização o e-mail não existe mais: o aviso usa o destinatário capturado antes.
  await notifyDeletion({ userId, event: "completed", requestId, recipient });
}

/** Job: anonimiza quem pediu a exclusão e já passou da carência. Um erro não trava os demais. */
export async function processDueDeletions() {
  const due = await prisma.privacy_requests.findMany({
    where: {
      type: "DELETION",
      status: "PENDING",
      scheduled_for: { lte: new Date() },
    },
    select: { id: true, user_id: true },
    take: 50,
    orderBy: { scheduled_for: "asc" },
  });
  let processed = 0;
  let failed = 0;
  for (const request of due) {
    try {
      await anonymizeUser(request.user_id, request.id);
      processed++;
    } catch (error) {
      failed++;
      logError("privacy-deletion", error);
    }
  }
  return { due: due.length, processed, failed };
}
