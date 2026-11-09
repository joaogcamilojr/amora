import type { Metadata } from "next";

import { Badge } from "@/components/ds/badge";
import { PageTitle } from "@/components/ds/headers";
import { Widget } from "@/components/ds/widget";
import { Importer } from "@/components/finance/importer";
import { financeForPage } from "@/lib/finance/page";
import { pockets } from "@/lib/finance/pockets";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.items.import") };
}

export default async function ImportPage() {
  const d = await financeForPage();
  const { t } = await getI18n();
  return (
    <>
      <PageTitle
        eyebrow={t("nav.groups.data")}
        title={t("nav.items.import")}
        description={t("imports.page.description")}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-9">
          <Importer pockets={pockets(d.accounts)} categories={d.categories} />
        </div>
        <Widget
          className="xl:col-span-3"
          title={t("imports.formats.title")}
          context={t("imports.formats.context")}
        >
          <ul className="flex flex-col gap-3 text-[13px] leading-[18px]">
            <li className="flex items-center justify-between gap-2">
              {t("imports.formats.ofx")}{" "}
              <Badge tone="success">{t("imports.formats.automatic")}</Badge>
            </li>
            <li className="flex items-center justify-between gap-2">
              {t("imports.formats.csv")}{" "}
              <Badge tone="success">{t("imports.formats.automatic")}</Badge>
            </li>
            <li className="flex items-center justify-between gap-2">
              {t("imports.formats.xlsx")}{" "}
              <Badge tone="success">{t("imports.formats.automatic")}</Badge>
            </li>
            <li className="flex items-center justify-between gap-2">
              {t("imports.formats.pdf")}{" "}
              <Badge tone="ai">{t("imports.formats.viaClaude")}</Badge>
            </li>
          </ul>
          <p className="mt-4 text-[12px] leading-4 text-neutral-500">
            {t("imports.formats.note")}
          </p>
        </Widget>
      </div>
    </>
  );
}
