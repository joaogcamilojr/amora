"use client";

import { useI18n } from "@/lib/i18n/client";

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}

export function PageSkeleton() {
  const { t } = useI18n();
  return (
    <div className="state-stack" aria-label={t("ui.loading.content")}>
      <Skeleton className="skeleton-kicker" />
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-copy" />
      <div className="skeleton-grid">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
      <Skeleton className="skeleton-panel" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton className="skeleton-avatar" />
      <Skeleton className="skeleton-line" />
      <Skeleton className="skeleton-line short" />
    </div>
  );
}

export function ListSkeleton() {
  const { t } = useI18n();
  return (
    <div className="skeleton-list" aria-label={t("ui.loading.list")}>
      {[1, 2, 3].map((item) => (
        <CardSkeleton key={item} />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  const { t } = useI18n();
  return (
    <div className="skeleton-form" aria-label={t("ui.loading.form")}>
      <Skeleton className="skeleton-title" />
      {[1, 2, 3, 4].map((item) => (
        <Skeleton className="skeleton-field" key={item} />
      ))}
    </div>
  );
}
