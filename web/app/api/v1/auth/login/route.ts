import { NextRequest } from "next/server";

import { requestLoginCode } from "@/lib/auth/email-auth";
import { caughtError } from "@/lib/finance/api";
import { jsonData } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    return jsonData(
      await requestLoginCode(
        ((await request.json()) as Record<string, unknown>).email,
      ),
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
