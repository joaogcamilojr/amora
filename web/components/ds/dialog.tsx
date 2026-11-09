"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useI18n } from "@/lib/i18n/client";

import { Button } from "./button";
import { IconClose } from "./icons";

/** Modal nativo (<dialog>): fecha com Esc e clique fora. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-[var(--radius-modal)] bg-surface p-0 text-neutral-800 shadow-[var(--shadow-modal)] backdrop:bg-neutral-950/40"
    >
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
        <div>
          <h2 className="text-lg leading-[26px] font-semibold text-neutral-950">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[13px] leading-[18px] text-neutral-600">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.actions.close")}
          className="grid h-8 w-8 place-items-center rounded-[var(--radius-control)] text-neutral-500 hover:bg-neutral-100"
        >
          <IconClose size={16} />
        </button>
      </div>
      {children && <div className="px-6 py-5">{children}</div>}
      {footer && (
        <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common.actions.cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel ?? t("common.actions.delete")}
          </Button>
        </>
      }
    />
  );
}
