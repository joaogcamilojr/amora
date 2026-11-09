"use client";

import Link from "next/link";

import { ErrorState } from "@/components/ui/error-state";
import { useI18n } from "@/lib/i18n/client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="boundary-page">
      <ErrorState
        title={t("ui.boundary.appTitle")}
        description={t("ui.boundary.appDescription")}
        retry={reset}
        action={
          <Link className="button button-small secondary" href="/dashboard">
            {t("ui.boundary.goToDashboard")}
          </Link>
        }
      />
    </div>
  );
}
