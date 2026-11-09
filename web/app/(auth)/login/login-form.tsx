"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useI18n } from "@/lib/i18n/client";

const LOGIN_CODE_MINUTES = 10;

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        sent ? "/api/v1/auth/login/verify" : "/api/v1/auth/login",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(sent ? { email, code } : { email }),
        },
      );
      const body = await response.json();
      if (!response.ok || body.error) {
        setError(body.error?.message ?? t("auth.errors.signInFailed"));
        return;
      }
      if (!sent) {
        setSent(true);
        return;
      }
      router.push(params.get("next") || "/dashboard");
    } catch {
      setError(t("auth.errors.connection"));
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="auth-shell">
      <Link className="brand" href="/">
        <span className="mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>Amora</span>
      </Link>
      <section className="auth-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span className="section-kicker">{t("auth.kicker")}</span>
          <LocaleSwitcher />
        </div>
        <h1>{t("auth.title")}</h1>
        <p>{sent ? t("auth.codeSent") : t("auth.intro")}</p>
        <form onSubmit={submit}>
          <label htmlFor="email">{t("auth.email")}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={sent}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("auth.emailPlaceholder")}
          />
          {sent && (
            <>
              <label htmlFor="code">{t("auth.code")}</label>
              <input
                id="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="000000"
              />
            </>
          )}
          <button className="button" disabled={loading}>
            {loading
              ? t("auth.wait")
              : sent
                ? t("auth.signIn")
                : t("auth.sendCode")}
          </button>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </form>
        <small>{t("auth.footnote", { minutes: LOGIN_CODE_MINUTES })}</small>
      </section>
    </main>
  );
}
