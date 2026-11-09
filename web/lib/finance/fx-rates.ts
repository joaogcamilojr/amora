import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";

import { FX_PIVOT } from "./fx";
import { isCalendarDate } from "./fx-date";
import { fetchProviderRates, PROVIDER_NAME } from "./fx-provider";

/** Teto de dias por backfill: cada dia custa 1 requisição do plano gratuito (1.000/mês). */
export const MAX_BACKFILL_DAYS = 31;

/**
 * Grava as cotações USD→moeda de um dia para todas as moedas fiduciárias ativas do catálogo.
 * Uma linha por par e dia (`provider_timestamp` = 00:00 UTC do dia); rodar de novo no mesmo dia não duplica
 * nem sobrescreve. Nunca toca em cotações manuais.
 */
export async function refreshRates(date?: string) {
  if (date !== undefined && !isCalendarDate(date))
    throw new ValidationError("VALIDATION_ERROR", "errors.fx.invalidDate");
  const assets = await prisma.assets.findMany({
    where: { active: true, type: "FIAT" },
    select: { id: true, code: true },
  });
  const pivot = assets.find((a) => a.code === FX_PIVOT);
  if (!pivot)
    throw new ValidationError("VALIDATION_ERROR", "errors.fx.pivotMissing");
  const targets = assets.filter((a) => a.id !== pivot.id);
  const provider = await fetchProviderRates(
    targets.map((a) => a.code),
    date,
  );
  const at = new Date(`${provider.date}T00:00:00Z`);
  const data = targets
    .filter((a) => provider.rates[a.code] !== undefined)
    .map((a) => ({
      from_asset_id: pivot.id,
      to_asset_id: a.id,
      rate: new Prisma.Decimal(provider.rates[a.code]),
      provider: PROVIDER_NAME,
      reference_type: "daily",
      source: "PROVIDER" as const,
      provider_timestamp: at,
      indicative: true,
    }));
  const created = await prisma.exchange_rates.createMany({
    data,
    skipDuplicates: true,
  });
  return {
    date: provider.date,
    requested: targets.length,
    received: data.length,
    created: created.count,
  };
}

/** Últimos `days` dias (inclusive hoje), do mais antigo ao mais novo. Para em erro e devolve o que já gravou. */
export async function backfillRates(days: number) {
  if (!Number.isInteger(days) || days < 1 || days > MAX_BACKFILL_DAYS)
    throw new ValidationError("VALIDATION_ERROR", "errors.fx.invalidDays", {
      max: MAX_BACKFILL_DAYS,
    });
  const results: Awaited<ReturnType<typeof refreshRates>>[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86_400_000)
      .toISOString()
      .slice(0, 10);
    results.push(await refreshRates(date));
  }
  return results;
}

/** Desativa (não apaga) uma cotação informada pela própria pessoa; a automática volta a valer para o par. */
export async function deactivateOwnRate(userId: string, id: string) {
  const rate = await prisma.exchange_rates.findFirst({
    where: { id, owner_id: userId, source: { not: "PROVIDER" }, stale: false },
    select: { id: true },
  });
  if (!rate)
    throw new ValidationError("RESOURCE_NOT_FOUND", "common.errors.notFound");
  await prisma.exchange_rates.update({ where: { id }, data: { stale: true } });
  return { id, stale: true };
}
