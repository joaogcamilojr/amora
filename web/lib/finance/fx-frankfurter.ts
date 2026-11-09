/** Normalização das respostas do Frankfurter v2 (puro, sem rede). */
export interface FrankfurterEntry {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

/**
 * Converte as linhas do Frankfurter (`[{ date, base, quote, rate }]`) em "unidades de cada moeda por 1 USD".
 * Não depende da base devolvida: com base USD usa as cotações direto; com outra base (ex.: EUR) triangula
 * pela cotação USD dessa base. Devolve `null` se não der para chegar a nenhuma moeda pedida.
 * A data é a mais recente entre as linhas usadas.
 */
export function normalizeFrankfurter(
  entries: unknown,
  symbols: string[],
): { date: string; rates: Record<string, number> } | null {
  if (!Array.isArray(entries)) return null;
  const rows = entries.flatMap((e): FrankfurterEntry[] => {
    if (!e || typeof e !== "object") return [];
    const { date, base, quote, rate } = e as Record<string, unknown>;
    if (
      typeof date !== "string" ||
      typeof base !== "string" ||
      typeof quote !== "string" ||
      typeof rate !== "number" ||
      !Number.isFinite(rate) ||
      rate <= 0
    )
      return [];
    return [
      { date, base: base.toUpperCase(), quote: quote.toUpperCase(), rate },
    ];
  });
  if (rows.length === 0) return null;
  const base = rows[0].base;
  const byQuote = new Map<string, FrankfurterEntry>();
  for (const row of rows) if (row.base === base) byQuote.set(row.quote, row);
  const usd = byQuote.get("USD");
  if (base !== "USD" && !usd) return null;

  const rates: Record<string, number> = {};
  let date = "";
  const track = (e: FrankfurterEntry) => {
    if (e.date > date) date = e.date;
  };
  for (const raw of symbols) {
    const code = raw.toUpperCase();
    if (code === "USD") continue;
    let value: number | undefined;
    if (base === "USD") {
      const entry = byQuote.get(code);
      if (entry) {
        value = entry.rate;
        track(entry);
      }
    } else if (usd) {
      if (code === base) {
        value = 1 / usd.rate;
        track(usd);
      } else {
        const entry = byQuote.get(code);
        if (entry) {
          value = entry.rate / usd.rate;
          track(entry);
          track(usd);
        }
      }
    }
    if (value !== undefined && Number.isFinite(value) && value > 0)
      rates[code] = value;
  }
  return Object.keys(rates).length > 0 ? { date, rates } : null;
}
