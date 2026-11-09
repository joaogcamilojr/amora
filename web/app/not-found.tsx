import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="global-boundary">
      <span className="app-logo">
        <span className="mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        Amora
      </span>
      <h1>{t("ui.notFound.title")}</h1>
      <p>{t("ui.notFound.description")}</p>
      <Link className="button" href="/dashboard">
        {t("ui.boundary.goToDashboard")}
      </Link>
    </div>
  );
}
