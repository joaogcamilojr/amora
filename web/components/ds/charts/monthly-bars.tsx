"use client";

import type { MonthSummary } from "@/lib/finance/analysis";
import { useI18n } from "@/lib/i18n/client";

const INCOME_COLOR = "var(--color-brand-500)";
const EXPENSE_COLOR = "var(--color-neutral-300)";

/** Receitas x despesas por mês. Série principal em azul Apgees, comparação em neutro. */
export function MonthlyBars({ data }: { data: MonthSummary[] }) {
  const { t, fmt } = useI18n();
  // Eixo sem símbolo de moeda: número compacto no idioma do usuário ("12,3 mil", "12.3K").
  const axis = new Intl.NumberFormat(fmt.locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const height = 200;
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expenses]));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const gridLines = Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => i * step,
  );

  return (
    <figure>
      <div className="mb-3 flex items-center gap-4 text-[12px] text-neutral-600">
        <Legend color={INCOME_COLOR} text={t("ds.charts.income")} />
        <Legend color={EXPENSE_COLOR} text={t("ds.charts.expenses")} />
      </div>
      <div className="flex gap-2">
        <div
          className="tabular relative w-14 shrink-0 text-right text-[11px] text-neutral-500"
          style={{ height: height }}
        >
          {gridLines.map((v) => (
            <span
              key={v}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: height - (v / top) * height }}
            >
              {axis.format(v)}
            </span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height: height }}>
          {gridLines.map((v) => (
            <div
              key={v}
              className="absolute inset-x-0 border-t border-neutral-100"
              style={{ top: height - (v / top) * height }}
            />
          ))}
          <div className="absolute inset-0 flex items-end justify-around gap-2">
            {data.map((d) => (
              <div
                key={d.month}
                className="group relative flex h-full flex-1 items-end justify-center gap-1"
              >
                <Bar value={d.income} top={top} color={INCOME_COLOR} />
                <Bar value={d.expenses} top={top} color={EXPENSE_COLOR} />
                <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden w-44 rounded-[var(--radius-control)] bg-neutral-950 p-3 text-[12px] leading-4 text-white shadow-[var(--shadow-popover)] group-hover:block">
                  <p className="mb-1 font-semibold">
                    {fmt.shortMonth(d.month)}
                  </p>
                  <p className="tabular">
                    {t("ds.charts.tooltipIncome", {
                      amount: fmt.money(d.income),
                    })}
                  </p>
                  <p className="tabular">
                    {t("ds.charts.tooltipExpenses", {
                      amount: fmt.money(d.expenses),
                    })}
                  </p>
                  <p className="tabular">
                    {t("ds.charts.tooltipResult", {
                      amount: fmt.money(d.result),
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ml-16 mt-2 flex justify-around text-[11px] text-neutral-500">
        {data.map((d) => (
          <span key={d.month} className="flex-1 text-center">
            {fmt.shortMonth(d.month)}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{t("ds.charts.monthlyCaption")}</caption>
        <thead>
          <tr>
            <th>{t("common.fields.month")}</th>
            <th>{t("ds.charts.income")}</th>
            <th>{t("ds.charts.expenses")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{fmt.shortMonth(d.month)}</td>
              <td>{fmt.money(d.income)}</td>
              <td>{fmt.money(d.expenses)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Bar({
  value,
  top,
  color,
}: {
  value: number;
  top: number;
  color: string;
}) {
  return (
    <div
      className="w-full max-w-7 rounded-t-[4px] transition-[height] duration-150"
      style={{ height: `${(value / top) * 100}%`, background: color }}
    />
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-[3px]"
        style={{ background: color }}
      />
      {text}
    </span>
  );
}

function niceStep(max: number): number {
  const bruto = max / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / potencia;
  const fator = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return fator * potencia;
}
