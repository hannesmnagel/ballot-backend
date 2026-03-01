import type { StarBallot, ElectionResult, TieBreakFn } from "./types";

export function runStar(
  candidates: string[],
  ballots: StarBallot[],
  tieBreak: TieBreakFn,
  seed: string
): ElectionResult {
  const aggregate: Record<string, number> = Object.fromEntries(candidates.map((c) => [c, 0]));

  for (const ballot of ballots) {
    for (const candidate of candidates) {
      aggregate[candidate] += ballot[candidate] ?? 0;
    }
  }

  const ordered = [...candidates].sort((a, b) => aggregate[b] - aggregate[a]);
  let finalists = ordered.slice(0, 2);

  if (finalists.length < 2) {
    return { winner: finalists[0] ?? null, aggregate };
  }

  const secondScore = aggregate[finalists[1]];
  const tiedForSecond = candidates.filter((c) => aggregate[c] === secondScore);
  if (tiedForSecond.length > 1 && !tiedForSecond.includes(finalists[0])) {
    finalists = [finalists[0], tieBreak(tiedForSecond, seed)];
  }

  const [a, b] = finalists as [string, string];
  const runoffVotes: Record<string, number> = { [a]: 0, [b]: 0 };

  for (const ballot of ballots) {
    const scoreA = ballot[a] ?? 0;
    const scoreB = ballot[b] ?? 0;
    if (scoreA > scoreB) runoffVotes[a] += 1;
    else if (scoreB > scoreA) runoffVotes[b] += 1;
  }

  let winner: string;
  if (runoffVotes[a] === runoffVotes[b]) {
    winner = tieBreak([a, b], seed);
  } else {
    winner = runoffVotes[a] > runoffVotes[b] ? a : b;
  }

  return {
    winner,
    aggregate,
    runoff: { finalists: [a, b], votes: runoffVotes }
  };
}
