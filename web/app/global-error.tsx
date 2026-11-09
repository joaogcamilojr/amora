"use client";

import {
  createTranslator,
  DEFAULT_LOCALE,
  messagesFor,
  resolveLocale,
} from "@/lib/i18n";

/** Renderiza fora do <I18nProvider> (substitui o layout raiz): o idioma vem do navegador. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale =
    (typeof navigator !== "undefined"
      ? resolveLocale(navigator.language)
      : null) ?? DEFAULT_LOCALE;
  const t = createTranslator(locale, messagesFor(locale));
  return (
    <html lang={locale}>
      <body>
        <main className="global-boundary">
          <span className="app-logo">
            <span className="mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            Amora
          </span>
          <h1>Amora</h1>
          <p>{t("ui.boundary.globalDescription")}</p>
          <button className="button" onClick={reset}>
            {t("common.actions.retry")}
          </button>
        </main>
      </body>
    </html>
  );
}
