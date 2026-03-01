import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireCreatorUser } from "@/lib/session";

export async function POST(_: Request, { params }: { params: Promise<{ pollId: string }> }) {
  try {
    const user = await requireCreatorUser();
    const { pollId } = await params;

    const updated = await prisma.poll.updateMany({
      where: { id: pollId, creatorId: user.id },
      data: { status: "OPEN", opensAt: new Date() }
    });

    if (updated.count === 0) return jsonError("Poll not found", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to open poll", 400);
  }
}
