import type { ReactNode } from "react";

/** Cabeçalho de página: eyebrow, título, descrição curta e uma ação primária à direita. */
export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-1 text-[12px] font-medium tracking-wide text-brand-700">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl leading-8 font-semibold text-neutral-950">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-[72ch] text-sm text-neutral-600">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
}

/** Hero escuro das visões gerais (padrão "Central de comando" do Apgees ERP). */
export function DarkHero({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-[var(--radius-modal)] bg-neutral-950 px-6 py-6 text-white md:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(78,115,223,0.45),transparent_60%)]"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-1 text-[12px] font-medium tracking-wide text-brand-200">
            {eyebrow}
          </p>
          <h1 className="text-2xl leading-8 font-semibold">{title}</h1>
          {description && (
            <p className="mt-1 max-w-[72ch] text-sm text-neutral-300">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {children && <div className="relative mt-6">{children}</div>}
    </section>
  );
}
