"use client";

import { useI18n } from "@/lib/i18n/client";

/** "Li e aceito os Termos de Uso e a Política de Privacidade", com links que abrem em outra aba. */
export function AcceptLinks() {
  const { t } = useI18n();
  return (
    <>
      {t("legal.accept.prefix")}{" "}
      <a href="/legal/terms" target="_blank" rel="noopener noreferrer">
        {t("legal.accept.terms")}
      </a>{" "}
      {t("legal.accept.and")}{" "}
      <a href="/legal/privacy" target="_blank" rel="noopener noreferrer">
        {t("legal.accept.privacy")}
      </a>
    </>
  );
}
