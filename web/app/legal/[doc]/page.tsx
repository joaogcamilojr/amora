import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { isLegalDoc } from "@/lib/legal/versions";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Endereço publicado de cada documento (`TERMS_URL`, `PRIVACY_URL`); só http(s). */
function publishedUrl(doc: "terms" | "privacy") {
  const value = (doc === "terms" ? process.env.TERMS_URL : process.env.PRIVACY_URL)?.trim();
  return value && /^https?:\/\//i.test(value) ? value : null;
}

/** `/legal/terms` e `/legal/privacy`: leva ao texto publicado; sem URL configurada, avisa que está em preparação. */
export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!isLegalDoc(doc)) notFound();
  const url = publishedUrl(doc);
  if (url) redirect(url);
  const { t } = await getI18n();
  return (
    <main className="mx-auto max-w-[640px] px-4 py-16">
      <h1 className="text-2xl font-semibold text-neutral-950">{t(`legal.doc.${doc}`)}</h1>
      <p className="mt-3 text-neutral-600">{t("legal.doc.pending")}</p>
      <p className="mt-6">
        <Link href="/" className="font-medium text-brand-700 hover:underline">
          {t("legal.doc.back")}
        </Link>
      </p>
    </main>
  );
}
