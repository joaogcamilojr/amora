"use client";

import { ReactNode, useEffect, useRef } from "react";

import { useI18n } from "@/lib/i18n/client";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onCancel()
      }
    >
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        {children}
        <div className="dialog-actions">
          <button
            ref={cancelRef}
            className="button button-small secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {t("common.actions.cancel")}
          </button>
          <button
            className={`button button-small ${destructive ? "danger-button" : ""}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy
              ? t("ui.wait")
              : (confirmLabel ?? t("common.actions.confirm"))}
          </button>
        </div>
      </section>
    </div>
  );
}
