import type { Prisma } from "@prisma/client";

import { resolveLocale } from "@/lib/i18n/config";
import {
  LEGAL_KINDS,
  LEGAL_VERSIONS,
  missingConsents,
} from "@/lib/legal/versions";
import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

/** Termos e privacidade vigentes que o usuário ainda não aceitou. */
export async function getConsentStatus(userId: string) {
  const accepted = await prisma.consents.findMany({
    where: { user_id: userId },
    select: { kind: true, version: true },
  });
  const missing = missingConsents(accepted);
  return { current: LEGAL_VERSIONS, missing, upToDate: missing.length === 0 };
}

/** Registra o aceite das versões vigentes (idempotente). `locale` é o idioma em que o texto foi apresentado. */
export async function recordConsent(
  userId: string,
  locale: string | null | undefined,
  db: Db = prisma,
) {
  await db.consents.createMany({
    data: LEGAL_KINDS.map((kind) => ({
      user_id: userId,
      kind,
      version: LEGAL_VERSIONS[kind],
      locale: resolveLocale(locale) ?? "pt-BR",
    })),
    skipDuplicates: true,
  });
  return getConsentStatus(userId);
}
