import { getSession } from "@/lib/auth/session";
import { localizedError } from "@/lib/finance/api";
import { jsonData } from "@/lib/http";

export async function GET() {
  const session = await getSession();
  if (!session)
    return localizedError(
      null,
      401,
      "UNAUTHORIZED",
      "errors.auth.sessionMissing",
    );
  return jsonData({
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.display_name,
      baseAssetId: session.user.base_asset_id,
    },
  });
}
