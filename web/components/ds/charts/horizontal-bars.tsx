"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/client";

export interface BarItem {
  id: string;
  label: string;
  value: number;
  href?: string;
}

/** Composição em barras horizontais — preferível a donut com muitas categorias. */
export function HorizontalBars({
  items,
  limit = 8,
}: {
  items: BarItem[];
  limit?: number;
}) {
  const { t, fmt } = useI18n();
  const total = items.reduce((s, i) => s + i.value, 0);
  const visible = items.slice(0, limit);
  const rest = items.slice(limit).reduce((s, i) => s + i.value, 0);
  const list =
    rest > 0
      ? [...visible, { id: "_rest", label: t("ds.charts.rest"), value: rest }]
      : visible;
  const max = Math.max(1, ...list.map((i) => i.value));

  return (
    <ul className="flex flex-col gap-3">
      {list.map((item) => {
        const content = (
          <>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px] leading-[18px]">
              <span className="truncate text-neutral-800">{item.label}</span>
              <span className="tabular shrink-0 text-neutral-950">
                {fmt.money(item.value)}{" "}
                <span className="text-neutral-500">
                  · {fmt.percent(total ? item.value / total : 0, 0)}
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-neutral-100">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  opacity: item.id === "_rest" ? 0.45 : 1,
                }}
              />
            </div>
          </>
        );
        return (
          <li key={item.id}>
            {"href" in item && item.href ? (
              <Link
                href={item.href}
                className="block rounded-[6px] hover:bg-neutral-50"
              >
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
