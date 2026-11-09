import { NextRequest, NextResponse } from "next/server";

import { APP_URL } from "@/lib/auth/email-auth";
import {
  createAuthTokens,
  hashToken,
  setAuthCookies,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token)
    return NextResponse.redirect(`${APP_URL}/login?error=invalid_verification`);
  const verification = await prisma.email_verification_tokens.findUnique({
    where: { token_hash: hashToken(token) },
  });
  if (
    !verification ||
    verification.used_at ||
    verification.expires_at <= new Date()
  )
    return NextResponse.redirect(`${APP_URL}/login?error=expired_verification`);
  const user = await prisma.users.update({
    where: { id: verification.user_id },
    data: { email_verified_at: new Date() },
  });
  await prisma.email_verification_tokens.update({
    where: { id: verification.id },
    data: { used_at: new Date() },
  });
  const tokens = await createAuthTokens(user.id);
  await setAuthCookies(tokens);
  return NextResponse.redirect(`${APP_URL}/dashboard`);
}
