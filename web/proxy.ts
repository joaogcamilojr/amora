import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { privatePrefixes } from "@/lib/navigation/navigation";

export function proxy(request: NextRequest) {
  const hasCookie = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const isPrivate = privatePrefixes.some(
    (prefix) =>
      request.nextUrl.pathname === prefix ||
      request.nextUrl.pathname.startsWith(`${prefix}/`),
  );

  if (isPrivate && !hasCookie)
    return NextResponse.redirect(
      new URL(
        `/login?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`,
        request.url,
      ),
    );

  if (request.nextUrl.pathname === "/login" && hasCookie)
    return NextResponse.redirect(new URL("/dashboard", request.url));

  return NextResponse.next();
}

export const config = {
  // Precisa ser literal (análise estática do Next). Mantenha em sincronia com lib/navigation.
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/cards/:path*",
    "/recurring/:path*",
    "/accounts/:path*",
    "/holdings/:path*",
    "/trips/:path*",
    "/import/:path*",
    "/household/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/consent/:path*",
    "/login",
  ],
};
