import { cookies, headers } from "next/headers";
import { cache } from "react";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import {
  buildI18n,
  DEFAULT_LOCALE,
  FALLBACK_BASE_CURRENCY,
  FALLBACK_TIME_ZONE,
  isValidTimeZone,
  LOCALE_COOKIE,
  negotiateLocale,
  resolveLocale,
  type FormatContext,
  type Locale,
} from ".";

/** Idioma de quem ainda não está logado: cookie escolhido na landing/login ou Accept-Language. */
export async function guestLocale(): Promise<Locale> {
  const fromCookie = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  return negotiateLocale((await headers()).get("accept-language"));
}

/** Contexto de i18n de um usuário (rotas de API e serviços que recebem só o id). */
export async function i18nContextForUser(
  userId: string,
): Promise<FormatContext> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      locale: true,
      timezone: true,
      base_asset: { select: { code: true } },
    },
  });
  return {
    locale: resolveLocale(user?.locale) ?? DEFAULT_LOCALE,
    timeZone: isValidTimeZone(user?.timezone)
      ? user!.timezone
      : FALLBACK_TIME_ZONE,
    baseCurrency: user?.base_asset?.code ?? FALLBACK_BASE_CURRENCY,
  };
}

/**
 * i18n da requisição atual (Server Components, layouts, metadata). Memorizado por requisição.
 * Logado: idioma, fuso e moeda-base do usuário. Visitante: cookie/Accept-Language.
 */
export const getI18n = cache(async () => {
  const session = await getSession();
  const ctx: FormatContext = session
    ? await i18nContextForUser(session.user_id)
    : {
        locale: await guestLocale(),
        timeZone: FALLBACK_TIME_ZONE,
        baseCurrency: FALLBACK_BASE_CURRENCY,
      };
  return buildI18n(ctx);
});

/** i18n para Route Handlers: usa o usuário quando houver, senão o idioma do visitante. */
export async function i18nForUser(userId: string | null) {
  if (userId) return buildI18n(await i18nContextForUser(userId));
  return buildI18n({
    locale: await guestLocale(),
    timeZone: FALLBACK_TIME_ZONE,
    baseCurrency: FALLBACK_BASE_CURRENCY,
  });
}
