"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { buildI18n, type I18n, type Locale, type Messages } from ".";

const I18nContext = createContext<I18n | null>(null);

/** Disponibiliza idioma, fuso, moeda-base e catálogo para componentes cliente. Montado no layout raiz. */
export function I18nProvider({
  locale,
  timeZone,
  baseCurrency,
  messages,
  children,
}: {
  locale: Locale;
  timeZone: string;
  baseCurrency: string;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo(
    () => buildI18n({ locale, timeZone, baseCurrency, messages }),
    [locale, timeZone, baseCurrency, messages],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** `{ t, fmt, locale, timeZone, baseCurrency }` no cliente. */
export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n fora de <I18nProvider>");
  return value;
}
