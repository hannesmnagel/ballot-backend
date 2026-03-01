import { jsonError, jsonOk } from "@/lib/http";
import { getCreatorUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCreatorUser();
    if (!user) {
      return jsonError("Not authenticated", 401);
    }

    return jsonOk({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerifiedAt: user.emailVerifiedAt
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to get user", 500);
  }
}
