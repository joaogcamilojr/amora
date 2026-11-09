export const EMAIL_TEMPLATES = {
  emailConfirmation: {
    id: "2db22596-8ad9-43bf-9c92-3ca9cf98a872",
    variables: [
      "ACTIVATION_URL",
      "EXPIRATION_MINUTES",
      "SUPPORT_URL",
      "USER_NAME",
    ],
  },
  secureAccess: {
    id: "382b4ca4-be47-4b42-8670-2e8f5015fc08",
    variables: [
      "EXPIRATION_MINUTES",
      "LOGIN_URL",
      "OTP_CODE",
      "SUPPORT_URL",
      "USER_NAME",
    ],
  },
  /** Layout genérico das mensagens de exclusão de conta; o texto vem do catálogo i18n (`privacy.email.*`). */
  accountDeletion: {
    id: process.env.RESEND_TEMPLATE_ACCOUNT_DELETION ?? "",
    variables: [
      "USER_NAME",
      "HEADLINE",
      "MESSAGE",
      "ACTION_URL",
      "ACTION_LABEL",
      "SUPPORT_URL",
    ],
  },
} as const;

export type EmailTemplateName = keyof typeof EMAIL_TEMPLATES;

export const emailTemplate = (name: EmailTemplateName) => {
  const template = EMAIL_TEMPLATES[name];

  if (!template.id) {
    throw new Error(`Resend template ID is not configured: ${name}`);
  }

  return { id: template.id };
};

/** Template sem ID configurado não envia (e-mails opcionais, como o aviso de exclusão). */
export const isTemplateConfigured = (name: EmailTemplateName) =>
  Boolean(EMAIL_TEMPLATES[name].id);
