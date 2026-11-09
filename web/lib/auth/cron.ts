import { timingSafeEqual } from "node:crypto";

/** Jobs agendados: `Authorization: Bearer $CRON_SECRET` (formato do Vercel Cron). Sem segredo configurado, nega tudo. */
export function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
