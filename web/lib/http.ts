import { NextResponse } from "next/server";

import { camelize } from "@/lib/case";

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

/** Resposta de sucesso. Chaves snake_case vindas do Prisma saem em camelCase (contrato da API). */
export function jsonData(data: unknown, status = 200) {
  return NextResponse.json({ data: camelize(data) }, { status });
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}
