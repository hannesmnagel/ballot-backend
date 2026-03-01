import { getPollResults } from "@/lib/poll-service";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(_: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const results = await getPollResults(publicId);
  if (!results) return jsonError("Poll not found", 404);
  return jsonOk(results);
}
