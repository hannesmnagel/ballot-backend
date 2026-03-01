import { describe, it, expect } from "vitest";
import { createPollInputSchema } from "@ballot/shared";

describe("create poll schema", () => {
  it("rejects too few options", () => {
    const result = createPollInputSchema.safeParse({
      title: "Test",
      method: "RCV",
      options: ["only one"],
      maxVoters: 5
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid payload", () => {
    const result = createPollInputSchema.safeParse({
      title: "Test",
      method: "STAR",
      options: ["a", "b"],
      maxVoters: 10
    });
    expect(result.success).toBe(true);
  });
});
