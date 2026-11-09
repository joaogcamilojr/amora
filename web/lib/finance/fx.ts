/** Tabela de câmbio para a moeda-base: código do ativo -> quanto 1 unidade vale na moeda-base. */
export type FxTable = Map<string, number>;

/** Moeda-pivô das cotações de provedor (o plano gratuito do provedor só entrega base USD). */
export const FX_PIVOT = "USD";

/** `USER`: informada pela pessoa (manual, fatura, extrato). `PROVIDER`: provedor automático. */
export interface FxRateInput {
  fromCode: string;
  toCode: string;
  rate: number;
  at: Date;
  origin: "USER" | "PROVIDER";
}

/** De onde veio a conversão de uma moeda. Sempre uma estimativa: o valor original é o fato. */
export interface FxMeta {
  source: "MANUAL" | "PROVIDER";
  /** AAAA-MM-DD da cotação (na triangulação, a mais antiga das duas). */
  date: string;
  /** Calculada via pivô (ex.: EUR→BRL passando por USD). */
  derived: boolean;
}

export interface FxResult {
  table: FxTable;
  meta: Map<string, FxMeta>;
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Monta a tabela para a moeda-base. Prioridade por moeda: cotação do usuário (a mais recente) > provedor direto
 * (a mais recente) > provedor via pivô USD. A cotação manual vence a automática mesmo que a automática seja mais nova.
 */
export function buildFx(baseCode: string, rates: FxRateInput[]): FxResult {
  const table: FxTable = new Map([[baseCode, 1]]);
  const meta = new Map<string, FxMeta>();
  const sorted = [...rates].sort((a, b) => a.at.getTime() - b.at.getTime());

  const direct = (origin: FxRateInput["origin"]) => {
    for (const r of sorted) {
      if (r.origin !== origin || r.rate <= 0) continue;
      const code =
        r.toCode === baseCode
          ? r.fromCode
          : r.fromCode === baseCode
            ? r.toCode
            : null;
      if (!code || code === baseCode) continue;
      table.set(code, r.toCode === baseCode ? r.rate : 1 / r.rate);
      meta.set(code, {
        source: origin === "USER" ? "MANUAL" : "PROVIDER",
        date: day(r.at),
        derived: false,
      });
    }
  };
  // Provedor primeiro e usuário depois: o que o usuário informou sobrescreve o automático.
  direct("PROVIDER");
  direct("USER");
  const userCodes = new Set(
    sorted
      .filter((r) => r.origin === "USER")
      .flatMap((r) => [r.fromCode, r.toCode]),
  );

  // Triangulação: unidades de cada moeda por 1 pivô, só com cotações de provedor.
  const perPivot = new Map<string, { value: number; date: string }>([
    [FX_PIVOT, { value: 1, date: "9999-12-31" }],
  ]);
  for (const r of sorted) {
    if (r.origin !== "PROVIDER" || r.rate <= 0) continue;
    if (r.fromCode === FX_PIVOT)
      perPivot.set(r.toCode, { value: r.rate, date: day(r.at) });
    else if (r.toCode === FX_PIVOT)
      perPivot.set(r.fromCode, { value: 1 / r.rate, date: day(r.at) });
  }
  const base = perPivot.get(baseCode);
  if (base) {
    for (const [code, per] of perPivot) {
      if (code === baseCode || table.has(code) || userCodes.has(code)) continue;
      table.set(code, base.value / per.value);
      meta.set(code, {
        source: "PROVIDER",
        date: base.date < per.date ? base.date : per.date,
        derived: true,
      });
    }
  }
  return { table, meta };
}

export function toBase(
  amount: number,
  assetCode: string,
  table: FxTable,
): number | null {
  const rate = table.get(assetCode);
  return rate === undefined ? null : amount * rate;
}
