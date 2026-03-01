export type RankedBallot = string[];
export type StarBallot = Record<string, number>;

export type ElectionResult = {
  winner: string | null;
  aggregate: Record<string, number>;
  rounds?: Array<Record<string, number>>;
  pairwise?: Record<string, Record<string, number>>;
  runoff?: { finalists: [string, string]; votes: Record<string, number> };
};

export type TieBreakFn = (candidates: string[], seed: string) => string;
