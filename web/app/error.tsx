"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  // Renderiza dentro do layout raiz (que já tem <html> e <body>); só o global-error.tsx substitui o documento.
  return (
    <div className="global-boundary">
      <span className="app-logo">
        <span className="mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        Amora
      </span>
      <h1>{t("ui.boundary.title")}</h1>
      <p>{t("ui.boundary.description")}</p>
      <button className="button" onClick={reset}>
        {t("common.actions.retry")}
      </button>
      <Link href="/">{t("ui.boundary.backHome")}</Link>
    </div>
  );
}
