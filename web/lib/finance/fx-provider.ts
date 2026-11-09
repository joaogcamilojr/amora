import { ValidationError } from "@/lib/validation";

const BASE_URL = "https://openexchangerates.org/api";

export interface ProviderRates {
  /** Dia UTC (AAAA-MM-DD) a que as cotações se referem. */
  date: string;
  /** Unidades de cada moeda por 1 USD. */
  rates: Record<string, number>;
}

/** Plano gratuito: base USD, 1.000 requisições/mês. Cada chamada devolve todas as moedas pedidas. */
export const PROVIDER_NAME = "openexchangerates";

/**
 * Busca as cotações mais recentes (`date` ausente) ou as de um dia (`historical/AAAA-MM-DD`).
 * A chave vem de `OPEN_EXCHANGE_RATES_APP_ID` e nunca é logada nem devolvida em erros.
 */
export async function fetchProviderRates(
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
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${path}?${params}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ValidationError("INTERNAL_ERROR", "errors.fx.providerFailed");
  }
  if (!response.ok)
    throw new ValidationError("INTERNAL_ERROR", "errors.fx.providerFailed");
  const json = (await response.json().catch(() => null)) as {
    timestamp?: number;
    rates?: Record<string, number>;
  } | null;
  if (!json?.rates || typeof json.timestamp !== "number")
    throw new ValidationError("INTERNAL_ERROR", "errors.fx.providerFailed");
  const rates = Object.fromEntries(
    Object.entries(json.rates).filter(
      ([, v]) => typeof v === "number" && Number.isFinite(v) && v > 0,
    ),
  );
  return {
    date: date ?? new Date(json.timestamp * 1000).toISOString().slice(0, 10),
    rates,
  };
}
