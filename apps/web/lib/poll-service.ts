import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { parseCreatePollInput, parseRankedVote, parseStarVote } from "./validation";
import { randomToken } from "./crypto";
import { computePollResults } from "./voting";

function voterCookieName(publicId: string) {
  return `poll_voter_${publicId}`;
}

function hashVoterToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPoll(creatorId: string, input: unknown) {
  const parsed = parseCreatePollInput(input);
  const publicId = randomToken(8);

  const poll = await prisma.poll.create({
    data: {
      publicId,
      creatorId,
      title: parsed.title,
      description: parsed.description,
      method: parsed.method,
      maxVoters: parsed.maxVoters,
      requireVoterName: parsed.requireVoterName,
      showVoterNamesInResults: parsed.showVoterNamesInResults,
      showNameToBallotMapping: parsed.showNameToBallotMapping,
      seedForTiebreak: randomToken(12),
      opensAt: parsed.opensAt ? new Date(parsed.opensAt) : null,
      closesAt: parsed.closesAt ? new Date(parsed.closesAt) : null,
      options: {
        create: parsed.options.map((label, index) => ({
          label,
          orderIndex: index
        }))
      }
    },
    include: { options: true }
  });

  return poll;
}

export async function submitVote(publicId: string, body: unknown) {
  const poll = await prisma.poll.findUnique({
    where: { publicId },
    include: { options: true }
  });

  if (!poll) throw new Error("Poll not found");
  if (poll.status !== "OPEN") throw new Error("Poll is not open");
  if (poll.closesAt && poll.closesAt < new Date()) throw new Error("Poll is closed");

  const currentVotes = await prisma.vote.count({ where: { pollId: poll.id } });
  if (currentVotes >= poll.maxVoters) throw new Error("Maximum voters reached");

  const cookieStore = await cookies();
  let voterToken = cookieStore.get(voterCookieName(publicId))?.value;
  if (!voterToken) {
    voterToken = randomToken(24);
    // IMPORTANT: secure must be false for localhost/HTTP, true only for production HTTPS
    const isSecure = process.env.NODE_ENV === "production" && !process.env.PASSKEY_ORIGIN?.includes("localhost");
    cookieStore.set(voterCookieName(publicId), voterToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });
  }

  const tokenHash = hashVoterToken(voterToken);
  const existingSession = await prisma.pollVoterSession.findUnique({
    where: {
      pollId_tokenHash: {
        pollId: poll.id,
        tokenHash
      }
    }
  });

  if (existingSession) {
    throw new Error("This device already voted on this poll");
  }

  if (poll.method === "STAR") {
    const parsed = parseStarVote(body);
    if (poll.requireVoterName && !parsed.voterName?.trim()) {
      throw new Error("Voter name required for this poll");
    }

    const validOptionIds = new Set(poll.options.map((o) => o.id));
    if (parsed.scores.length !== poll.options.length) {
      throw new Error("All options must be scored");
    }

    for (const entry of parsed.scores) {
      if (!validOptionIds.has(entry.optionId)) {
        throw new Error("Invalid option in ballot");
      }
    }

    const seen = new Set(parsed.scores.map((s) => s.optionId));
    if (seen.size !== poll.options.length) {
      throw new Error("Duplicate or missing option scores");
    }

    await prisma.$transaction(async (tx) => {
      const voterSession = await tx.pollVoterSession.create({
        data: { pollId: poll.id, tokenHash }
      });

      const vote = await tx.vote.create({
        data: {
          pollId: poll.id,
          pollVoterSessionId: voterSession.id,
          voterName: parsed.voterName?.trim() || null
        }
      });

      await tx.starBallotScore.createMany({
        data: parsed.scores.map((entry) => ({
          voteId: vote.id,
          optionId: entry.optionId,
          score: entry.score
        }))
      });
    });
  } else {
    const parsed = parseRankedVote(body);
    if (poll.requireVoterName && !parsed.voterName?.trim()) {
      throw new Error("Voter name required for this poll");
    }

    const validOptionIds = new Set(poll.options.map((o) => o.id));
    if (parsed.rankings.length !== poll.options.length) {
      throw new Error("All options must be ranked");
    }

    const seenOptions = new Set<string>();
    const seenRanks = new Set<number>();
    for (const entry of parsed.rankings) {
      if (!validOptionIds.has(entry.optionId)) throw new Error("Invalid option in ranking");
      if (seenOptions.has(entry.optionId)) throw new Error("Duplicate ranked option");
      if (seenRanks.has(entry.rank)) throw new Error("Duplicate rank value");
      seenOptions.add(entry.optionId);
      seenRanks.add(entry.rank);
    }

    const expectedRanks = new Set(Array.from({ length: poll.options.length }, (_, i) => i + 1));
    for (const rank of expectedRanks) {
      if (!seenRanks.has(rank)) throw new Error("Ranks must be unique and continuous from 1..n");
    }

    await prisma.$transaction(async (tx) => {
      const voterSession = await tx.pollVoterSession.create({
        data: { pollId: poll.id, tokenHash }
      });

      const vote = await tx.vote.create({
        data: {
          pollId: poll.id,
          pollVoterSessionId: voterSession.id,
          voterName: parsed.voterName?.trim() || null
        }
      });

      await tx.rankedBallotEntry.createMany({
        data: parsed.rankings.map((entry) => ({
          voteId: vote.id,
          optionId: entry.optionId,
          rank: entry.rank
        }))
      });
    });
  }

  return { ok: true };
}

export async function getPublicPoll(publicId: string) {
  const poll = await prisma.poll.findUnique({
    where: { publicId },
    include: { options: { orderBy: { orderIndex: "asc" } }, _count: { select: { votes: true } } }
  });

  if (!poll) return null;

  // Check if this device has already voted
  const cookieStore = await cookies();
  const voterToken = cookieStore.get(voterCookieName(publicId))?.value;
  let hasVoted = false;

  if (voterToken) {
    const tokenHash = hashVoterToken(voterToken);
    const existingSession = await prisma.pollVoterSession.findUnique({
      where: {
        pollId_tokenHash: {
          pollId: poll.id,
          tokenHash
        }
      }
    });
    hasVoted = !!existingSession;
  }

  return {
    pollId: poll.publicId,
    title: poll.title,
    description: poll.description,
    method: poll.method,
    status: poll.status,
    options: poll.options.map((o) => ({ id: o.id, label: o.label })),
    requireVoterName: poll.requireVoterName,
    maxVoters: poll.maxVoters,
    votesCast: poll._count.votes,
    closesAt: poll.closesAt?.toISOString() ?? null,
    hasVoted
  };
}

export async function getPollResults(publicId: string) {
  const poll = await prisma.poll.findUnique({
    where: { publicId },
    include: {
      options: true,
      votes: {
        include: {
          rankedEntries: true,
          starScores: true
        }
      }
    }
  });

  if (!poll) return null;
  return computePollResults(poll, poll.votes);
}
