import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/http";
import { requireCreatorUser } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional(),
  requireVoterName: z.boolean().optional(),
  showVoterNamesInResults: z.boolean().optional(),
  showNameToBallotMapping: z.boolean().optional(),
  maxVoters: z.number().int().min(1).max(100000).optional(),
  closesAt: z.string().datetime().nullable().optional()
});

export async function PATCH(req: Request, { params }: { params: Promise<{ pollId: string }> }) {
  try {
    const user = await requireCreatorUser();
    const { pollId } = await params;
    const body = updateSchema.parse(await req.json());

    const updated = await prisma.poll.updateMany({
      where: { id: pollId, creatorId: user.id },
      data: {
        ...body,
        closesAt: body.closesAt ? new Date(body.closesAt) : body.closesAt
      }
    });

    if (updated.count === 0) return jsonError("Poll not found", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update poll", 400);
  }
}
