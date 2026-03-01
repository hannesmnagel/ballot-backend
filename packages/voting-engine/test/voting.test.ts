import { describe, it, expect } from "vitest";
import { deterministicTieBreak, runCondorcetSchulze, runRcv, runStar } from "../src";

describe("deterministic tie break", () => {
  it("is reproducible for same seed", () => {
    const first = deterministicTieBreak(["a", "b", "c"], "seed-1");
    const second = deterministicTieBreak(["a", "b", "c"], "seed-1");
    expect(first).toBe(second);
  });
});

describe("RCV", () => {
  it("eliminates lowest and finds winner", () => {
    const candidates = ["a", "b", "c"];
    const ballots = [
      ["a", "b", "c"],
      ["a", "b", "c"],
      ["b", "c", "a"],
      ["c", "b", "a"]
    ];
    const result = runRcv(candidates, ballots, deterministicTieBreak, "x");
    expect(result.winner).toBe("b");
    expect(result.rounds?.length).toBeGreaterThan(0);
  });
});

describe("Condorcet Schulze", () => {
  it("produces pairwise matrix and winner", () => {
    const candidates = ["a", "b", "c"];
    const ballots = [
      ["a", "b", "c"],
      ["a", "c", "b"],
      ["b", "c", "a"],
      ["c", "a", "b"]
    ];
    const result = runCondorcetSchulze(candidates, ballots, deterministicTieBreak, "y");
    expect(result.winner).toBeTruthy();
    expect(result.pairwise?.a?.b).toBeTypeOf("number");
  });
});

describe("STAR", () => {
  it("selects top two and runoff winner", () => {
    const candidates = ["a", "b", "c"];
    const ballots = [
      { a: 5, b: 3, c: 0 },
      { a: 4, b: 5, c: 0 },
      { a: 0, b: 4, c: 5 },
      { a: 5, b: 2, c: 1 }
    ];
    const result = runStar(candidates, ballots, deterministicTieBreak, "z");
    expect(result.runoff?.finalists.length).toBe(2);
    expect(result.winner).toBeTruthy();
  });
});
