import { z } from "zod";
import { issuePasswordReset } from "@/lib/auth-service";
import { jsonError, jsonOk } from "@/lib/http";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await issuePasswordReset(body.email.toLowerCase());
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to issue reset", 400);
  }
}
