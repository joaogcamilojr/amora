import { ValidationError } from "@/lib/validation";

import { normalizeFrankfurter } from "./fx-frankfurter";

export interface ProviderRates {
  /** Nome do provedor, gravado em `exchange_rates.provider`. */
  provider: string;
  /** Dia UTC (AAAA-MM-DD) a que as cotações se referem. */
  date: string;
  /** Unidades de cada moeda por 1 USD. */
  rates: Record<string, number>;
}

export type ProviderName = "frankfurter" | "openexchangerates";

/**
 * Provedor ativo: `FX_PROVIDER` = `frankfurter` (padrão, gratuito, sem chave) ou `openexchangerates`
 * (exige `OPEN_EXCHANGE_RATES_APP_ID`).
 */
export function activeProvider(): ProviderName {
  return process.env.FX_PROVIDER?.trim().toLowerCase() === "openexchangerates"
    ? "openexchangerates"
    : "frankfurter";
}

const failed = () =>
  new ValidationError("INTERNAL_ERROR", "errors.fx.providerFailed");

async function getJson(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw failed();
  }
  if (!response.ok) throw failed();
  return response.json().catch(() => null);
}

/**
 * Busca as cotações mais recentes (`date` ausente) ou as de um dia. Sempre devolve "por 1 USD", qualquer
 * que seja o provedor, e só moedas com cotação positiva e finita.
 */
export async function fetchProviderRates(
  symbols: string[],
  date?: string,
): Promise<ProviderRates> {
  return activeProvider() === "openexchangerates"
    ? fetchOpenExchangeRates(symbols, date)
    : fetchFrankfurter(symbols, date);
}

/** Frankfurter v2: gratuito, sem chave, sem cota; bancos centrais e fontes oficiais. Cotações diárias de referência. */
async function fetchFrankfurter(
  symbols: string[],
  date?: string,
): Promise<ProviderRates> {
  const params = new URLSearchParams({
    base: "usd",
    quotes: [...symbols, "USD"].map((s) => s.toLowerCase()).join(","),
  });
  if (date) params.set("date", date);
  const json = await getJson(`https://api.frankfurter.dev/v2/rates?${params}`);
  const normalized = normalizeFrankfurter(json, symbols);
  if (!normalized) throw failed();
  return {
    provider: "frankfurter",
    date: date ?? normalized.date,
    rates: normalized.rates,
  };
}

/** Open Exchange Rates: plano gratuito é base USD e 1.000 requisições/mês (confirme o plano vigente). */
async function fetchOpenExchangeRates(
  symbols: string[],
  date?: string,
): Promise<ProviderRates> {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
  if (!appId)
    throw new ValidationError(
      "INTERNAL_ERROR",
      "errors.fx.providerNotConfigured",
    );
  const path = date ? `historical/${date}.json` : "latest.json";
  const params = new URLSearchParams({
    app_id: appId,
    base: "USD",
    symbols: symbols.join(","),
  });
  const json = (await getJson(
    `https://openexchangerates.org/api/${path}?${params}`,
  )) as { timestamp?: number; rates?: Record<string, number> } | null;
  if (!json?.rates || typeof json.timestamp !== "number") throw failed();
  const rates = Object.fromEntries(
    Object.entries(json.rates).filter(
      ([, v]) => typeof v === "number" && Number.isFinite(v) && v > 0,
    ),
  );
  return {
    provider: "openexchangerates",
    date: date ?? new Date(json.timestamp * 1000).toISOString().slice(0, 10),
    rates,
  };
}
