import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/http";
import { requireCreatorUser } from "@/lib/session";
import { addEmailToUser } from "@/lib/auth-service";

const schema = z.object({
  email: z.string().email()
});

export async function POST(req: Request) {
  try {
    const user = await requireCreatorUser();
    const body = schema.parse(await req.json());

    await addEmailToUser(user.id, body.email);

    return jsonOk({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid email format", 400);
    }
    return jsonError(error instanceof Error ? error.message : "Failed to add email", 400);
  }
}
