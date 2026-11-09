import { Suspense } from "react";

import { getI18n } from "@/lib/i18n/server";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const { t } = await getI18n();
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <section className="auth-card">
            <p>{t("auth.loading")}</p>
          </section>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
