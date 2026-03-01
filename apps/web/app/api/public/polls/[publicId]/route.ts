import { getPublicPoll } from "@/lib/poll-service";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(_: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const poll = await getPublicPoll(publicId);
  if (!poll) return jsonError("Poll not found", 404);
  return jsonOk(poll);
}
