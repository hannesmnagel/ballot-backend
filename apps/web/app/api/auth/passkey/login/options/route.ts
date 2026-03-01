import { jsonError, jsonOk } from "@/lib/http";
import { createPasskeyLoginOptions } from "@/lib/passkey";

export async function POST() {
  try {
    const options = await createPasskeyLoginOptions();
    return jsonOk({ options });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create passkey login options", 400);
  }
}
