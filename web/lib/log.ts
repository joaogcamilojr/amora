/**
 * Único ponto de log de erros do app. Registra só a etiqueta, o nome do erro e um código curto: mensagens, stack e
 * campos do erro podem trazer e-mail, valores de query (Prisma), nomes ou descrições de lançamentos.
 */
const SAFE_CODE = /^[A-Za-z0-9_.-]{1,40}$/;

function safeCode(error: unknown): string | number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const { code, statusCode } = error as { code?: unknown; statusCode?: unknown };
  for (const value of [code, statusCode]) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && SAFE_CODE.test(value)) return value;
  }
  return undefined;
}

export function describeError(error: unknown) {
  const name = error instanceof Error && SAFE_CODE.test(error.name) ? error.name : typeof error;
  const code = safeCode(error);
  return code === undefined ? { name } : { name, code };
}

export function logError(tag: string, error: unknown) {
  console.error(`[${tag}]`, describeError(error));
}
