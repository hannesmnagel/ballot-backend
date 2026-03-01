import { createHash } from "node:crypto";
import type { TieBreakFn } from "./types";

export const deterministicTieBreak: TieBreakFn = (candidates, seed) => {
  const sorted = [...candidates].sort();
  let winner = sorted[0];
  let best = "";

  for (const candidate of sorted) {
    const digest = createHash("sha256").update(`${seed}:${candidate}`).digest("hex");
    if (digest > best) {
      best = digest;
      winner = candidate;
    }
  }

  return winner;
};
