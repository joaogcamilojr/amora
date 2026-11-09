"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/client";

/** Símbolo Amora no idioma visual Apgees: caixa arredondada + gráfico em torre. */
export function AmoraMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#4E73DF" />
      <rect x="8" y="17" width="4" height="7" rx="1.5" fill="#AAD7FF" />
      <rect x="14" y="12" width="4" height="12" rx="1.5" fill="#F6FAFF" />
      <rect x="20" y="8" width="4" height="16" rx="1.5" fill="#FFFFFF" />
    </svg>
  );
}

export function AppLogo({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useI18n();
  return (
    <Link
      className="app-logo"
      href="/dashboard"
      aria-label={t("ui.appLogoLabel")}
    >
      <AmoraMark size={27} />
      {!collapsed && <span>Amora</span>}
    </Link>
  );
}
