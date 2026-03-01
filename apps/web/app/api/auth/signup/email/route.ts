import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/http";
import { signupWithEmail } from "@/lib/auth-service";
import { createCreatorSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const user = await signupWithEmail(body.email.toLowerCase(), body.password);
    await createCreatorSession(user.id);
    return jsonOk({ userId: user.id, email: user.email }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to signup", 400);
  }
}
