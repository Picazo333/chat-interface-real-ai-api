import { describe, expect, it } from "vitest";
import { clearSession, loadSession, saveSession } from "../lib/session-storage";
import { SESSION_STORAGE_KEY, type SessionSnapshot } from "../lib/types";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

const session: SessionSnapshot = {
  version: 1,
  messages: [
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
      usage: { prompt_tokens: 1, completion_tokens: 6, total_tokens: 7 },
      metrics: { responseTimeMs: 126, tokensPerSecond: 47.62, providerCompletionTimeSec: null },
    },
  ],
};

describe("session storage", () => {
  it("round-trips the conversation and usage", () => {
    const storage = memoryStorage();
    saveSession(storage, session);
    expect(loadSession(storage)).toEqual({ status: "ok", session });
  });

  it("reports an empty browser store", () => {
    expect(loadSession(memoryStorage())).toEqual({ status: "empty" });
  });

  it("does not treat corrupt JSON as an empty session", () => {
    const storage = memoryStorage();
    storage.setItem(SESSION_STORAGE_KEY, "{");
    expect(loadSession(storage).status).toBe("invalid");
  });

  it("wipes the saved key", () => {
    const storage = memoryStorage();
    saveSession(storage, session);
    clearSession(storage);
    expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(loadSession(storage).status).toBe("empty");
  });
});
