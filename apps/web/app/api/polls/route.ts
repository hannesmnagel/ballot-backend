import { jsonError, jsonOk } from "@/lib/http";
import { requireCreatorUser } from "@/lib/session";
import { createPoll } from "@/lib/poll-service";

export async function POST(req: Request) {
  try {
    const user = await requireCreatorUser();
    const body = await req.json();
    const poll = await createPoll(user.id, body);
    return jsonOk({
      id: poll.id,
      publicId: poll.publicId,
      status: poll.status
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create poll";
    return jsonError(message, message === "UNAUTHORIZED" ? 401 : 400);
  }
}
