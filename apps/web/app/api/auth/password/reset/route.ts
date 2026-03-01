import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/http";
import { resetPassword } from "@/lib/auth-service";

const schema = z.object({
  token: z.string().min(12),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await resetPassword(body.token, body.password);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to reset password", 400);
  }
}
