import type { RankedBallot, ElectionResult, TieBreakFn } from "./types";

export function runRcv(
  candidates: string[],
  ballots: RankedBallot[],
  tieBreak: TieBreakFn,
  seed: string
): ElectionResult {
  let active = new Set(candidates);
  const rounds: Array<Record<string, number>> = [];

  while (active.size > 1) {
    const tally: Record<string, number> = Object.fromEntries([...active].map((c) => [c, 0]));

    for (const ballot of ballots) {
      const pick = ballot.find((c) => active.has(c));
      if (pick) tally[pick] += 1;
    }

    rounds.push({ ...tally });

    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    const majority = Object.entries(tally).find(([, v]) => v > total / 2);
    if (majority) {
      return {
        winner: majority[0],
        aggregate: tally,
        rounds
      };
    }

    const minVotes = Math.min(...Object.values(tally));
    const lowest = Object.entries(tally)
      .filter(([, votes]) => votes === minVotes)
      .map(([id]) => id);

    const toEliminate = lowest.length === 1 ? lowest[0] : tieBreak(lowest, seed);
    active.delete(toEliminate);
  }

  const winner = [...active][0] ?? null;
  const lastRound = rounds[rounds.length - 1] ?? {};
  return { winner, aggregate: lastRound, rounds };
}
