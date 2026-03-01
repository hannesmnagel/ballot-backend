import { jsonError, jsonOk } from "@/lib/http";
import { createPasskeyOnlyUser } from "@/lib/auth-service";
import { createPasskeyRegistrationOptions } from "@/lib/passkey";

export async function POST() {
  try {
    // Create user with auto-generated display name
    const user = await createPasskeyOnlyUser();

    // Generate passkey registration options
    const options = await createPasskeyRegistrationOptions(user.id, user.displayName);

    // Return options AND userId so client can verify
    return jsonOk({ options, userId: user.id });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Signup failed", 500);
  }
}
