"use client";

import { ReactNode } from "react";

import { useI18n } from "@/lib/i18n/client";

import { Icon } from "./icon";

export function ErrorState({
  title,
  description,
  retry,
  action,
  compact = false,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
  action?: ReactNode;
  compact?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className={`error-state ${compact ? "compact" : ""}`} role="alert">
      <span className="state-icon danger">
        <Icon name="error" />
      </span>
      <h2>{title ?? t("ui.errorState.title")}</h2>
      <p>{description ?? t("ui.errorState.description")}</p>
      <div className="state-actions">
        {retry && (
          <button className="button button-small" onClick={retry}>
            <Icon name="refresh" size={16} /> {t("common.actions.retry")}
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
