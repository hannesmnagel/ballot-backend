import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireCreatorUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireCreatorUser();
    const polls = await prisma.poll.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { votes: true } } }
    });

    return jsonOk(
      polls.map((p) => ({
        id: p.id,
        publicId: p.publicId,
        title: p.title,
        method: p.method,
        status: p.status,
        votes: p._count.votes,
        maxVoters: p.maxVoters
      }))
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized", 401);
  }
}
