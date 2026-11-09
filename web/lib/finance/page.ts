import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

import { loadFinance } from "./load";

export type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;
export interface PageProps {
  searchParams: SearchParams;
}

export function param(
  value: string | string[] | undefined,
): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

/** Carrega os dados financeiros do usuário logado para páginas server-side. */
export async function financeForPage(holder?: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  return loadFinance(session.user_id, { holder });
}
