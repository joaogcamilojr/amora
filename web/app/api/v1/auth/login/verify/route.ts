import { NextRequest } from "next/server";

import {
  createAuthTokens,
  hashToken,
  setAuthCookies,
} from "@/lib/auth/session";
import { caughtError, localizedError } from "@/lib/finance/api";
import { jsonData } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { emailValue, stringValue, ValidationError } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = emailValue(body.email);
    const code = stringValue(body.code, "code", 6);
    if (!/^\d{6}$/.test(code))
      throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", {
        field: "code",
      });
    const user = await prisma.users.findUnique({ where: { email } });
    const loginCode = user
      ? await prisma.login_codes.findFirst({
          where: { user_id: user.id, used_at: null },
          orderBy: { created_at: "desc" },
        })
      : null;
    if (
      !user ||
      !user.email_verified_at ||
      !loginCode ||
      loginCode.expires_at <= new Date() ||
      loginCode.code_hash !== hashToken(code)
    )
      return localizedError(
        null,
        401,
        "INVALID_CODE",
        "errors.auth.invalidCode",
      );
    await prisma.login_codes.update({
      where: { id: loginCode.id },
      data: { used_at: new Date() },
    });
    const tokens = await createAuthTokens(user.id);
    await setAuthCookies(tokens);
    return jsonData(
      {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.accessExpiresAt,
      },
      200,
    );
  } catch (error) {
    return caughtError(
      null,
      400,
      "LOGIN_ERROR",
      error,
      "errors.invalidRequest",
    );
  }
}
