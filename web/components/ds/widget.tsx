import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

/** Shell comum dos widgets: título, contexto, ação e conteúdo. Sem sombra — borda 1px. */
export function Widget({
  title,
  context,
  action,
  children,
  className,
  flush,
}: {
  title?: string;
  context?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Sem padding interno (tabelas). */
  flush?: boolean;
}) {
  return (
    <section
      className={cx(
        "rounded-[var(--radius-card)] border border-neutral-200 bg-surface",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-neutral-950">
                {title}
              </h2>
            )}
            {context && (
              <p className="mt-0.5 text-[13px] leading-[18px] text-neutral-600">
                {context}
              </p>
            )}
          </div>
          {action}
        </header>
      )}
      <div
        className={cx(
          !flush && "p-5",
          flush && Boolean(title || action) && "pt-4",
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function EmptyBlock({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      {children && (
        <p className="max-w-md text-[13px] leading-[18px] text-neutral-600">
          {children}
        </p>
      )}
    </div>
  );
}
