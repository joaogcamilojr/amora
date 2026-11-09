/** Idiomas suportados pela interface. O primeiro é o padrão quando nada é informado. */
export const LOCALES = ["pt-BR", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

/** Fuso usado quando o usuário não está logado ou tem um fuso inválido. */
export const FALLBACK_TIME_ZONE = "UTC";

/**
 * Moeda-base usada só quando o usuário ainda não escolheu a dele (`users.base_asset_id` vazio).
 * Neutra de propósito: a moeda-base real vem do usuário (tela Preferências).
 */
export const FALLBACK_BASE_CURRENCY = "USD";

/** Cookie com o idioma escolhido antes do login (landing e login). */
export const LOCALE_COOKIE = "amora_locale";

/** Nome de cada idioma nele mesmo (endônimo): não se traduz. */
export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português (Brasil)",
  en: "English",
  es: "Español",
};

/** Normaliza uma tag BCP 47 qualquer ("pt", "pt-PT", "en-US", "es-UY") para um idioma suportado. */
export function resolveLocale(input: string | null | undefined): Locale | null {
  if (!input) return null;
  const tag = input.trim().replace("_", "-").toLowerCase();
  if (!tag) return null;
  const exact = LOCALES.find((l) => l.toLowerCase() === tag);
  if (exact) return exact;
  const language = tag.split("-")[0];
  if (language === "pt") return "pt-BR";
  return LOCALES.find((l) => l.toLowerCase() === language) ?? null;
}

/** Escolhe o idioma a partir do cabeçalho Accept-Language ("en-US,en;q=0.9,pt;q=0.8"). */
export function negotiateLocale(
  acceptLanguage: string | null | undefined,
): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag, q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const locale = resolveLocale(tag);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}

export function isValidTimeZone(
  timeZone: string | null | undefined,
): timeZone is string {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Fusos IANA disponíveis no runtime (para o seletor de preferências). */
export function timeZoneOptions(): string[] {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  const zones = intl.supportedValuesOf?.("timeZone") ?? [];
  return zones.includes("UTC") ? zones : ["UTC", ...zones];
}
