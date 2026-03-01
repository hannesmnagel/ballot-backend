import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/http";
import { verifyEmailByToken } from "@/lib/auth-service";

const schema = z.object({ token: z.string().min(12) });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await verifyEmailByToken(body.token);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to verify email", 400);
  }
}
