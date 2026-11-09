import { isCountryCode } from "@/lib/countries";
import { prisma } from "@/lib/prisma";
import { isValidTimeZone, LOCALES, type Locale } from "@/lib/i18n";
import { stringValue, ValidationError } from "@/lib/validation";

/** Preferências do usuário logado (idioma, fuso, moeda-base, nome). */
export async function getPreferences(userId: string) {
  const user = await prisma.users.findUniqueOrThrow({
    where: { id: userId },
    select: {
      email: true,
      display_name: true,
      locale: true,
      timezone: true,
      country_code: true,
      onboarded_at: true,
      base_asset: { select: { code: true } },
    },
  });
  return {
    email: user.email,
    display_name: user.display_name,
    locale: user.locale,
    time_zone: user.timezone,
    base_currency: user.base_asset?.code ?? null,
    country_code: user.country_code,
    onboarded_at: user.onboarded_at,
  };
}

/** Atualiza só os campos enviados. Corpo em camelCase: displayName, locale, timeZone, baseCurrency, countryCode ("" limpa). */
export async function updatePreferences(userId: string, body: Record<string, unknown>) {
  const data: { display_name?: string | null; locale?: Locale; timezone?: string; base_asset_id?: string; country_code?: string | null } = {};
  if ("displayName" in body) data.display_name = stringValue(body.displayName, "displayName", 120, false) || null;
  if ("locale" in body) {
    if (!LOCALES.includes(body.locale as Locale)) throw new ValidationError("VALIDATION_ERROR", "errors.invalidLocale");
    data.locale = body.locale as Locale;
  }
  if ("timeZone" in body) {
    if (typeof body.timeZone !== "string" || !isValidTimeZone(body.timeZone))
      throw new ValidationError("VALIDATION_ERROR", "errors.invalidTimeZone");
    data.timezone = body.timeZone;
  }
  if ("countryCode" in body) {
    if (body.countryCode === "" || body.countryCode === null) data.country_code = null;
    else if (isCountryCode(body.countryCode)) data.country_code = (body.countryCode as string).toUpperCase();
    else throw new ValidationError("VALIDATION_ERROR", "errors.invalidCountry");
  }
  if ("baseCurrency" in body) {
    const code = typeof body.baseCurrency === "string" ? body.baseCurrency.trim().toUpperCase() : "";
    const asset = code
      ? await prisma.assets.findFirst({ where: { code, active: true, type: "FIAT" }, select: { id: true } })
      : null;
    if (!asset) throw new ValidationError("VALIDATION_ERROR", "errors.invalidCurrency");
    data.base_asset_id = asset.id;
  }
  await prisma.users.update({ where: { id: userId }, data });
  return getPreferences(userId);
}

/** Moedas fiduciárias ativas do catálogo (opções de moeda-base). */
export async function baseCurrencyOptions() {
  return prisma.assets.findMany({
    where: { active: true, type: "FIAT" },
    select: { code: true, name: true },
    orderBy: { code: "asc" },
  });
}
