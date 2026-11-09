"use client";

import { useRouter } from "next/navigation";

import {
  LOCALE_COOKIE,
  LOCALE_LABELS,
  LOCALES,
  type Locale,
} from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

/** Seletor de idioma para visitantes (landing e login). Logado, o idioma vem de Preferências. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  function change(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  return (
    <select
      aria-label={t("settings.language")}
      className={className}
      value={locale}
      onChange={(e) => change(e.target.value as Locale)}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l} lang={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
