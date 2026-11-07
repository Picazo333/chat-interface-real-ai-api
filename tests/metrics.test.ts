import { describe, expect, it } from "vitest";
import { accumulateUsage, tokensPerSecond, usageMismatch } from "../lib/metrics";

describe("accumulateUsage", () => {
  it("sums prompt, completion and total independently across the session", () => {
    const totals = accumulateUsage([
      { usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 } },
      {},
      { usage: { prompt_tokens: 22, completion_tokens: 7, total_tokens: 30 } },
    ]);

    expect(totals).toEqual({
      prompt_tokens: 32,
      completion_tokens: 11,
      total_tokens: 44,
    });
  });

  it("does not rewrite a provider total that does not match the sum", () => {
    const usage = { prompt_tokens: 3, completion_tokens: 5, total_tokens: 9 };
    expect(usageMismatch(usage)).toBe(true);
    expect(accumulateUsage([{ usage }]).total_tokens).toBe(9);
  });

  it("uses Groq completion_time for tokens per second when it is present", () => {
    expect(tokensPerSecond(8, 900, 0.4)).toBe(20);
  });

  it("falls back to the measured request time when Groq omits completion_time", () => {
    expect(tokensPerSecond(10, 500, null)).toBe(20);
  });
});
