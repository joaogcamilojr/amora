import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";

export const ACCESS_TOKEN_MINUTES = 15;
export const REFRESH_TOKEN_DAYS = 30;
export const PROTOTYPE_EMAIL_VERIFICATION_BYPASS =
  process.env.NODE_ENV !== "production" &&
  process.env.PROTOTYPE_EMAIL_VERIFICATION_BYPASS === "true";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}

export async function createAuthTokens(userId: string) {
  const now = new Date();
  const accessToken = randomBytes(32).toString("base64url");
  const refreshToken = randomBytes(48).toString("base64url");
  const accessExpiresAt = new Date(
    now.getTime() + ACCESS_TOKEN_MINUTES * 60000,
  );
  const refreshExpiresAt = new Date(
    now.getTime() + REFRESH_TOKEN_DAYS * 86400000,
  );
  const userAgent = (await headers()).get("user-agent")?.slice(0, 240) || null;
  await prisma.auth_sessions.create({
    data: {
      user_id: userId,
      token_hash: hashToken(accessToken),
      expires_at: accessExpiresAt,
      user_agent: userAgent,
    },
  });
  await prisma.auth_refresh_tokens.create({
    data: {
      user_id: userId,
      token_hash: hashToken(refreshToken),
      expires_at: refreshExpiresAt,
      user_agent: userAgent,
    },
  });
  return { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt };
}

export async function setAuthCookies(
  tokens: Awaited<ReturnType<typeof createAuthTokens>>,
) {
  const store = await cookies();
  store.set(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    cookieOptions(tokens.accessExpiresAt),
  );
  store.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    cookieOptions(tokens.refreshExpiresAt),
  );
}

export async function rotateRefreshToken(token: string) {
  const current = await prisma.auth_refresh_tokens.findUnique({
    where: { token_hash: hashToken(token) },
  });
  if (!current || current.revoked_at || current.expires_at <= new Date())
    return null;
  const tokens = await createAuthTokens(current.user_id);
  await prisma.auth_refresh_tokens.update({
    where: { id: current.id },
    data: {
      revoked_at: new Date(),
      replaced_by: hashToken(tokens.refreshToken),
    },
  });
  return tokens;
}

export async function revokeCurrentSession() {
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (accessToken)
    await prisma.auth_sessions.updateMany({
      where: { token_hash: hashToken(accessToken), revoked_at: null },
      data: { revoked_at: new Date() },
    });
  if (refreshToken)
    await prisma.auth_refresh_tokens.updateMany({
      where: { token_hash: hashToken(refreshToken), revoked_at: null },
      data: { revoked_at: new Date() },
    });
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

/** Sessão atual. Memorizada por requisição em Server Components (layout, páginas e getI18n chamam juntos). */
export const getSession = cache(async function getSession() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.auth_sessions.findUnique({
    where: { token_hash: hashToken(token) },
    include: { user: true },
  });
  if (
    !session ||
    session.revoked_at ||
    session.expires_at <= new Date() ||
    session.user.archived_at ||
    !session.user.email_verified_at
  )
    return null;
  if (session.last_seen_at.getTime() < Date.now() - 300000)
    await prisma.auth_sessions.update({
      where: { id: session.id },
      data: { last_seen_at: new Date() },
    });
  return session;
});

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
