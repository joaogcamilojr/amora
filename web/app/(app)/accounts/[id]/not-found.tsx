import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";

export default async function AccountNotFound() {
  const { t } = await getI18n();
  return (
    <div className="boundary-page">
      <div className="empty-state">
        <span className="state-icon">404</span>
        <h2>{t("accounts.notFound.title")}</h2>
        <p>{t("accounts.notFound.description")}</p>
        <Link className="button button-small" href="/accounts">
          {t("accounts.notFound.back")}
        </Link>
      </div>
    </div>
  );
}
