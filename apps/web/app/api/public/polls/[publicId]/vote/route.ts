import { submitVote } from "@/lib/poll-service";
import { jsonError, jsonOk } from "@/lib/http";

export async function POST(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await params;
    const body = await req.json();
    await submitVote(publicId, body);
    return jsonOk({ ok: true }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to submit vote", 400);
  }
}
