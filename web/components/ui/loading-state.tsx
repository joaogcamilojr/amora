"use client";

import { useI18n } from "@/lib/i18n/client";

import { PageSkeleton } from "./skeleton";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div
      className="loading-state"
      role="status"
      aria-label={label ?? t("ui.loading.content")}
    >
      <PageSkeleton />
    </div>
  );
}
