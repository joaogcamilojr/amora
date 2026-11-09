"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { AcceptLinks } from "@/components/legal/accept-links";
import type { Locale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";

const currencies = [
  { code: "USD", amount: 4250, rate: 5.42, flag: "US" },
  { code: "EUR", amount: 1860, rate: 6.31, flag: "EU" },
  { code: "BRL", amount: 8240, rate: 1, flag: "BR" },
];

const rates: Record<string, number> = {
  USD: 5.42,
  EUR: 6.31,
  BRL: 1,
  UYU: 0.134,
  CLP: 0.0057,
  BTC: 628412,
};

/** Moeda-base inicial da demonstração (valores ilustrativos), conforme o idioma do visitante. */
const DEMO_BASE: Record<Locale, string> = {
  "pt-BR": "BRL",
  en: "USD",
  es: "USD",
};

const features = [
  ["01", "language"],
  ["02", "trips"],
  ["03", "bitcoin"],
  ["04", "countries"],
] as const;

const faqItems = ["bankAccount", "noBank", "bitcoin", "currencies"] as const;
const securityItems = [
  ["01", "control"],
  ["02", "privacy"],
  ["03", "custody"],
] as const;

function Mark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span
      className={"mark " + (inverse ? "mark-inverse" : "")}
      aria-hidden="true"
    >
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
export default function Home() {
  const { t, fmt, locale } = useI18n();
  const money = (value: number, code: string) =>
    fmt.money(value, code, code === "BTC" ? 6 : undefined);
  const [base, setBase] = useState(DEMO_BASE[locale]);
  const [from, setFrom] = useState(DEMO_BASE[locale] === "USD" ? "EUR" : "USD");
  const [amount, setAmount] = useState(1000);
  const [openFaq, setOpenFaq] = useState(0);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const converted = useMemo(
    () => (amount * rates[from]) / rates[base],
    [amount, from, base],
  );
  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top">
          <Mark />
          <span>Amora</span>
        </a>
        <div className="navlinks">
          <a href="#produto">{t("landing.nav.product")}</a>
          <a href="#viajantes">{t("landing.nav.travelers")}</a>
          <a href="#cotacoes">{t("landing.nav.rates")}</a>
          <a href="#seguranca">{t("landing.nav.security")}</a>
        </div>
        <div className="nav-actions">
          <LocaleSwitcher className="text-button" />
          <a className="text-button" href="/login">
            {t("landing.nav.signIn")}
          </a>
          <a className="button button-small" href="#acesso">
            {t("landing.nav.earlyAccess")}
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> {t("landing.hero.eyebrow")}
            </div>
            <h1>
              {t("landing.hero.titleLine1")}
              <br />
              {t("landing.hero.titleLine2")}{" "}
              <em>{t("landing.hero.titleEmphasis")}</em>
              <br />
              {t("landing.hero.titleLine3")}
            </h1>
            <p>{t("landing.hero.lead")}</p>
            <div className="hero-actions">
              <a className="button" href="#acesso">
                {t("landing.hero.joinWaitlist")} <span>→</span>
              </a>
              <a className="watch" href="#produto">
                <i>▶</i> {t("landing.hero.howItWorks")}
              </a>
            </div>
            <small>{t("landing.hero.note")}</small>
          </div>
          <div className="product-scene" aria-label={t("landing.scene.label")}>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="float-card fx-card">
              <span>{t("landing.scene.fxNow")}</span>
              <strong>
                {t("landing.scene.fxPair", { value: money(5.42, "BRL") })}
              </strong>
              <small>
                {t("landing.scene.today", {
                  value: `+${fmt.percent(0.0038, 2)}`,
                })}
              </small>
            </div>
            <div className="app-card">
              <div className="app-top">
                <div className="app-brand">
                  <Mark />
                  <span>Amora</span>
                </div>
                <div className="avatar">AM</div>
              </div>
              <div className="balance">
                <span>{t("landing.scene.netWorth")}</span>
                <strong>{money(38742.8, base)}</strong>
                <small>
                  {t("landing.scene.thisMonth", { value: fmt.percent(0.028) })}
                </small>
              </div>
              <div className="chart">
                <div className="chart-grid" />
                <svg viewBox="0 0 450 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#4e73df" stopOpacity=".32" />
                      <stop offset="1" stopColor="#4e73df" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 96 C35 84 45 88 72 72 S118 83 145 61 S190 69 212 43 S250 60 275 45 S315 50 337 27 S382 44 450 12 L450 120 L0 120Z"
                    fill="url(#area)"
                  />
                  <path
                    d="M0 96 C35 84 45 88 72 72 S118 83 145 61 S190 69 212 43 S250 60 275 45 S315 50 337 27 S382 44 450 12"
                    fill="none"
                    stroke="#4e73df"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="wallet-head">
                <b>{t("landing.scene.myCurrencies")}</b>
                <span>{t("landing.scene.seeAll")}</span>
              </div>
              <div className="wallets">
                {currencies.map((c) => (
                  <div className="wallet" key={c.code}>
                    <span className="flag">{c.flag}</span>
                    <div>
                      <b>{c.code}</b>
                      <small>{money(c.amount, c.code)}</small>
                    </div>
                    <strong>
                      {money((c.amount * c.rate) / rates[base], base)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="float-card trip-card">
              <span className="trip-icon">✦</span>
              <div>
                <small>
                  {t("landing.scene.trip", {
                    place: t("landing.scene.tripPlace"),
                  })}
                </small>
                <strong>
                  {t("landing.scene.budgetUsed", {
                    value: fmt.percent(0.72, 0),
                  })}
                </strong>
                <span>
                  <i style={{ width: "72%" }} />
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="ticker">
          <span>
            USD / BRL <b>{fmt.number(5.42)}</b>{" "}
            <i>▲ {fmt.percent(0.0038, 2)}</i>
          </span>
          <span>
            EUR / BRL <b>{fmt.number(6.31)}</b>{" "}
            <i>▲ {fmt.percent(0.0022, 2)}</i>
          </span>
          <span>
            BTC / USD <b>{fmt.number(115950)}</b>{" "}
            <i>▲ {fmt.percent(0.0284, 2)}</i>
          </span>
          <span>
            UYU / BRL <b>{fmt.number(0.134, 3)}</b>{" "}
            <em>▼ {fmt.percent(0.0011, 2)}</em>
          </span>
          <span>
            CLP / BRL <b>{fmt.number(0.0057, 4)}</b>{" "}
            <i>▲ {fmt.percent(0.0007, 2)}</i>
          </span>
        </div>
      </section>

      <section className="problem shell" id="produto">
        <div className="section-kicker">{t("landing.problem.kicker")}</div>
        <h2>
          {t("landing.problem.titleLine1")}
          <br />
          {t("landing.problem.titleLine2")}
        </h2>
        <p className="section-lead">{t("landing.problem.lead")}</p>
        <div className="problem-grid">
          <div className="mess">
            <div className="receipt r1">
              {t("landing.problem.receiptCard")} <b>{money(284.9, "USD")}</b>
              <small>{t("landing.problem.receiptCardNote")}</small>
            </div>
            <div className="receipt r2">
              {t("landing.problem.receiptSheet")} <b>#REF!</b>
              <small>{t("landing.problem.receiptSheetNote")}</small>
            </div>
            <div className="receipt r3">
              {t("landing.problem.receiptExchange")}{" "}
              <b>{fmt.number(0.036, 3)} BTC</b>
              <small>{t("landing.problem.receiptExchangeNote")}</small>
            </div>
          </div>
          <div className="solution">
            <div className="solution-logo">
              <Mark inverse />
              <span>Amora</span>
            </div>
            <h3>{t("landing.problem.solutionTitle")}</h3>
            <p>{t("landing.problem.solutionText")}</p>
            <div className="chips">
              <span>USD</span>
              <span>EUR</span>
              <span>BRL</span>
              <span>UYU</span>
              <span>CLP</span>
              <span>₿ BTC</span>
              <span>+ {fmt.number(160)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="viajantes">
        <div className="shell">
          <div className="section-kicker light">
            {t("landing.features.kicker")}
          </div>
          <h2>
            {t("landing.features.titleLine1")}
            <br />
            {t("landing.features.titleLine2")}
          </h2>
          <div className="feature-list">
            {features.map(([number, key], i) => (
              <article key={number}>
                <span>{number}</span>
                <div>
                  <h3>{t(`landing.features.items.${key}.title`)}</h3>
                  <p>{t(`landing.features.items.${key}.text`)}</p>
                </div>
                <div className="feature-visual">
                  <div className="visual-core">
                    {i === 0
                      ? money(1544.16, "BRL")
                      : i === 1
                        ? t("landing.features.perDay", {
                            value: fmt.money(86, "EUR", 0),
                          })
                        : i === 2
                          ? `₿ ${fmt.number(0.036, 3)}`
                          : t("landing.features.currencies", { count: 6 })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="converter shell" id="cotacoes">
        <div>
          <div className="section-kicker">{t("landing.converter.kicker")}</div>
          <h2>
            {t("landing.converter.titleLine1")}
            <br />
            {t("landing.converter.titleLine2")}
          </h2>
          <p>{t("landing.converter.lead")}</p>
          <div className="source-note">
            <span>●</span> {t("landing.converter.demo")}
            <br />
            <small>{t("landing.converter.realtime")}</small>
          </div>
        </div>
        <div className="converter-card">
          <label>{t("landing.converter.youHave")}</label>
          <div className="money-input">
            <input
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              inputMode="decimal"
            />
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              {Object.keys(rates).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <button
            className="swap"
            onClick={() => {
              const old = from;
              setFrom(base);
              setBase(old);
            }}
            aria-label={t("landing.converter.swap")}
          >
            ⇅
          </button>
          <label>{t("landing.converter.youGet")}</label>
          <div className="result">
            <strong>{money(converted, base)}</strong>
            <select value={base} onChange={(e) => setBase(e.target.value)}>
              {Object.keys(rates).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <p>
            1 {from} ≈ {fmt.number(rates[from] / rates[base], 6)} {base}
          </p>
        </div>
      </section>

      <section className="security" id="seguranca">
        <div className="shell security-grid">
          <div>
            <div className="section-kicker light">
              {t("landing.security.kicker")}
            </div>
            <h2>
              {t("landing.security.titleLine1")}
              <br />
              {t("landing.security.titleLine2")}
            </h2>
          </div>
          <div className="security-items">
            {securityItems.map(([number, key]) => (
              <div key={number}>
                <span>{number}</span>
                <h3>{t(`landing.security.items.${key}.title`)}</h3>
                <p>{t(`landing.security.items.${key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="faq shell">
        <div>
          <div className="section-kicker">{t("landing.faq.kicker")}</div>
          <h2>
            {t("landing.faq.titleLine1")}
            <br />
            {t("landing.faq.titleLine2")}
          </h2>
        </div>
        <div>
          {faqItems.map((key, i) => (
            <button
              className={"faq-item " + (openFaq === i ? "open" : "")}
              key={key}
              onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
            >
              <span>
                <b>{t(`landing.faq.items.${key}.question`)}</b>
                <i>+</i>
              </span>
              <p>{t(`landing.faq.items.${key}.answer`)}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="cta" id="acesso">
        <div className="shell">
          <Mark />
          <h2>
            {t("landing.cta.titleLine1")}
            <br />
            {t("landing.cta.titleLine2")}
          </h2>
          <p>{t("landing.cta.lead")}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const response = await fetch("/api/v1/auth/early-access", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  ...Object.fromEntries(new FormData(form)),
                  acceptLegal: acceptedLegal,
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }),
              });
              if (response.ok) {
                const note = document.createElement("small");
                note.textContent = t("landing.cta.success");
                form.replaceChildren(note);
              }
            }}
          >
            <input
              name="name"
              type="text"
              placeholder={t("landing.cta.name")}
              aria-label={t("landing.cta.name")}
              required
            />
            <input
              name="email"
              type="email"
              placeholder={t("landing.cta.emailPlaceholder")}
              aria-label={t("landing.cta.emailLabel")}
              required
            />
            <button className="button" disabled={!acceptedLegal}>
              {t("landing.cta.submit")} <span>→</span>
            </button>
          </form>
          <label className="consent">
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(e) => setAcceptedLegal(e.target.checked)}
            />
            <span>
              <AcceptLinks />
            </span>
          </label>
          <small>{t("landing.cta.note")}</small>
        </div>
      </section>
      <footer className="shell">
        <a className="brand" href="#top">
          <Mark />
          <span>Amora</span>
        </a>
        <p>
          {t("landing.footer.tagline")}
          <br />
          {t("landing.footer.origin")}
        </p>
        <div>
          <Link href="/legal/privacy">{t("landing.footer.privacy")}</Link>
          <Link href="/legal/terms">{t("landing.footer.terms")}</Link>
          <a href="https://www.apgees.com.br">Apgees</a>
        </div>
      </footer>
    </main>
  );
}
