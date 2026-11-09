import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { rotateRefreshToken, setAuthCookies } from "@/lib/auth/session";
import { localizedError } from "@/lib/finance/api";
import { jsonData } from "@/lib/http";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const token =
    typeof body.refreshToken === "string"
      ? body.refreshToken
      : (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
  if (!token)
    return localizedError(
      null,
      401,
      "REFRESH_TOKEN_REQUIRED",
      "errors.auth.refreshTokenMissing",
    );
  const tokens = await rotateRefreshToken(token);
  if (!tokens)
    return localizedError(
      null,
      401,
      "INVALID_REFRESH_TOKEN",
      "errors.auth.refreshTokenInvalid",
    );
  await setAuthCookies(tokens);
  return jsonData({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.accessExpiresAt,
  });
}
