import { randomBytes, randomInt } from "node:crypto";

import { sendTemplateEmail } from "@/lib/email/resend";
import { recordConsent } from "@/lib/finance/consent";
import { isValidTimeZone } from "@/lib/i18n/config";
import { guestLocale, i18nForUser } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { emailValue, stringValue, ValidationError } from "@/lib/validation";
import { hashToken } from "./session";

const APP_URL = process.env.WEB_URL || "http://localhost:3000";
const SUPPORT_URL = APP_URL;
const VERIFICATION_MINUTES = 30;
const LOGIN_CODE_MINUTES = 10;

function userName(displayName: string | null, email: string) {
  return displayName || email.split("@")[0];
}

export async function requestEarlyAccess(body: Record<string, unknown>) {
  const email = emailValue(body.email);
  const displayName = stringValue(body.name, "name", 120);
  if (body.acceptLegal !== true && body.acceptLegal !== "on")
    throw new ValidationError(
      "VALIDATION_ERROR",
      "errors.legal.consentRequired",
    );
  // Idioma e fuso iniciais vêm do navegador; o usuário ajusta depois em Preferências.
  const timeZone =
    typeof body.timeZone === "string" && isValidTimeZone(body.timeZone)
      ? body.timeZone
      : undefined;
  const user = await prisma.users.upsert({
    where: { email },
    update: { display_name: displayName },
    create: {
      email,
      display_name: displayName,
      locale: await guestLocale(),
      ...(timeZone ? { timezone: timeZone } : {}),
    },
  });
  const locale = await guestLocale();
  await recordConsent(user.id, locale);
  if (user.email_verified_at) return { alreadyVerified: true, email };

  const rawToken = randomBytes(32).toString("base64url");
  await prisma.email_verification_tokens.deleteMany({
    where: { user_id: user.id, used_at: null },
  });
  await prisma.email_verification_tokens.create({
    data: {
      user_id: user.id,
      token_hash: hashToken(rawToken),
      expires_at: new Date(Date.now() + VERIFICATION_MINUTES * 60000),
    },
  });
  const { t } = await i18nForUser(user.id);
  const result = await sendTemplateEmail({
    template: "emailConfirmation",
    to: email,
    subject: t("auth.emailSubjects.confirmEmail"),
    variables: {
      ACTIVATION_URL: `${APP_URL}/api/v1/auth/verify?token=${rawToken}`,
      EXPIRATION_MINUTES: String(VERIFICATION_MINUTES),
      SUPPORT_URL,
      USER_NAME: userName(displayName, email),
    },
    idempotencyKey: `email-confirmation/${user.id}`,
  });
  if (result.error)
    throw new ValidationError(
      "EMAIL_SEND_FAILED",
      "errors.auth.confirmationEmailFailed",
    );
  return { alreadyVerified: false, email };
}

export async function requestLoginCode(emailInput: unknown) {
  const email = emailValue(emailInput);
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user || !user.email_verified_at)
    throw new ValidationError(
      "EMAIL_NOT_CONFIRMED",
      "errors.auth.emailNotConfirmed",
    );
  const code = String(randomInt(100000, 1000000));
  await prisma.login_codes.deleteMany({
    where: { user_id: user.id, used_at: null },
  });
  await prisma.login_codes.create({
    data: {
      user_id: user.id,
      code_hash: hashToken(code),
      expires_at: new Date(Date.now() + LOGIN_CODE_MINUTES * 60000),
    },
  });
  const { t } = await i18nForUser(user.id);
  const result = await sendTemplateEmail({
    template: "secureAccess",
    to: email,
    subject: t("auth.emailSubjects.accessCode"),
    variables: {
      EXPIRATION_MINUTES: String(LOGIN_CODE_MINUTES),
      LOGIN_URL: `${APP_URL}/login`,
      OTP_CODE: code,
      SUPPORT_URL,
      USER_NAME: userName(user.display_name, email),
    },
    idempotencyKey: `secure-access/${user.id}/${code}`,
  });
  if (result.error)
    throw new ValidationError(
      "EMAIL_SEND_FAILED",
      "errors.auth.loginCodeEmailFailed",
    );
  return { email };
}

export { APP_URL, VERIFICATION_MINUTES };
