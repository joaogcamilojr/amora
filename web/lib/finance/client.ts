"use client";

import { DEFAULT_LOCALE, resolveLocale } from "@/lib/i18n/config";
import common from "@/lib/i18n/messages/common";

/** Mensagens genéricas no idioma da página (o servidor já devolve os erros de domínio traduzidos). */
function genericErrors() {
  const locale =
    (typeof document !== "undefined" &&
      resolveLocale(document.documentElement.lang)) ||
    DEFAULT_LOCALE;
  return common[locale].errors;
}

/** Chamada à API v1 a partir de componentes cliente. Devolve a mensagem de erro do envelope `{ error }`. */
export async function api<T = unknown>(
  url: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  payload?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const response = await fetch(url, {
      method,
      headers:
        payload === undefined
          ? undefined
          : { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const json = (await response.json().catch(() => ({}))) as {
      data?: T;
      error?: { message?: string };
    };
    if (!response.ok)
      return {
        ok: false,
        error: json.error?.message ?? genericErrors().generic,
      };
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, error: genericErrors().offline };
  }
}

/** Converte "1.234,56" ou "1234.56" em string decimal positiva aceita pela API. */
export function decimalInput(text: string): string | null {
  const t = text.trim().replace(/\s/g, "");
  if (!t) return null;
  const normalized = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : t;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return normalized.replace(/^0+(?=\d)/, "");
}
