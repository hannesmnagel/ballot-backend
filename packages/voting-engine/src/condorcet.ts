import type { RankedBallot, ElectionResult, TieBreakFn } from "./types";

export function runCondorcetSchulze(
  candidates: string[],
  ballots: RankedBallot[],
  tieBreak: TieBreakFn,
  seed: string
): ElectionResult {
  const pairwise: Record<string, Record<string, number>> = {};

  for (const a of candidates) {
    pairwise[a] = {};
    for (const b of candidates) {
      if (a !== b) pairwise[a][b] = 0;
    }
  }

  for (const ballot of ballots) {
    const rank = new Map<string, number>();
    ballot.forEach((c, i) => rank.set(c, i));
    for (const a of candidates) {
      for (const b of candidates) {
        if (a === b) continue;
        if ((rank.get(a) ?? Infinity) < (rank.get(b) ?? Infinity)) {
          pairwise[a][b] += 1;
        }
      }
    }
  }

  const p: Record<string, Record<string, number>> = {};
  for (const i of candidates) {
    p[i] = {};
    for (const j of candidates) {
      if (i === j) continue;
      p[i][j] = pairwise[i][j] > pairwise[j][i] ? pairwise[i][j] : 0;
    }
  }

  for (const i of candidates) {
    for (const j of candidates) {
      if (i === j) continue;
      for (const k of candidates) {
        if (i === k || j === k) continue;
        p[j][k] = Math.max(p[j][k], Math.min(p[j][i], p[i][k]));
      }
    }
  }

  const aggregate: Record<string, number> = {};
  for (const a of candidates) {
    let score = 0;
    for (const b of candidates) {
      if (a === b) continue;
      if (p[a][b] > p[b][a]) score += 1;
    }
    aggregate[a] = score;
  }

  const best = Math.max(...Object.values(aggregate));
  const top = Object.entries(aggregate)
    .filter(([, s]) => s === best)
    .map(([id]) => id);

  return {
    winner: top.length === 1 ? top[0] : tieBreak(top, seed),
    aggregate,
    pairwise
  };
}
