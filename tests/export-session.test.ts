import { describe, expect, it } from "vitest";
import { buildSessionExport } from "../lib/export-session";
import type { ChatMessage } from "../lib/types";

describe("buildSessionExport", () => {
  it("includes the local history, per-turn usage and session totals", () => {
    const messages: ChatMessage[] = [
      {
        id: "u1",
        role: "user",
        content: "Hola",
        createdAt: "2026-11-06T07:00:00.000Z",
      },
      {
        id: "a1",
        role: "assistant",
        content: "Respuesta de demostración.",
        createdAt: "2026-11-06T07:00:01.000Z",
        source: "mock",
        model: "qwen/qwen3.6-27b",
        usage: { prompt_tokens: 1, completion_tokens: 4, total_tokens: 5 },
        metrics: { responseTimeMs: 124, tokensPerSecond: 32.26, providerCompletionTimeSec: null },
      },
    ];

    const exported = buildSessionExport(messages, "2026-11-06T07:10:00.000Z");

    expect(exported.exportedAt).toBe("2026-11-06T07:10:00.000Z");
    expect(exported.disclaimer).toMatch(/mock/);
    expect(exported.totals).toEqual({ prompt_tokens: 1, completion_tokens: 4, total_tokens: 5 });
    expect(exported.turns).toHaveLength(2);
    expect(exported.turns[1]).toMatchObject({
      role: "assistant",
      source: "mock",
      model: "qwen/qwen3.6-27b",
      responseTimeMs: 124,
    });
  });
});
