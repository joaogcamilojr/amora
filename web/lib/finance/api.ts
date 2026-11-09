import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";
import { jsonData, jsonError } from "@/lib/http";
import {
  buildI18n,
  DEFAULT_LOCALE,
  FALLBACK_BASE_CURRENCY,
  FALLBACK_TIME_ZONE,
  type MessageKey,
  type Translator,
} from "@/lib/i18n";
import { i18nForUser } from "@/lib/i18n/server";
import { logError } from "@/lib/log";
import { MoneyValidationError } from "@/lib/money";
import { ValidationError } from "@/lib/validation";

const STATUS: Record<string, number> = {
  RESOURCE_NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PLAN_REQUIRED: 402,
  PLAN_LIMIT: 402,
  NOT_CONFIGURED: 503,
};

const fallbackT = buildI18n({
  locale: DEFAULT_LOCALE,
  timeZone: FALLBACK_TIME_ZONE,
  baseCurrency: FALLBACK_BASE_CURRENCY,
}).t;

/** Traduz a mensagem se ela for uma chave do catálogo; senão devolve o texto como veio. */
function localize(
  t: Translator,
  message: string,
  vars?: Record<string, string | number>,
) {
  if (!/^[a-z][\w]*(\.[\w]+)+$/i.test(message)) return message;
  const text = t(message as MessageKey, vars);
  return text === message ? message : text;
}

/**
 * Mensagem traduzida de um erro qualquer, para rotas que montam a própria resposta (fora de `withUser`).
 * ValidationError/MoneyValidationError: chave do catálogo. `Error("CODIGO")`: `errors.codes.CODIGO` se existir.
 * Qualquer outro texto (interno) vira `fallback`, para não vazar detalhes.
 */
export function localizeError(
  error: unknown,
  t: Translator,
  fallback: MessageKey = "common.errors.generic",
) {
  if (error instanceof ValidationError || error instanceof MoneyValidationError)
    return localize(t, error.message, error.vars);
  if (error instanceof SyntaxError) return t("common.errors.invalidJson");
  if (error instanceof Error && /^[A-Z_]+$/.test(error.message)) {
    const key = `errors.codes.${error.message}`;
    const text = t(key as MessageKey);
    if (text !== key) return text;
  }
  return t(fallback);
}

/**
 * Converte exceções de domínio no envelope `{ error: { code, message } }`, com a mensagem no idioma do usuário.
 * Nunca expõe stack nem dados sensíveis.
 */
export function toErrorResponse(error: unknown, t: Translator = fallbackT) {
  if (error instanceof ValidationError)
    return jsonError(
      STATUS[error.code] ?? 400,
      error.code,
      localize(t, error.message, error.vars),
    );
  if (error instanceof MoneyValidationError)
    return jsonError(
      400,
      "VALIDATION_ERROR",
      localize(t, error.message, error.vars),
    );
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return jsonError(409, "CONFLICT", t("common.errors.conflict"));
    if (error.code === "P2025")
      return jsonError(404, "RESOURCE_NOT_FOUND", t("common.errors.notFound"));
  }
  if (error instanceof SyntaxError)
    return jsonError(400, "VALIDATION_ERROR", t("common.errors.invalidJson"));
  logError("finance-api", error);
  return jsonError(500, "INTERNAL_ERROR", t("common.errors.unexpected"));
}

/** 401 traduzido para o idioma do visitante. */
export async function unauthorizedResponse() {
  return jsonError(
    401,
    "UNAUTHORIZED",
    (await i18nForUser(null)).t("common.errors.unauthorized"),
  );
}

/** Erro com mensagem do catálogo, no idioma do usuário (ou do visitante, com `userId` nulo). */
export async function localizedError(
  userId: string | null,
  status: number,
  code: string,
  key: MessageKey,
  vars?: Record<string, string | number>,
) {
  const { t } = await i18nForUser(userId).catch(() => ({ t: fallbackT }));
  return jsonError(status, code, t(key, vars));
}

/** Erro capturado num `catch`, com a mensagem traduzida por `localizeError`. */
export async function caughtError(
  userId: string | null,
  status: number,
  code: string,
  error: unknown,
  fallback?: MessageKey,
) {
  const { t } = await i18nForUser(userId).catch(() => ({ t: fallbackT }));
  return jsonError(status, code, localizeError(error, t, fallback));
}

/** Executa um handler autenticado. O retorno vira `{ data }`. */
export async function withUser(
  fn: (userId: string) => Promise<unknown>,
  status = 200,
) {
  const session = await getSession();
  if (!session)
    return jsonError(
      401,
      "UNAUTHORIZED",
      (await i18nForUser(null)).t("common.errors.unauthorized"),
    );
  try {
    return jsonData(await fn(session.user_id), status);
  } catch (error) {
    const { t } = await i18nForUser(session.user_id).catch(() => ({
      t: fallbackT,
    }));
    return toErrorResponse(error, t);
  }
}

export async function body(
  request: NextRequest,
): Promise<Record<string, unknown>> {
  const value = (await request.json()) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ValidationError(
      "VALIDATION_ERROR",
      "common.errors.bodyMustBeObject",
    );
  return value as Record<string, unknown>;
}
