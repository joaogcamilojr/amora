import type { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";
import { toErrorResponse, unauthorizedResponse } from "@/lib/finance/api";
import { CSV_DATASETS, EXPORT_FORMATS, exportUserData, type CsvDataset, type ExportFormat } from "@/lib/finance/privacy-export";
import { i18nForUser } from "@/lib/i18n/server";
import { ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Exportação dos dados do usuário logado (LGPD/GDPR). `?format=json` (padrão) traz tudo;
 * `?format=csv&dataset=transactions|accounts` traz uma planilha. Resposta é um arquivo, não o envelope `{ data }`.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();
  const params = request.nextUrl.searchParams;
  const format = (params.get("format") ?? "json") as ExportFormat;
  const dataset = (params.get("dataset") ?? "transactions") as CsvDataset;
  const { t } = await i18nForUser(session.user_id);
  if (!EXPORT_FORMATS.includes(format) || !CSV_DATASETS.includes(dataset))
    return toErrorResponse(new ValidationError("VALIDATION_ERROR", "errors.invalidField", { field: "format" }), t);
  try {
    const file = await exportUserData(session.user_id, format, dataset);
    return new Response(file.body, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error, t);
  }
}
