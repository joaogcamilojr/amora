import Link from "next/link";

import { Badge } from "@/components/ds/badge";
import { PageTitle } from "@/components/ds/headers";
import { EmptyBlock, Widget } from "@/components/ds/widget";
import { NewTrip } from "@/components/finance/new-trip";
import { financeForPage } from "@/lib/finance/page";
import { isExpense } from "@/lib/finance/types";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("trips.page.metadataTitle") };
}

interface TagTotals {
  spent: number;
  fees: number;
  count: number;
  currencies: Set<string>;
  first: string;
  last: string;
}

export default async function TripsPage() {
  const d = await financeForPage();
  const { t: tr, fmt } = await getI18n();
  const base = d.baseCode;
  const totals = new Map<string, TagTotals>();
  for (const m of d.movements) {
    for (const tag of m.tags) {
      const t = totals.get(tag) ?? {
        spent: 0,
        fees: 0,
        count: 0,
        currencies: new Set<string>(),
        first: m.date,
        last: m.date,
      };
      if (isExpense(m.type) && m.baseAmount != null) t.spent += -m.baseAmount;
      if (m.type === "REFUND" && m.baseAmount != null) t.spent -= m.baseAmount;
      t.fees += m.fxFeeBase;
      t.count += 1;
      t.currencies.add(m.assetCode);
      if (m.date < t.first) t.first = m.date;
      if (m.date > t.last) t.last = m.date;
      totals.set(tag, t);
    }
  }
  const trips = new Map(d.trips.map((t) => [t.tag, t]));
  const tags = [...new Set([...totals.keys(), ...trips.keys()])].sort((a, b) =>
    (totals.get(b)?.last ?? trips.get(b)?.startsOn ?? "").localeCompare(
      totals.get(a)?.last ?? trips.get(a)?.startsOn ?? "",
    ),
  );

  return (
    <>
      <PageTitle
        eyebrow={tr("trips.page.eyebrow")}
        title={tr("trips.page.title")}
        description={tr("trips.page.description", { base })}
        actions={<NewTrip />}
      />
      {tags.length === 0 ? (
        <Widget>
          <EmptyBlock title={tr("trips.page.emptyTitle")}>
            {tr("trips.page.emptyBefore")}{" "}
            <strong>{tr("trips.page.emptyExampleTag")}</strong>.{" "}
            {tr("trips.page.emptyAfter")}
          </EmptyBlock>
        </Widget>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tags.map((tag) => {
            const t = totals.get(tag);
            const trip = trips.get(tag);
            const start = trip?.startsOn ?? t?.first;
            const end = trip?.endsOn ?? t?.last;
            return (
              <Link
                key={tag}
                href={`/transactions?tag=${encodeURIComponent(tag)}`}
                className="rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-5 transition-colors duration-150 hover:border-neutral-300"
              >
                <p className="text-sm font-semibold text-neutral-950">
                  {trip?.name ?? `#${tag}`}{" "}
                  {trip?.countryCodes
                    .map((c) => fmt.countryFlag(c) || c)
                    .join(" ")}
                </p>
                <p className="text-[12px] text-neutral-500">
                  {trip && `#${tag} · `}
                  {start ? fmt.civilDate(start) : "—"} –{" "}
                  {end ? fmt.civilDate(end) : "—"} ·{" "}
                  {tr("trips.card.transactions", { count: t?.count ?? 0 })}
                </p>
                <p className="tabular mt-3 text-2xl leading-8 font-semibold text-neutral-950">
                  {fmt.money(t?.spent ?? 0, base)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...(t?.currencies ?? [])].map((c) => (
                    <Badge key={c} tone="brand">
                      {c}
                    </Badge>
                  ))}
                  {(t?.fees ?? 0) > 0 && (
                    <Badge tone="warning">
                      {tr("trips.card.fxFees", {
                        amount: fmt.money(t!.fees, base),
                      })}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
