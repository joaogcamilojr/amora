import { isTemplateConfigured } from "@/lib/email/templates";
import { i18nForUser } from "@/lib/i18n/server";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.WEB_URL || "http://localhost:3000";

export type DeletionEvent = "requested" | "canceled" | "completed";

/** Destinatário capturado antes da anonimização, que apaga o e-mail. */
export async function deletionRecipient(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { email: true, display_name: true },
  });
  return user
    ? { to: user.email, name: user.display_name ?? user.email.split("@")[0] }
    : null;
}

/**
 * Avisa por e-mail o pedido, o cancelamento e a conclusão da exclusão. Melhor esforço: sem template configurado
 * (`RESEND_TEMPLATE_ACCOUNT_DELETION`) não envia, e uma falha de envio nunca desfaz nem trava a operação.
 * O texto vem do catálogo, no idioma do usuário; o `idempotencyKey` evita repetir o mesmo aviso.
 */
export async function notifyDeletion(input: {
  userId: string;
  event: DeletionEvent;
  requestId: string;
  recipient: { to: string; name: string } | null;
  scheduledFor?: Date | null;
}) {
  if (!input.recipient || !isTemplateConfigured("accountDeletion")) return;
  try {
    const { t, fmt } = await i18nForUser(input.userId);
    const { sendTemplateEmail } = await import("@/lib/email/resend");
    const action =
      input.event === "requested"
        ? `${APP_URL}/settings#privacy`
        : input.event === "canceled"
          ? `${APP_URL}/dashboard`
          : APP_URL;
    await sendTemplateEmail({
      template: "accountDeletion",
      to: input.recipient.to,
      subject: t(`privacy.email.${input.event}.subject`),
      variables: {
        USER_NAME: input.recipient.name,
        HEADLINE: t(`privacy.email.${input.event}.headline`),
        MESSAGE: t(`privacy.email.${input.event}.message`, {
          date: input.scheduledFor
            ? fmt.civilDate(input.scheduledFor.toISOString().slice(0, 10))
            : "",
        }),
        ACTION_URL: action,
        ACTION_LABEL: t(`privacy.email.${input.event}.action`),
        SUPPORT_URL: APP_URL,
      },
      idempotencyKey: `account-deletion/${input.event}/${input.requestId}`,
    });
  } catch (error) {
    logError("privacy-notify", error);
  }
}
