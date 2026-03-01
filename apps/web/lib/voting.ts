import type { Poll, PollOption, Vote, RankedBallotEntry, StarBallotScore } from "@prisma/client";
import type { PollResultsView, VotingMethod } from "@ballot/shared";
import { deterministicTieBreak, runCondorcetSchulze, runRcv, runStar } from "@ballot/voting-engine";

type VoteWithEntries = Vote & {
  rankedEntries: RankedBallotEntry[];
  starScores: StarBallotScore[];
};

type PollWithOptions = Poll & { options: PollOption[] };

export function computePollResults(poll: PollWithOptions, votes: VoteWithEntries[]): PollResultsView {
  const optionIds = poll.options.sort((a, b) => a.orderIndex - b.orderIndex).map((o) => o.id);
  const seed = poll.seedForTiebreak;

  let result;
  if (poll.method === "RCV") {
    const ballots = votes.map((v) =>
      v.rankedEntries.sort((a, b) => a.rank - b.rank).map((e) => e.optionId)
    );
    result = runRcv(optionIds, ballots, deterministicTieBreak, seed);
  } else if (poll.method === "CONDORCET") {
    const ballots = votes.map((v) =>
      v.rankedEntries.sort((a, b) => a.rank - b.rank).map((e) => e.optionId)
    );
    result = runCondorcetSchulze(optionIds, ballots, deterministicTieBreak, seed);
  } else {
    const ballots = votes.map((v) =>
      v.starScores.reduce<Record<string, number>>((acc, s) => {
        acc[s.optionId] = s.score;
        return acc;
      }, {})
    );
    result = runStar(optionIds, ballots, deterministicTieBreak, seed);
  }

  const base: PollResultsView = {
    pollId: poll.publicId,
    method: poll.method as VotingMethod,
    winnerOptionId: result.winner,
    aggregate: result.aggregate,
    rounds: result.rounds,
    pairwise: result.pairwise,
    runoff: result.runoff
  };

  if (poll.showVoterNamesInResults) {
    base.voterNames = votes.map((v) => v.voterName).filter((name): name is string => Boolean(name));
  }

  if (poll.showVoterNamesInResults && poll.showNameToBallotMapping) {
    base.voterBallotMap = votes
      .filter((v) => Boolean(v.voterName))
      .map((v) => ({
        voterName: v.voterName as string,
        ballot:
          poll.method === "STAR"
            ? v.starScores.reduce<Record<string, number>>((acc, score) => {
                acc[score.optionId] = score.score;
                return acc;
              }, {})
            : v.rankedEntries.sort((a, b) => a.rank - b.rank).map((e) => e.optionId)
      }));
  }

  return base;
}
