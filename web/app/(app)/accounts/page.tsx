import Link from "next/link";

import { Badge } from "@/components/ds/badge";
import { ButtonLink } from "@/components/ds/button";
import { HolderSelect } from "@/components/ds/holder-select";
import { PageTitle } from "@/components/ds/headers";
import { IconBank, IconCard, IconCrypto, IconPlus } from "@/components/ds/icons";
import { Widget } from "@/components/ds/widget";
import { AdjustBalance, DeactivateRate, NewRate } from "@/components/finance/account-forms";
import { FxNotice } from "@/components/finance/fx-notice";
import { cx } from "@/lib/cx";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { loadFinance } from "@/lib/finance/load";
import { param, type PageProps } from "@/lib/finance/page";
import { getI18n } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("accounts.list.metadataTitle") };
}

const DEFAULT_CURRENCIES = ["USD", "EUR", "UYU", "ARS", "CLP", "BTC", "ETH", "USDT"];

export default async function AccountsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  const d = await loadFinance(session.user_id, { holder: param((await searchParams).holder) });
  const { t, fmt } = await getI18n();
  const base = d.baseCode;
  const active = d.accounts.filter((a) => a.status === "ACTIVE");
  const archived = d.accounts.filter((a) => a.status !== "ACTIVE");
  const countries = [...new Set(active.map((a) => a.countryCode ?? "—"))];
  const history = await prisma.exchange_rates.findMany({
    where: { stale: false, OR: [{ source: "PROVIDER" }, { owner_id: session.user_id }] },
    orderBy: [{ provider_timestamp: "desc" }, { fetched_at: "desc" }],
    take: 20,
    include: { from_asset: { select: { code: true } }, to_asset: { select: { code: true } } },
  });
  const currencies = [...new Set([...DEFAULT_CURRENCIES, ...d.accounts.flatMap((a) => a.balances.map((b) => b.asset.code))])];

  return (
    <>
      <PageTitle
        eyebrow={t("accounts.list.eyebrow")}
        title={t("accounts.list.title")}
        description={t("accounts.list.description")}
        actions={
          <>
            <HolderSelect holders={d.holders} current={d.holder} />
            <ButtonLink href="/accounts/new">
              <IconPlus size={16} /> {t("accounts.list.newAccount")}
            </ButtonLink>
          </>
        }
      />

      <FxNotice data={d} className="mb-4" />

      <div className="flex flex-col gap-6">
        {countries.map((country) => (
          <section key={country}>
            <h2 className="mb-3 text-lg leading-[26px] font-semibold text-neutral-950">
              <span aria-hidden="true">{country === "—" ? "" : fmt.countryFlag(country)}</span>{" "}
              {country === "—" ? t("accounts.list.noCountry") : fmt.countryName(country)}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {active
                .filter((a) => (a.countryCode ?? "—") === country)
                .map((a) => {
                  const Icon = a.type === "CREDIT_CARD" ? IconCard : a.type === "CRYPTO_WALLET" ? IconCrypto : IconBank;
                  return (
                    <article
                      key={a.id}
                      className="rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-5 transition-colors duration-150 hover:border-neutral-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-control)] bg-brand-50 text-brand-700">
                            <Icon size={18} />
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-neutral-950">
                              <Link href={`/accounts/${a.id}`} className="hover:text-brand-700 hover:underline">
                                {a.name}
                              </Link>
                            </h3>
                            <p className="text-[12px] text-neutral-500">
                              {[a.institutionName, a.holderName, t(`enums.accountType.${a.type}.label`)].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </div>
                        {!a.isOwner && <Badge tone="info">{t("accounts.list.shared")}</Badge>}
                      </div>

                      <ul className="mt-4 flex flex-col gap-2">
                        {a.balances.length === 0 && <li className="text-[13px] text-neutral-500">{t("accounts.list.noBalance")}</li>}
                        {a.balances.map((b) => (
                          <li key={b.id} className="flex items-end justify-between gap-3">
                            <div>
                              <p
                                className={cx(
                                  "tabular font-semibold",
                                  a.balances.length > 1 ? "text-lg leading-6" : "text-2xl leading-8",
                                  b.current < 0 ? "text-danger" : "text-neutral-950",
                                )}
                              >
                                {fmt.money(b.current, b.asset.code)}
                              </p>
                              {b.asset.code !== base && (
                                <p className="tabular text-[12px] text-neutral-500">
                                  {b.base === null ? t("common.noRate") : t("accounts.list.approxBase", { amount: fmt.money(b.base, base) })}
                                </p>
                              )}
                            </div>
                            {a.canPost && (
                              <AdjustBalance
                                accountId={a.id}
                                accountName={a.name}
                                assetId={b.asset.id}
                                assetCode={b.asset.code}
                                current={b.current}
                              />
                            )}
                          </li>
                        ))}
                      </ul>

                      {a.notes && <p className="mt-2 text-[12px] leading-4 text-neutral-500">{a.notes}</p>}
                      {a.card && (
                        <p className="mt-2 text-[12px] text-neutral-600">
                          {t("accounts.list.cardSummary", {
                            limit: fmt.money(a.card.creditLimit ?? 0, a.balances[0]?.asset.code ?? base),
                            closingDay: a.card.closingDay,
                            dueDay: a.card.dueDay,
                          })}
                          {a.card.cashbackRate > 0 && t("accounts.list.cashback", { rate: fmt.percent(a.card.cashbackRate) })}
                        </p>
                      )}
                      {a.monthlyYieldRate != null && (
                        <p className="mt-2 text-[12px] text-neutral-600">
                          {t("accounts.list.monthlyYield", { rate: fmt.percent(a.monthlyYieldRate, 2) })}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-[12px]">
                        {a.lastMovementDate ? (
                          <span className="text-neutral-500">{t("accounts.list.lastTransaction", { date: fmt.civilDate(a.lastMovementDate) })}</span>
                        ) : (
                          <Badge tone="warning">{t("accounts.list.noStatement")}</Badge>
                        )}
                        <Link href={`/transactions?accountId=${a.id}`} className="font-medium text-brand-700 hover:underline">
                          {t("accounts.list.transactionsLink")}
                        </Link>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>
        ))}

        {archived.length > 0 && (
          <Widget title={t("accounts.archived.title")} context={t("accounts.archived.context")} flush>
            <ul className="divide-y divide-neutral-100 text-[13px]">
              {archived.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span>
                    <Link href={`/accounts/${a.id}`} className="font-medium text-neutral-950 hover:underline">
                      {a.name}
                    </Link>{" "}
                    <span className="text-neutral-500">
                      · {a.institutionName ?? "—"}
                      {a.lastMovementDate && t("accounts.archived.lastTransaction", { date: fmt.civilDate(a.lastMovementDate) })}
                    </span>
                  </span>
                  <Badge>{t("accounts.archived.badge")}</Badge>
                </li>
              ))}
            </ul>
          </Widget>
        )}

        <section id="rates" className="scroll-mt-6">
          <Widget
            title={t("accounts.rates.title")}
            context={t("accounts.rates.context", { base })}
          >
            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              {[...d.fx.entries()]
                .filter(([code]) => code !== base)
                .map(([code, value]) => {
                  const source = d.fxSources[code];
                  return (
                    <div key={code} className="rounded-[var(--radius-control)] bg-neutral-50 p-3">
                      <p className="text-[12px] text-neutral-600">{t("accounts.rates.oneUnit", { code })}</p>
                      <p className="tabular text-sm font-semibold text-neutral-950">≈ {fmt.money(value, base, 4)}</p>
                      {source && (
                        <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] leading-4 text-neutral-500">
                          <Badge tone={source.source === "MANUAL" ? "brand" : source.stale ? "warning" : "neutral"}>
                            {source.source === "MANUAL" ? t("accounts.rates.sourceManual") : t("accounts.rates.sourceProvider")}
                          </Badge>
                          {source.derived && <span>{t("accounts.rates.derived")}</span>}
                          <span>{t("accounts.rates.asOf", { date: fmt.civilDate(source.date) })}</span>
                          {source.stale && <span className="text-warning">{t("accounts.rates.stale")}</span>}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
            <p className="mb-4 text-[12px] text-neutral-500">{t("accounts.rates.manualWins")}</p>
            <NewRate currencies={currencies} baseCode={base} />
            {history.length > 0 && (
              <table className="mt-5 w-full text-[13px]">
                <caption className="sr-only">{t("accounts.rates.historyCaption")}</caption>
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-[12px] text-neutral-600">
                    <th className="py-2 font-medium">{t("common.fields.date")}</th>
                    <th className="py-2 font-medium">{t("accounts.rates.pair")}</th>
                    <th className="py-2 text-right font-medium">{t("accounts.rates.rate")}</th>
                    <th className="py-2 pl-3 font-medium">{t("accounts.rates.historySource")}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                      <td className="tabular py-2">{fmt.civilDate(r.provider_timestamp.toISOString().slice(0, 10))}</td>
                      <td className="py-2">
                        {r.from_asset.code}/{r.to_asset.code}
                      </td>
                      <td className="tabular py-2 text-right">{fmt.number(Number(r.rate), 6)}</td>
                      <td className="py-2 pl-3">
                        {r.source === "PROVIDER" ? (
                          <Badge>{t("accounts.rates.sourceProvider")}</Badge>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Badge tone="brand">{t("accounts.rates.sourceManual")}</Badge>
                            {r.owner_id === session.user_id && <DeactivateRate id={r.id} />}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Widget>
        </section>
      </div>
    </>
  );
}
