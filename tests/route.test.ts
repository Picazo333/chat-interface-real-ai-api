import { afterEach, describe, expect, it } from "vitest";
import { GET, POST } from "../app/api/chat/route";

const original = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL,
  CHAT_MODE: process.env.CHAT_MODE,
  MOCK_LATENCY_MS: process.env.MOCK_LATENCY_MS,
};

afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function useMockMode() {
  delete process.env.GROQ_API_KEY;
  process.env.GROQ_MODEL = "qwen/qwen3.6-27b";
  process.env.CHAT_MODE = "mock";
  process.env.MOCK_LATENCY_MS = "0";
}

describe("POST /api/chat", () => {
  it("returns a demonstration completion and the configured model", async () => {
    useMockMode();
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Hola" },
            { role: "assistant", content: "Respuesta previa" },
            { role: "user", content: "Sigue" },
          ],
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.source).toBe("mock");
    expect(body.model).toBe("qwen/qwen3.6-27b");
    expect(body.message.content).toMatch(/Turnos de usuario en el historial enviado: 2/);
    expect(body.usage.prompt_tokens).toBeGreaterThan(0);
    expect(body.usage.completion_tokens).toBeGreaterThan(0);
    expect(body.usage.total_tokens).toBe(body.usage.prompt_tokens + body.usage.completion_tokens);
  });

  it("rejects an empty history with a readable message", async () => {
    useMockMode();
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/mensaje/i);
  });

  it("reports mock mode without exposing a key", async () => {
    useMockMode();
    const response = await GET();
    const body = await response.json();
    expect(body).toEqual({
      mode: "mock",
      requestedMode: "mock",
      model: "qwen/qwen3.6-27b",
      keyConfigured: false,
    });
    expect(JSON.stringify(body)).not.toMatch(/GROQ_API_KEY|gsk_/);
  });
});
