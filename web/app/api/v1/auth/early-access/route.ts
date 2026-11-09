import { NextRequest } from "next/server";

import { requestEarlyAccess } from "@/lib/auth/email-auth";
import { caughtError } from "@/lib/finance/api";
import { jsonData } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    return jsonData(await requestEarlyAccess(await request.json()), 201);
  } catch (error) {
    return caughtError(
      null,
      400,
      "EARLY_ACCESS_ERROR",
      error,
      "errors.invalidRequest",
    );
  }
}
