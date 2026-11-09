import type { Prisma } from "@prisma/client";

import { getCountryLabel } from "@/lib/countries";
import {
  buildI18n,
  DEFAULT_LOCALE,
  FALLBACK_BASE_CURRENCY,
  FALLBACK_TIME_ZONE,
  resolveLocale,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";
import { i18nContextForUser } from "@/lib/i18n/server";
import {
  categoriesFor,
  normalizeCountry,
  packFor,
  suggestedLocale,
} from "@/lib/onboarding/catalog";
import { prisma } from "@/lib/prisma";
import { getPreferences, updatePreferences } from "@/lib/preferences";
import { ValidationError } from "@/lib/validation";

/** Regras do pacote ficam depois das do usuário (prioridade padrão 100); menor número vence. */
const PACK_RULE_PRIORITY_BASE = 200;

function translatorFor(locale: Locale) {
  return buildI18n({
    locale,
    timeZone: FALLBACK_TIME_ZONE,
    baseCurrency: FALLBACK_BASE_CURRENCY,
  }).t;
}

function localeOrDefault(value: unknown, fallback: Locale): Locale {
  return resolveLocale(typeof value === "string" ? value : null) ?? fallback;
}

/** Primeiro acesso = nunca concluiu nem pulou e ainda não tem conta nem categoria (usuários antigos são marcados como concluídos). */
export async function getOnboardingState(userId: string) {
  const user = await prisma.users.findUniqueOrThrow({
    where: { id: userId },
    select: { country_code: true, onboarded_at: true },
  });
  if (user.onboarded_at)
    return { countryCode: user.country_code, needsOnboarding: false };
  const [accounts, categories] = await Promise.all([
    prisma.accounts.count({ where: { owner_id: userId } }),
    prisma.categories.count({ where: { owner_id: userId } }),
  ]);
  if (accounts > 0 || categories > 0) {
    // Quem já tem dados não passa pelo onboarding: marca uma vez e evita as contagens nas próximas requisições.
    await prisma.users.update({
      where: { id: userId },
      data: { onboarded_at: new Date() },
    });
    return { countryCode: user.country_code, needsOnboarding: false };
  }
  return { countryCode: user.country_code, needsOnboarding: true };
}

/** Pacote do país já traduzido para o idioma escolhido (prévia; nada é gravado). */
export async function previewPack(
  userId: string,
  countryInput: unknown,
  localeInput: unknown,
) {
  const country = normalizeCountry(countryInput);
  if (!country)
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidCountry");
  const ctx = await i18nContextForUser(userId);
  const pack = packFor(country);
  const locale = localeOrDefault(
    localeInput,
    suggestedLocale(country, ctx.locale as Locale),
  );
  const t = translatorFor(locale);
  const categories = categoriesFor(pack).map((c) => ({
    slug: c.slug,
    kind: c.kind,
    name: t(`onboarding.categories.${c.key}` as MessageKey),
  }));
  const names = new Map(categories.map((c) => [c.slug, c.name]));
  return {
    countryCode: country,
    packId: pack.id,
    countryName: getCountryLabel(country, locale),
    defaults: pack.defaults,
    locale,
    categories,
    rules: pack.rules.map((r) => ({
      pattern: r.pattern,
      transactionType: r.transactionType,
      direction: r.direction,
      categoryName: r.categorySlug ? (names.get(r.categorySlug) ?? null) : null,
    })),
    accountTypes: pack.accountTypes,
  };
}

/**
 * Cria as categorias e regras do pacote que o usuário ainda não tem. Idempotente: não altera nem duplica o existente
 * (categoria única por slug; regra ignorada se o mesmo padrão já existe).
 */
export async function applyPack(
  userId: string,
  options: {
    countryCode: string | null;
    locale: Locale;
    categories: boolean;
    rules: boolean;
  },
) {
  const pack = packFor(options.countryCode);
  const t = translatorFor(options.locale);
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let createdCategories = 0;
    let createdRules = 0;
    if (options.categories || options.rules) {
      const created = await tx.categories.createMany({
        data: categoriesFor(pack).map((c) => ({
          owner_id: userId,
          slug: c.slug,
          kind: c.kind,
          name: t(`onboarding.categories.${c.key}` as MessageKey),
          icon: c.icon ?? null,
          color: c.color ?? null,
        })),
        skipDuplicates: true,
      });
      createdCategories = created.count;
    }
    if (options.rules) {
      const [categories, existing] = await Promise.all([
        tx.categories.findMany({
          where: { owner_id: userId },
          select: { id: true, slug: true },
        }),
        tx.classification_rules.findMany({
          where: { owner_id: userId },
          select: { pattern: true },
        }),
      ]);
      const bySlug = new Map(categories.map((c) => [c.slug, c.id]));
      const known = new Set(existing.map((r) => r.pattern));
      const fresh = pack.rules
        .map((rule, index) => ({ rule, index }))
        .filter(({ rule }) => !known.has(rule.pattern));
      const created = await tx.classification_rules.createMany({
        data: fresh.map(({ rule, index }) => ({
          owner_id: userId,
          priority: PACK_RULE_PRIORITY_BASE + index * 10,
          pattern: rule.pattern,
          transaction_type: rule.transactionType,
          direction: rule.direction,
          category_id: rule.categorySlug
            ? (bySlug.get(rule.categorySlug) ?? null)
            : null,
        })),
      });
      createdRules = created.count;
    }
    return { categories: createdCategories, rules: createdRules };
  });
}

/** Conclui o primeiro acesso: grava preferências e país e aplica o que a pessoa escolheu do pacote. */
export async function completeOnboarding(
  userId: string,
  body: Record<string, unknown>,
) {
  const country = normalizeCountry(body.countryCode);
  if (!country)
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidCountry");
  const current = await getPreferences(userId);
  const prefs = await updatePreferences(userId, {
    countryCode: country,
    ...(body.displayName !== undefined
      ? { displayName: body.displayName }
      : {}),
    ...(body.locale !== undefined ? { locale: body.locale } : {}),
    ...(body.timeZone !== undefined ? { timeZone: body.timeZone } : {}),
    ...(body.baseCurrency ? { baseCurrency: body.baseCurrency } : {}),
  });
  const applied = await applyPack(userId, {
    countryCode: country,
    locale: localeOrDefault(
      prefs.locale,
      localeOrDefault(current.locale, DEFAULT_LOCALE),
    ),
    categories: body.applyCategories !== false,
    rules: body.applyRules !== false,
  });
  await prisma.users.update({
    where: { id: userId },
    data: { onboarded_at: new Date() },
  });
  return { ...applied, preferences: await getPreferences(userId) };
}

export async function skipOnboarding(userId: string) {
  await prisma.users.update({
    where: { id: userId },
    data: { onboarded_at: new Date() },
  });
  return { skipped: true };
}

/** Reaplica o pacote do país salvo em Preferências (idempotente). */
export async function applyCountryPack(userId: string) {
  const prefs = await getPreferences(userId);
  const country = normalizeCountry(prefs.country_code);
  if (!country)
    throw new ValidationError(
      "VALIDATION_ERROR",
      "onboarding.settings.needCountry",
    );
  return applyPack(userId, {
    countryCode: country,
    locale: localeOrDefault(prefs.locale, DEFAULT_LOCALE),
    categories: true,
    rules: true,
  });
}
