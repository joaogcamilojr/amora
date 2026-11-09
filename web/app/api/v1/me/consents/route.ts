import type { NextRequest } from "next/server";

import { getConsentStatus, recordConsent } from "@/lib/finance/consent";
import { body, withUser } from "@/lib/finance/api";
import { i18nContextForUser } from "@/lib/i18n/server";
import { ValidationError } from "@/lib/validation";

/** Versões vigentes de termos e privacidade e o que falta aceitar: `{ current, missing, upToDate }`. */
export async function GET() {
  return withUser((userId) => getConsentStatus(userId));
}

/** Aceita as versões vigentes de termos e privacidade: `{ accept: true }`. Registro só de acréscimo. */
export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const b = await body(request);
    if (b.accept !== true) throw new ValidationError("VALIDATION_ERROR", "errors.legal.consentRequired");
    return recordConsent(userId, (await i18nContextForUser(userId)).locale);
  }, 201);
}
