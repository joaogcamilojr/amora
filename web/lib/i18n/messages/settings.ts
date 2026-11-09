import { defineMessages } from "./define";

/** Tela de preferências do usuário (idioma, fuso, moeda-base). */
export default defineMessages(
  {
    title: "Preferências",
    subtitle: "Idioma, fuso horário e moeda-base usados em todas as telas.",
    displayName: "Nome de exibição",
    language: "Idioma",
    languageHint: "Textos, datas e números seguem o idioma escolhido.",
    timeZone: "Fuso horário",
    timeZoneHint: 'Define o que é "hoje" e o mês atual nos resumos.',
    baseCurrency: "Moeda-base",
    baseCurrencyHint:
      "Totais e indicadores são convertidos para esta moeda. O valor original de cada lançamento nunca muda; sem cotação, a conversão fica vazia.",
    detectTimeZone: "Usar o fuso deste dispositivo",
    saved: "Preferências salvas",
    saveFailed: "Não foi possível salvar",
    preview: "Exemplo: {money} · {date}",
  },
  {
    en: {
      title: "Preferences",
      subtitle: "Language, time zone and base currency used across the app.",
      displayName: "Display name",
      language: "Language",
      languageHint: "Text, dates and numbers follow the selected language.",
      timeZone: "Time zone",
      timeZoneHint:
        'Defines what "today" and the current month are in summaries.',
      baseCurrency: "Base currency",
      baseCurrencyHint:
        "Totals and indicators are converted to this currency. Each transaction's original amount never changes; without an exchange rate, the conversion stays empty.",
      detectTimeZone: "Use this device's time zone",
      saved: "Preferences saved",
      saveFailed: "Couldn't save",
      preview: "Example: {money} · {date}",
    },
    es: {
      title: "Preferencias",
      subtitle:
        "Idioma, zona horaria y moneda base usados en todas las pantallas.",
      displayName: "Nombre visible",
      language: "Idioma",
      languageHint: "Textos, fechas y números siguen el idioma elegido.",
      timeZone: "Zona horaria",
      timeZoneHint: 'Define qué es "hoy" y el mes actual en los resúmenes.',
      baseCurrency: "Moneda base",
      baseCurrencyHint:
        "Los totales e indicadores se convierten a esta moneda. El monto original de cada movimiento nunca cambia; sin cotización, la conversión queda vacía.",
      detectTimeZone: "Usar la zona horaria de este dispositivo",
      saved: "Preferencias guardadas",
      saveFailed: "No se pudo guardar",
      preview: "Ejemplo: {money} · {date}",
    },
  },
);
