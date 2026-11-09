"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/client";

/** Símbolo Amora: a amora azul da marca (`/logo.svg`), igual em tema claro e escuro. */
export function AmoraMark({ size = 32 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático da marca, sem otimização
    <img
      src="/logo.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
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
