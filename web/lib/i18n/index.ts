/** API de i18n compartilhada (servidor e cliente). No servidor use `getI18n()` de `@/lib/i18n/server`; no cliente, `useI18n()` de `@/lib/i18n/client`. */
export * from "./config";
export {
  countryFlag,
  createFormatter,
  isIsoCurrency,
  todayIn,
  type FormatContext,
  type Formatter,
} from "./format";
export { messagesFor, type MessageKey, type Messages } from "./messages";
export {
  createTranslator,
  type MessageVars,
  type Translator,
} from "./translate";

import type { Locale } from "./config";
import { createFormatter, type FormatContext } from "./format";
import { messagesFor, type Messages } from "./messages";
import { createTranslator } from "./translate";

export interface I18nContext extends FormatContext {
  messages: Messages;
}

/** Monta tradutor + formatador a partir do contexto (mesma função no servidor e no cliente). */
export function buildI18n(ctx: FormatContext & { messages?: Messages }) {
  const messages = ctx.messages ?? messagesFor(ctx.locale as Locale);
  return {
    locale: ctx.locale,
    timeZone: ctx.timeZone,
    baseCurrency: ctx.baseCurrency,
    t: createTranslator(ctx.locale, messages),
    fmt: createFormatter(ctx),
  };
}

export type I18n = ReturnType<typeof buildI18n>;
