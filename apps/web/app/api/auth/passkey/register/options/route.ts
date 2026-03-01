import { jsonError, jsonOk } from "@/lib/http";
import { requireCreatorUser } from "@/lib/session";
import { createPasskeyRegistrationOptions } from "@/lib/passkey";

export async function POST() {
  try {
    const user = await requireCreatorUser();
    const userName = user.email ?? user.displayName;
    const options = await createPasskeyRegistrationOptions(user.id, userName);
    return jsonOk(options);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create passkey options", 401);
  }
}
