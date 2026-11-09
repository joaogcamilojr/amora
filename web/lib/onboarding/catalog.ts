import { isCountryCode } from "@/lib/countries";
import { LOCALES, type Locale, resolveLocale } from "@/lib/i18n/config";

import { UNIVERSAL_CATEGORIES } from "./categories";
import { BR_PACK } from "./packs/br";
import { GENERIC_PACK } from "./packs/generic";
import { UY_PACK } from "./packs/uy";
import { US_PACK } from "./packs/us";
import type { CategoryTemplate, CountryPack } from "./types";

const PACKS: Record<string, CountryPack> = {
  BR: BR_PACK,
  UY: UY_PACK,
  US: US_PACK,
};

/** Países com pacote próprio. Os demais usam o pacote genérico. */
export const PACK_COUNTRIES = Object.keys(PACKS);

export function normalizeCountry(value: unknown): string | null {
  return isCountryCode(value) ? value.toUpperCase() : null;
}

export function packFor(countryCode: string | null): CountryPack {
  return (countryCode && PACKS[countryCode.toUpperCase()]) || GENERIC_PACK;
}

export function categoriesFor(pack: CountryPack): CategoryTemplate[] {
  return [...UNIVERSAL_CATEGORIES, ...pack.extraCategories];
}

const SPANISH_COUNTRIES = new Set(
  "AR BO CL CO CR CU DO EC ES GT HN MX NI PA PE PY SV UY VE".split(" "),
);

/** Idioma sugerido para um país: o do pacote, senão por região; o usuário sempre pode trocar. */
export function suggestedLocale(
  countryCode: string | null,
  fallback: Locale,
): Locale {
  const pack = packFor(countryCode);
  if (pack.defaults) return pack.defaults.locale;
  const code = countryCode?.toUpperCase();
  if (code === "PT" || code === "AO" || code === "MZ")
    return resolveLocale("pt") ?? fallback;
  if (code && SPANISH_COUNTRIES.has(code)) return "es";
  return LOCALES.includes(fallback) ? fallback : "en";
}
