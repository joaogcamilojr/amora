import type { Locale } from "./config";

export interface FormatContext {
  locale: Locale;
  /** Fuso IANA do usuário ("America/Montevideo"). */
  timeZone: string;
  /** Código da moeda-base do usuário ("BRL", "USD"…). */
  baseCurrency: string;
}

let isoCurrencies: Set<string> | null = null;
/** Moeda ISO 4217 conhecida pelo Intl (fiat). Cripto, pontos e afins ficam de fora. */
export function isIsoCurrency(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code)) return false;
  if (!isoCurrencies) {
    const intl = Intl as typeof Intl & {
      supportedValuesOf?: (key: "currency") => string[];
    };
    isoCurrencies = new Set(intl.supportedValuesOf?.("currency") ?? []);
  }
  return isoCurrencies.size === 0 || isoCurrencies.has(code);
}

/** "AAAA-MM-DD" de hoje no fuso informado. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Bandeira (emoji) a partir do código ISO do país. */
export function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

const utc = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
};

/**
 * Formatação dependente do usuário: idioma, fuso e moeda-base.
 * Datas civis ("AAAA-MM-DD", "AAAA-MM") não sofrem conversão de fuso; instantes (`Date`) usam o fuso do usuário.
 */
export function createFormatter(ctx: FormatContext) {
  const { locale, timeZone, baseCurrency } = ctx;
  const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
  const nf = (key: string, options: Intl.NumberFormatOptions) => {
    let f = cache.get(`n:${key}`) as Intl.NumberFormat | undefined;
    if (!f) cache.set(`n:${key}`, (f = new Intl.NumberFormat(locale, options)));
    return f;
  };
  const df = (key: string, options: Intl.DateTimeFormatOptions) => {
    let f = cache.get(`d:${key}`) as Intl.DateTimeFormat | undefined;
    if (!f)
      cache.set(`d:${key}`, (f = new Intl.DateTimeFormat(locale, options)));
    return f;
  };

  function money(
    value: number,
    assetCode: string = baseCurrency,
    decimals?: number,
  ): string {
    if (isIsoCurrency(assetCode))
      return nf(`cur:${assetCode}:${decimals ?? ""}`, {
        style: "currency",
        currency: assetCode,
        ...(decimals !== undefined
          ? {
              minimumFractionDigits: Math.min(decimals, 2),
              maximumFractionDigits: decimals,
            }
          : {}),
      }).format(value);
    return `${nf(`asset:${decimals ?? 8}`, { minimumFractionDigits: 2, maximumFractionDigits: decimals ?? 8 }).format(value)} ${assetCode}`;
  }

  return {
    locale,
    timeZone,
    baseCurrency,
    money,
    /** Valor curto para gráficos e KPIs ("R$ 12,3 mil", "$12.3K"). */
    compactMoney(value: number, assetCode: string = baseCurrency): string {
      if (Math.abs(value) < 10_000 || !isIsoCurrency(assetCode))
        return money(value, assetCode);
      return nf(`compact:${assetCode}`, {
        style: "currency",
        currency: assetCode,
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
    },
    number(value: number, maximumFractionDigits = 2): string {
      return nf(`num:${maximumFractionDigits}`, {
        maximumFractionDigits,
      }).format(value);
    },
    percent(value: number, digits = 1): string {
      return nf(`pct:${digits}`, {
        style: "percent",
        maximumFractionDigits: digits,
      }).format(value);
    },
    /** Abreviação do mês (1–12): "mai", "May", "may". */
    monthAbbr(month: number): string {
      const label = df("mabbr", { month: "short", timeZone: "UTC" }).format(
        new Date(Date.UTC(2000, month - 1, 1)),
      );
      return label.replace(/\.$/, "");
    },
    /** "2026-05" → "mai/26" */
    shortMonth(yearMonth: string): string {
      const [year, month] = yearMonth.split("-");
      const label = df("mabbr", { month: "short", timeZone: "UTC" })
        .format(new Date(Date.UTC(Number(year), Number(month) - 1, 1)))
        .replace(/\.$/, "");
      return `${label}/${year.slice(2)}`;
    },
    /** "2026-05" → "maio de 2026" / "May 2026" */
    longMonth(yearMonth: string): string {
      return df("mlong", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(utc(`${yearMonth}-01`));
    },
    /** "2026-05-08" → "08/05/2026" / "05/08/2026" */
    civilDate(iso: string): string {
      return df("civil", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }).format(utc(iso));
    },
    /** "2026-05-08" → "8 de mai." / "May 8" */
    dayMonth(iso: string): string {
      return df("daymonth", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(utc(iso));
    },
    /** Instante no fuso do usuário: "08/05/2026, 14:30". */
    dateTime(at: Date | string): string {
      return df("datetime", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone,
      }).format(new Date(at));
    },
    /** Hoje (AAAA-MM-DD) no fuso do usuário. */
    today(): string {
      return todayIn(timeZone);
    },
    /** Mês atual (AAAA-MM) no fuso do usuário. */
    currentMonth(): string {
      return todayIn(timeZone).slice(0, 7);
    },
    countryName(code: string): string {
      try {
        return (
          new Intl.DisplayNames([locale], { type: "region" }).of(
            code.toUpperCase(),
          ) ?? code
        );
      } catch {
        return code;
      }
    },
    currencyName(code: string): string {
      try {
        return (
          new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code
        );
      } catch {
        return code;
      }
    },
    countryFlag,
  };
}

export type Formatter = ReturnType<typeof createFormatter>;
